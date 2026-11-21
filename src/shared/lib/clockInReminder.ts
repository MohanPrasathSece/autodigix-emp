import { supabase } from '@/lib/supabaseClient';
import { getLocalToday, parseLeaveDate } from './dateUtils';

/**
 * Checks all active employees at/after 9:35 AM on working days:
 * If an employee has NOT clocked in and is NOT on approved leave or absent,
 * sends them an automated email reminder to clock in.
 *
 * Guaranteed strictly ONCE per employee per day via Supabase notifications check & localStorage.
 */
export async function checkAndSendClockInReminders(): Promise<{ checked: boolean; sentCount: number }> {
  try {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 6 = Sat
    if (day === 0 || day === 6) {
      return { checked: true, sentCount: 0 }; // Weekends: skip
    }

    const currentMins = now.getHours() * 60 + now.getMinutes();
    const reminderStartMins = 9 * 60 + 35;  // 9:35 AM
    const shiftEndMins = 18 * 60 + 30;       // 6:30 PM

    // Only run between 9:35 AM and 6:30 PM
    if (currentMins < reminderStartMins || currentMins >= shiftEndMins) {
      return { checked: true, sentCount: 0 };
    }

    const todayStr = getLocalToday();

    // 1. Check if today is a public holiday
    const { data: holidays } = await supabase
      .from('holidays')
      .select('date');

    const isHoliday = (holidays || []).some((h: any) => {
      const parsed = parseLeaveDate(h.date);
      return parsed ? String(h.date).slice(0, 10) === todayStr : false;
    });

    if (isHoliday) {
      return { checked: true, sentCount: 0 }; // Public holiday: skip
    }

    // 2. Fetch all active employees (excluding Super Admin & Terminated)
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select('id, name, email, payslip_email, status, role')
      .neq('status', 'Terminated')
      .neq('id', 'EMP-000');

    if (empErr || !employees || employees.length === 0) {
      return { checked: false, sentCount: 0 };
    }

    // 3. Fetch today's attendance records to see who already clocked in
    const { data: todayAttendance } = await supabase
      .from('attendance_history')
      .select('employee_id, status')
      .eq('date', todayStr);

    const clockedInEmpIds = new Set(
      (todayAttendance || []).map((a: any) => a.employee_id)
    );

    // 4. Fetch approved leaves covering today to exclude absent / on-leave employees
    const { data: approvedLeaves } = await supabase
      .from('leave_requests')
      .select('employee_id, from_date, to_date, status')
      .eq('status', 'Approved');

    const onLeaveEmpIds = new Set<string>();
    const todayDateObj = new Date();
    todayDateObj.setHours(0, 0, 0, 0);

    for (const leave of approvedLeaves || []) {
      const from = parseLeaveDate(leave.from_date);
      const to = parseLeaveDate(leave.to_date);
      if (from && to && todayDateObj >= from && todayDateObj <= to) {
        onLeaveEmpIds.add(leave.employee_id);
      }
    }

    // 5. Fetch marked absent dates for today
    const { data: absentRows } = await supabase
      .from('absent_dates')
      .select('employee_id')
      .eq('date', todayStr);

    for (const row of absentRows || []) {
      onLeaveEmpIds.add(row.employee_id);
    }

    // 6. Check who has already received a clock-in reminder email today (anti-spam / idempotency)
    const { data: alreadySentNotifications } = await supabase
      .from('notifications')
      .select('target_id')
      .eq('tone', 'clock_in_reminder')
      .eq('time', todayStr);

    const alreadyRemindedIds = new Set(
      (alreadySentNotifications || []).map((n: any) => n.target_id)
    );

    // 7. Find eligible employees to notify
    const eligibleEmployees = employees.filter((emp: any) => {
      if ((emp.email || '').toLowerCase() === 'admin@company.com') return false;
      if (clockedInEmpIds.has(emp.id)) return false; // Already clocked in
      if (onLeaveEmpIds.has(emp.id)) return false;   // On leave or marked absent
      if (alreadyRemindedIds.has(emp.id)) return false; // Already notified today

      // Local storage check fallback for extra client protection
      if (typeof window !== 'undefined') {
        const localFlag = localStorage.getItem(`clock_in_reminder_${emp.id}_${todayStr}`);
        if (localFlag) return false;
      }

      return true;
    });

    if (eligibleEmployees.length === 0) {
      return { checked: true, sentCount: 0 };
    }

    const apiUrl = import.meta.env.VITE_API_URL || '';
    let sentCount = 0;

    for (const emp of eligibleEmployees) {
      const targetEmail = emp.payslip_email || emp.email;
      if (!targetEmail) continue;

      const subject = `⏰ Shift Started: Please Clock In (Autodigix HR)`;
      const text = `Hi ${emp.name},\n\nThis is a reminder that today's work shift started at 9:30 AM, and our records show you have not clocked in yet.\n\nIf you are working today, please log in and start your timer:\nhttps://autodigix-emp.vercel.app/\n\nIf you are on leave or had prior approval, please ignore this email.\n\nAutodigix HR`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #1e293b; padding: 22px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold;">⏰ Shift Started: Please Clock In</h2>
            <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">Autodigix HR Attendance Reminder</p>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.7;">
            <p style="font-size: 15px; margin-top: 0;">Hi <strong>${emp.name}</strong>,</p>
            <p>This is a friendly reminder that today's shift began at <strong>9:30 AM</strong>, and our system shows you have not clocked in yet.</p>
            <p>If you are working today, please log in to the portal and start your work timer so your attendance and shift hours are recorded accurately:</p>
            <div style="text-align: center; margin: 26px 0;">
              <a href="https://autodigix-emp.vercel.app/" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">Clock In Now →</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">If you have already applied for leave or received prior manager authorization, you may safely disregard this reminder.</p>
          </div>
        </div>
      `;

      try {
        await fetch(`${apiUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetEmail,
            subject,
            text,
            html,
          }),
        });

        // Record in notifications table to prevent any duplicate dispatch across devices
        await supabase.from('notifications').insert([{
          target_id: emp.id,
          title: `Clock-In Reminder sent`,
          body: `Shift started at 9:30 AM. Attendance reminder dispatched to ${targetEmail}.`,
          time: todayStr,
          tone: 'clock_in_reminder',
        }]);

        if (typeof window !== 'undefined') {
          localStorage.setItem(`clock_in_reminder_${emp.id}_${todayStr}`, '1');
        }

        sentCount++;
      } catch (err) {
        console.warn(`Failed to dispatch 9:35 AM clock-in reminder to ${targetEmail}:`, err);
      }
    }

    return { checked: true, sentCount };
  } catch (error) {
    console.error('Error running clock-in reminder check:', error);
    return { checked: false, sentCount: 0 };
  }
}
