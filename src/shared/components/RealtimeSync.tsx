import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { checkAndProcessMonthEndPayroll } from '../lib/monthEndPayroll';
import { checkAndSendClockInReminders } from '../lib/clockInReminder';
import { getLocalToday } from '../lib/dateUtils';

// Auto-close any open sessions left unclosed past 6:30 PM or from previous days
async function autoCloseExpiredAttendance() {
  try {
    const now = new Date();
    const todayStr = getLocalToday();
    const isPast630Today = now.getHours() > 18 || (now.getHours() === 18 && now.getMinutes() >= 30);

    const { data: openSessions, error } = await supabase
      .from('attendance_history')
      .select('id, employee_id, date, clock_in_time, hours')
      .eq('status', 'Clocked In');

    if (error || !openSessions || openSessions.length === 0) return false;

    let updatedAny = false;

    for (const session of openSessions) {
      const isToday = session.date === todayStr;
      if (!isToday || isPast630Today) {
        const inDate = new Date(session.clock_in_time || `${session.date}T09:30:00`);
        const shiftEndDate = new Date(inDate);
        shiftEndDate.setHours(18, 30, 0, 0);

        const effectiveEnd = shiftEndDate.getTime() > inDate.getTime() ? shiftEndDate : new Date(inDate.getTime() + 60000);
        const diffMs = Math.max(0, effectiveEnd.getTime() - inDate.getTime());
        const sessionHours = diffMs / 3600000;
        const totalHours = Number(((Number(session.hours) || 0) + sessionHours).toFixed(2));

        await supabase
          .from('attendance_history')
          .update({
            status: 'Clocked Out',
            clock_out_time: effectiveEnd.toISOString(),
            hours: totalHours,
          })
          .eq('id', session.id);

        updatedAny = true;
      }
    }

    return updatedAny;
  } catch (err) {
    console.warn("Failed to auto-close expired attendance:", err);
    return false;
  }
}

export function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Automatically check and process month-end payroll & email payslips if due
    checkAndProcessMonthEndPayroll().then((result) => {
      if (result.processed) {
        queryClient.invalidateQueries({ queryKey: ['payslips'] });
        queryClient.invalidateQueries({ queryKey: ['payrollTrend'] });
      }
    });

    // Check on startup and close any sessions where shift ended at 6:30 PM
    autoCloseExpiredAttendance().then((updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
        queryClient.invalidateQueries({ queryKey: ['attendanceTrend'] });
      }
    });

    // Check on startup if 9:35 AM clock-in reminder emails should be sent
    checkAndSendClockInReminders();

    // Periodically re-check every minute:
    // 1) Auto-close open shifts right at 6:30 PM
    // 2) Trigger 9:35 AM reminder emails if due
    const shiftInterval = setInterval(() => {
      autoCloseExpiredAttendance().then((updated) => {
        if (updated) {
          queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
          queryClient.invalidateQueries({ queryKey: ['attendanceTrend'] });
        }
      });
      checkAndSendClockInReminders();
    }, 60000);

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        // Invalidate queries based on the table that changed
        if (payload.table === 'notifications') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } else if (payload.table === 'attendance_history') {
          queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
          queryClient.invalidateQueries({ queryKey: ['attendanceTrend'] });
        } else if (payload.table === 'leave_requests') {
          queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
        } else if (payload.table === 'employees') {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
          queryClient.invalidateQueries({ queryKey: ['departmentSplit'] });
        } else if (payload.table === 'payslips') {
          queryClient.invalidateQueries({ queryKey: ['payslips'] });
          queryClient.invalidateQueries({ queryKey: ['payrollTrend'] });
        } else if (payload.table === 'holidays') {
          queryClient.invalidateQueries({ queryKey: ['holidays'] });
        }
      })
      .subscribe();

    return () => {
      clearInterval(shiftInterval);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}
