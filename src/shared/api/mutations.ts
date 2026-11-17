import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { serverLog } from '../lib/logger';
import { getLocalToday, getMonthKey, parseLeaveDate, toLocalISO } from '../lib/dateUtils';
import { syncAttendanceToSheet, formatClockTime } from '../lib/googleSheets';
import { computeLeaveLopDays, sumLopDaysForMonth, type LeaveLike } from '../lib/lopUtils';
import confetti from 'canvas-confetti';
import { generatePayslipPDFBase64 } from '../lib/pdfGenerator';

// Leave requests are routed to this address for approval (Vini).
const ADMIN_NOTIFICATION_EMAIL =
  (import.meta.env.VITE_ADMIN_NOTIFICATION_EMAIL as string) || 'vini@autodigix.in';

/** Generate a globally unique leave request id (works for TEXT and UUID columns). */
const generateId = (): string =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `LV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
  pdfBase64?: string,
  filename?: string
): Promise<boolean> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${apiUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        text,
        html: html || `<p>${text.replace(/\n/g, '<br/>')}</p>`,
        pdfBase64,
        filename,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Failed to dispatch email:', err);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to dispatch email:', error);
    return false;
  }
};

export const useUpdateLeaveRequestStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, email, name }: { id: string; status: 'Approved' | 'Rejected', email?: string, name?: string }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status })
        .eq('id', id)
        .select();

      if (error) throw new Error(error.message);
      return { data, status, email, name, id };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });

      const leaveReq = result.data && result.data[0];
      if (!leaveReq) return;

      // Resolve the employee's email so the decision notification reaches them.
      let employeeEmail = result.email;
      let employeeName = result.name || leaveReq.name;
      if (!employeeEmail && leaveReq.employee_id) {
        const { data: emp } = await supabase
          .from('employees')
          .select('email, payslip_email, name')
          .eq('id', leaveReq.employee_id)
          .maybeSingle();
        if (emp) {
          employeeEmail = emp.payslip_email || emp.email;
          employeeName = employeeName || emp.name;
        }
      }

      if (result.status === 'Approved') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Insert absent dates for the approved leave
        const from = parseLeaveDate(leaveReq.from_date);
        const to = parseLeaveDate(leaveReq.to_date);

        if (from && to) {
          const currentDate = new Date(from);
          const datesToInsert: { employee_id: string; date: string; subject: string }[] = [];
          while (currentDate <= to) {
            const day = currentDate.getDay();
            if (day !== 0 && day !== 6) { // Skip weekends
              datesToInsert.push({
                employee_id: leaveReq.employee_id,
                date: toLocalISO(currentDate),
                subject: leaveReq.subject ? `${leaveReq.type} - ${leaveReq.subject}` : leaveReq.type,
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (datesToInsert.length > 0) {
            await supabase.from('absent_dates').insert(datesToInsert);
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }
        }

        // Compute and persist the Loss of Pay days for this leave.
        try {
          const { data: allLeaves } = await supabase
            .from('leave_requests')
            .select('id, employee_id, type, from_date, to_date, days, status');
          const lopDays = computeLeaveLopDays((allLeaves || []) as LeaveLike[], leaveReq.employee_id, {
            id: leaveReq.id,
            employee_id: leaveReq.employee_id,
            type: leaveReq.type,
            days: leaveReq.days,
            status: 'Approved',
            from_date: leaveReq.from_date,
            to_date: leaveReq.to_date,
          });
          await supabase.from('leave_requests').update({ lop_days: lopDays }).eq('id', leaveReq.id);
        } catch (lopErr) {
          console.warn('LOP calculation failed:', lopErr);
        }
      } else {
        // A non-approved leave must not leave LOP or absent-date side effects behind.
        const from = parseLeaveDate(leaveReq.from_date);
        const to = parseLeaveDate(leaveReq.to_date);
        if (from && to) {
          const dates: string[] = [];
          const cursor = new Date(from);
          while (cursor <= to) {
            const day = cursor.getDay();
            if (day !== 0 && day !== 6) dates.push(toLocalISO(cursor));
            cursor.setDate(cursor.getDate() + 1);
          }
          if (dates.length > 0) {
            await supabase.from('absent_dates')
              .delete()
              .eq('employee_id', leaveReq.employee_id)
              .in('date', dates);
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }
        }
        await supabase.from('leave_requests').update({ lop_days: 0 }).eq('id', leaveReq.id);
      }

      serverLog('Leave Request Update', { id: result.id, newStatus: result.status, targetEmployee: employeeName || 'Unknown' }, 'success');

      // In-app notification for the employee whose request was decided.
      if (leaveReq.employee_id) {
        await supabase.from('notifications').insert([{
          title: `Leave ${result.status}`,
          body: `Your ${leaveReq.type} request (${leaveReq.from_date} to ${leaveReq.to_date}) has been ${result.status.toLowerCase()}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tone: result.status === 'Approved' ? 'success' : 'warning',
          target_id: leaveReq.employee_id,
        }]);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }

      if (employeeEmail) {
        const sent = await sendEmail(
          employeeEmail,
          `Leave Request ${result.status}`,
          `Hi ${employeeName},\n\nYour ${leaveReq.type} request (${leaveReq.from_date} to ${leaveReq.to_date}) has been ${result.status.toLowerCase()}.`
        );
        if (!sent) {
          toast.warning(`Could not email ${employeeName}`, {
            description: "The leave status was saved, but the notification email failed to send.",
          });
        }
      } else {
        toast.warning("Employee email not found", {
          description: "The leave status was saved, but no email address was available to notify the employee.",
        });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update leave request status: ${error.message}`);
      console.error(error);
      serverLog('Leave Request Update Failed', { error: error.message }, 'error');
    }
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newEmployee: {
      id: string;
      name: string;
      email: string;
      password: string;
      role: string;
      department: string;
      status: string;
      attendance: number;
      avatar_color: string;
      initials: string;
      base_salary?: number;
      monthly_allowance?: number;
      monthly_benefits_deduction?: number;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      access_level?: string;
      payslip_email?: string;
      // Plaintext password used only for the welcome email; never persisted.
      tempPassword?: string;
    }) => {
      const payload = { ...newEmployee };
      if (!payload.emergency_contact_name) delete payload.emergency_contact_name;
      if (!payload.emergency_contact_phone) delete payload.emergency_contact_phone;
      delete payload.tempPassword;

      const { data, error } = await supabase
        .from('employees')
        .insert([payload])
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      serverLog('Employee Onboarded', { id: variables.id, name: variables.name, department: variables.department, role: variables.role }, 'success');

      const intro = `Hi ${variables.name},\n\nWelcome to the team! Your portal account has been created.`;
      const passwordLine = variables.tempPassword
        ? `\nYour temporary password is: ${variables.tempPassword}\n\nPlease log in and change it immediately.`
        : `\nPlease log in using the credentials shared with you.`;

      const sent = await sendEmail(
        variables.email,
        "Welcome to Autodigix",
        `${intro}${passwordLine}`
      );
      if (!sent) {
        toast.warning(`Could not send welcome email to ${variables.name}`, {
          description: "The employee was created, but the welcome email failed. Share the credentials manually.",
        });
      }
    },
    onError: (error, variables) => {
      toast.error(`Failed to add employee: ${error.message}`);
      console.error(error);
      serverLog('Employee Onboarding Failed', { email: variables.email, error: error.message }, 'error');
    }
  });
};

export const useApplyLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leaveRequest: {
      id: string;
      employee_id: string;
      name: string;
      type: string;
      from_date: string;
      to_date: string;
      days: number;
      status: string;
      subject: string;
      description: string;
    }) => {
      const from = parseLeaveDate(leaveRequest.from_date);
      const to = parseLeaveDate(leaveRequest.to_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!from || !to) {
        throw new Error("Please select a valid leave date range.");
      }
      if (from < today) {
        throw new Error("Cannot apply for leave in the past.");
      }
      if (to < from) {
        throw new Error("End date cannot be before start date.");
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .insert([{ ...leaveRequest, id: generateId() }])
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      serverLog('Leave Request Applied', { employee_id: variables.employee_id, type: variables.type, days: variables.days }, 'success');
      
      sendEmail(
        ADMIN_NOTIFICATION_EMAIL,
        `New Leave Application: ${variables.name} (${variables.type})`,
        `Hi Admin,\n\n${variables.name} has applied for ${variables.days} day(s) of ${variables.type} (${variables.from_date} to ${variables.to_date}).\n\nSubject: ${variables.subject}\nReason: ${variables.description}\n\nPlease review and approve/reject this in the Admin Portal.`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #1e293b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px;">New Leave Application</h2>
              <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Autodigix HR Admin Notification</p>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <p style="margin-top: 0;"><strong>Employee Name:</strong> ${variables.name}</p>
              <p><strong>Leave Type:</strong> <span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${variables.type}</span></p>
              <p><strong>Duration:</strong> ${variables.days} day(s) (${variables.from_date} to ${variables.to_date})</p>
              <p><strong>Subject:</strong> ${variables.subject}</p>
              <p><strong>Reason:</strong></p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 14px; color: #0f172a;">${variables.description}</div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">Please log into the Autodigix HR Admin Portal to review or approve this request.</p>
            </div>
          </div>
        `
      );
    },
    onError: (error) => {
      toast.error(`Failed to submit leave request: ${error.message}`);
      console.error(error);
      serverLog('Leave Request Application Failed', { error: error.message }, 'error');
    }
  });
};

export const useDeleteLeaveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      serverLog('Leave Request Cancelled', { id }, 'success');
      toast.success("Leave request cancelled successfully.");
    },
    onError: (error) => {
      toast.error(`Failed to cancel leave request: ${error.message}`);
      console.error(error);
      serverLog('Leave Request Cancellation Failed', { error: error.message }, 'error');
    }
  });
};

export const useLogAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employee_id, employee_name, action, hours = 0, timestamp }: { employee_id: string; employee_name?: string; action: 'Clock In' | 'Clock Out'; hours?: number; timestamp?: string }) => {
      const today = getLocalToday();
      const eventTime = timestamp || new Date().toISOString();
      const eventTimeLabel = formatClockTime(eventTime);

      let employeeName = employee_name;
      if (!employeeName) {
        const { data: emp } = await supabase
          .from('employees')
          .select('name')
          .eq('id', employee_id)
          .maybeSingle();
        employeeName = emp?.name || `Employee #${employee_id}`;
      }

      // One attendance row is kept per employee per day; multiple
      // clock-in/out sessions accumulate into that row's `hours`.
      const { data: existingRows } = await supabase
        .from('attendance_history')
        .select('id, status, hours')
        .eq('employee_id', employee_id)
        .eq('date', today)
        .order('id', { ascending: false })
        .limit(1);
      const existing = existingRows && existingRows[0];

      if (action === 'Clock In') {
        if (existing && existing.status === 'Clocked In') {
          throw new Error("Already clocked in.");
        }

        if (existing) {
          // Resume a session that was stopped earlier today.
          const { error } = await supabase
            .from('attendance_history')
            .update({ status: 'Clocked In', clock_in_time: eventTime, clock_out_time: null })
            .eq('id', existing.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase.from('attendance_history').insert([{
            date: today,
            employee_id,
            hours: 0,
            status: 'Clocked In',
            clock_in_time: eventTime,
          }]);
          if (error) throw new Error(error.message);
        }

        // Sync the punch-in to Google Sheets (no-op if not configured).
        syncAttendanceToSheet({
          employeeName: employeeName!,
          employeeId: employee_id,
          date: today,
          loginTime: eventTimeLabel,
          logoutTime: null,
          totalHours: Number(existing?.hours) || null,
          status: 'Clocked In',
        });

        // Personal attendance notification (visible to the employee only).
        await supabase.from('notifications').insert([{
          title: 'Attendance — Clock In',
          body: `${employeeName} logged in at ${eventTimeLabel} on ${today}.`,
          time: eventTimeLabel || today,
          tone: 'success',
          target_id: employee_id,
        }]);
      } else {
        // Accumulate this session's hours onto any already recorded today.
        const totalHours = Number(((Number(existing?.hours) || 0) + hours).toFixed(2));

        if (existing) {
          const { error } = await supabase
            .from('attendance_history')
            .update({ hours: totalHours, status: 'Clocked Out', clock_out_time: eventTime })
            .eq('id', existing.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase.from('attendance_history').insert([{
            date: today,
            employee_id,
            hours: totalHours,
            status: 'Clocked Out',
            clock_out_time: eventTime,
          }]);
          if (error) throw new Error(error.message);
        }

        // Sync the punch-out (with cumulative total hours) to Google Sheets.
        syncAttendanceToSheet({
          employeeName: employeeName!,
          employeeId: employee_id,
          date: today,
          loginTime: null,
          logoutTime: eventTimeLabel,
          totalHours,
          status: 'Clocked Out',
        });

        // Personal attendance notification (visible to the employee only).
        await supabase.from('notifications').insert([{
          title: 'Attendance — Clock Out',
          body: `${employeeName} logged out at ${eventTimeLabel} on ${today} (${totalHours} hrs total).`,
          time: eventTimeLabel || today,
          tone: 'info',
          target_id: employee_id,
        }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
};

export const useAddHoliday = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, date }: { name: string; date: string }) => {
      const { data, error } = await supabase
        .from('holidays')
        .insert([{ name, date }])
        .select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success("Holiday Added Successfully");
      serverLog('Holiday Created', { name: variables.name, date: variables.date }, 'success');
    },
    onError: (error) => {
      toast.error(`Failed to add holiday: ${error.message}`);
      serverLog('Holiday Creation Failed', { error: error.message }, 'error');
    }
  });
};

export const useAddNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ title, body, time, tone, target_id = 'all' }: { title: string; body: string; time: string; tone: string; target_id?: string }) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ title, body, time, tone, target_id }])
        .select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      serverLog('Notification Broadcasted', { title: variables.title, tone: variables.tone }, 'success');
    },
    onError: (error) => {
      console.error("Failed to add notification:", error);
      serverLog('Notification Broadcast Failed', { error: error.message }, 'error');
    }
  });
};

export const useRunPayroll = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (period: string) => {
      // 0. Check if payroll for this period already exists
      const { data: existingPayslips } = await supabase
        .from('payslips')
        .select('id')
        .eq('period', period)
        .limit(1);

      if (existingPayslips && existingPayslips.length > 0) {
        throw new Error(`Payroll for ${period} has already been processed.`);
      }

      // 1. Fetch active employees (including base_salary, monthly_allowance, monthly_benefits_deduction)
      const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('id, name, email, payslip_email, department, role, status, base_salary, monthly_allowance, monthly_benefits_deduction')
        .neq('status', 'Terminated');

      if (fetchError) throw new Error(fetchError.message);
      
      if (!employees || employees.length === 0) {
        throw new Error("No active employees found to run payroll.");
      }

      // 2. Fetch unpaid leaves for deductions
      const { data: absentDates } = await supabase
        .from('absent_dates')
        .select('employee_id, subject');

      // Fetch approved leave requests for Loss of Pay (LOP) calculation.
      const { data: leaveRows } = await supabase
        .from('leave_requests')
        .select('id, employee_id, type, from_date, to_date, days, status, lop_days')
        .eq('status', 'Approved');

      // "Nov 2026" -> "2026-11"
      const periodDate = new Date(`1 ${period}`);
      const periodMonthKey = isNaN(periodDate.getTime())
        ? getMonthKey(getLocalToday())
        : `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;

      // 3. Map to payslips
      const payslips = employees.map(emp => {
        const salary = emp.base_salary ?? 60000;
        const base_amount = Math.round(salary / 12);
        const allowances_amount = emp.monthly_allowance || 0;

        const unpaidDays = (absentDates || []).filter(a => a.employee_id === emp.id && a.subject.toLowerCase().includes('unpaid')).reduce((acc, a) => {
           return acc + (a.subject.toLowerCase().includes('half day') ? 0.5 : 1);
        }, 0);

        // Loss of Pay days from approved leave requests in this period.
        const lopDays = sumLopDaysForMonth((leaveRows || []) as LeaveLike[], emp.id, periodMonthKey);

        // Deduct unpaid + LOP days, de-duplicated so unpaid leave is not counted twice.
        const deductionDays = Math.max(unpaidDays, lopDays);

        let unpaid_leave_amount = 0;
        if (deductionDays > 0) {
           const dailyRate = base_amount / 22;
           unpaid_leave_amount = Math.round(deductionDays * dailyRate);
        }

        const gross = base_amount + allowances_amount - unpaid_leave_amount;
        const benefits_amount = emp.monthly_benefits_deduction || 0;
        const tax_amount = Math.round(gross * 0.25); // 25% tax bracket assumption
        const net = gross - tax_amount - benefits_amount;
        
        return {
          employee_id: emp.id,
          period: period,
          gross: gross,
          net: net,
          base_amount: base_amount,
          allowances_amount: allowances_amount,
          unpaid_leave_amount: unpaid_leave_amount,
          lop_days: lopDays,
          tax_amount: tax_amount,
          benefits_amount: benefits_amount,
          status: 'Paid'
        };
      });

      // 3. Insert payslips
      const { data, error } = await supabase
        .from('payslips')
        .insert(payslips)
        .select();

      if (error) throw new Error(error.message);
      
      // 4. Generate PDF Payslips & Send emails
      let emailFailures = 0;
      let emailSkipped = 0;
      for (const emp of employees) {
        const p = payslips.find(ps => ps.employee_id === emp.id);
        if (p) {
          try {
            const pdfBase64 = generatePayslipPDFBase64({
              employeeName: emp.name,
              employeeId: emp.id,
              email: emp.email,
              department: emp.department,
              role: emp.role,
              period: period,
              base_amount: p.base_amount,
              allowances_amount: p.allowances_amount,
              unpaid_leave_amount: p.unpaid_leave_amount,
              gross: p.gross,
              tax_amount: p.tax_amount,
              benefits_amount: p.benefits_amount,
              net: p.net
            });

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
                <div style="background-color: #1e293b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Autodigix HR</h1>
                  <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Official Payslip Statement for ${period}</p>
                </div>
                <div style="padding: 24px; color: #334155; line-height: 1.6;">
                  <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Hi ${emp.name},</p>
                  <p>Your monthly salary for <strong>${period}</strong> has been successfully processed.</p>
                  <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Gross Salary:</td>
                        <td style="padding: 6px 0; font-weight: bold; text-align: right;">₹ ${p.gross.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Total Deductions:</td>
                        <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #ef4444;">- ₹ ${(p.gross - p.net).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0 0 0; font-weight: bold; color: #0f172a; font-size: 16px;">Net Take-Home Pay:</td>
                        <td style="padding: 10px 0 0 0; font-weight: bold; text-align: right; color: #16a34a; font-size: 18px;">₹ ${p.net.toLocaleString('en-IN')}</td>
                      </tr>
                    </table>
                  </div>
                  <p style="font-size: 14px;">📄 <strong>Your detailed payslip is attached to this email as a PDF document.</strong> You can also view and download it anytime from your employee portal profile.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">This is an automated system email from Autodigix HR.</p>
                </div>
              </div>
            `;

            const recipient = emp.payslip_email || emp.email;
            const payslipRow = (data || []).find((row: any) => row.employee_id === emp.id);

            if (!recipient) {
              emailSkipped++;
              if (payslipRow) {
                await supabase.from('payslips')
                  .update({ email_status: 'Skipped - no email address' })
                  .eq('id', payslipRow.id);
              }
            } else {
              const sent = await sendEmail(
                recipient,
                `Payslip Statement - ${period}`,
                `Hi ${emp.name},\n\nYour payroll for ${period} has been processed.\nGross: ₹${p.gross}\nNet: ₹${p.net}\n\nPlease find your attached PDF payslip.`,
                emailHtml,
                pdfBase64,
                `Payslip_${period.replace(/\s+/g, '_')}_${emp.name.replace(/\s+/g, '_')}.pdf`
              );

              // Track payslip delivery only when the send actually succeeded.
              if (!sent) emailFailures++;
              if (payslipRow) {
                await supabase.from('payslips')
                  .update(sent
                    ? { email_status: `Sent to ${recipient}`, email_sent_at: new Date().toISOString() }
                    : { email_status: `Failed to send to ${recipient}` })
                  .eq('id', payslipRow.id);
              }
            }
          } catch (pdfErr) {
            emailFailures++;
            console.error(`Failed to generate/send PDF payslip for ${emp.name}:`, pdfErr);
          }
        }
      }

      return { data, period, count: employees.length, emailFailures, emailSkipped };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      queryClient.invalidateQueries({ queryKey: ['payrollTrend'] });
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#22c55e', '#10b981', '#3b82f6', '#fbbf24']
      });

      const problems = result.emailFailures + result.emailSkipped;
      if (problems > 0) {
        toast.warning("Payroll processed with issues", {
          description: `${result.count} payslips generated. ${result.emailFailures} email(s) failed, ${result.emailSkipped} skipped (no address).`,
        });
      } else {
        toast.success("Payroll Processed", { description: `${result.count} payslips generated and emailed.` });
      }
      serverLog('Payroll Run Completed', { period: result.period, employeesProcessed: result.count, emailFailures: result.emailFailures, emailSkipped: result.emailSkipped }, 'success');
    },
    onError: (error) => {
      toast.error(`Failed to run payroll: ${error.message}`);
      console.error(error);
      serverLog('Payroll Run Failed', { error: error.message }, 'error');
    }
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employee: Partial<{
      id: string;
      name: string;
      email: string;
      phone: string;
      location: string;
      manager_id: string;
      avatar_url: string;
      initials: string;
      department: string;
      role: string;
      status: string;
      base_salary: number;
      monthly_allowance: number;
      monthly_benefits_deduction: number;
      emergency_contact_name: string;
      emergency_contact_phone: string;
      access_level: string;
      payslip_email: string;
    }>) => {
      const { id, ...updates } = employee;
      if (!id) throw new Error("Employee ID is required");

      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      serverLog('Employee Profile Updated', { id: variables.id }, 'success');
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
      console.error(error);
      serverLog('Profile Update Failed', { error: error.message }, 'error');
    }
  });
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, newPasswordHash }: { id: string; newPasswordHash: string }) => {
      const { error } = await supabase
        .from('employees')
        .update({ password: newPasswordHash })
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      toast.success("Password changed successfully.");
      serverLog('Password Changed', { employee_id: id }, 'success');
    },
    onError: (error) => {
      toast.error(`Failed to change password: ${error.message}`);
      serverLog('Password Change Failed', { error: error.message }, 'error');
    }
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useClearNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Only clear shared logs (announcements + admin activity). Personal
      // employee notifications (target_id = employee id) are preserved.
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('target_id', ['all', 'admin']);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      serverLog('Employee Removed', { employee_id: id }, 'success');
      toast.success("Employee removed successfully.");
    },
    onError: (error) => {
      toast.error(`Failed to remove employee: ${error.message}`);
      console.error(error);
      serverLog('Employee Removal Failed', { error: error.message }, 'error');
    }
  });
};
