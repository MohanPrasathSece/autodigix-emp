import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { serverLog } from '../lib/logger';
import confetti from 'canvas-confetti';

const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text, html: `<p>${text}</p>` }),
    });
  } catch (error) {
    console.error('Failed to dispatch email:', error);
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      
      if (result.status === 'Approved') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      serverLog('Leave Request Update', { id: result.id, newStatus: result.status, targetEmployee: result.name || 'Unknown' }, 'success');

      if (result.email && result.name) {
        sendEmail(
          result.email,
          `Leave Request ${result.status}`,
          `Hi ${result.name},\n\nYour leave request has been ${result.status.toLowerCase()}.`
        );
      } else {
        // Fallback for demo
        sendEmail("admin@company.com", `Leave Request ${result.status}`, `A leave request was ${result.status.toLowerCase()}.`);
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
    }) => {
      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      serverLog('Employee Onboarded', { id: variables.id, name: variables.name, department: variables.department, role: variables.role }, 'success');

      sendEmail(
        variables.email,
        "Welcome to Autodigix",
        `Hi ${variables.name},\n\nWelcome to the team! Your portal account has been created.\nYour temporary password is: ${variables.password}\n\nPlease log in and change it immediately.`
      );
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
      const { data, error } = await supabase
        .from('leave_requests')
        .insert([leaveRequest])
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      serverLog('Leave Request Applied', { employee_id: variables.employee_id, type: variables.type, days: variables.days }, 'success');
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

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, newAttendance, status }: { id: string; newAttendance: number; status?: string }) => {
      
      const updatePayload: any = { attendance: newAttendance };
      if (status) {
        updatePayload.status = status;
      }
      
      const { data, error } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', id)
        .select();

      if (error) throw new Error(error.message);
      return { data, id, newAttendance, status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      serverLog('Employee Attendance Updated', { employee_id: result.id, newAttendance: result.newAttendance, newStatus: result.status }, 'success');
    },
    onError: (error, variables) => {
      toast.error(`Failed to update attendance: ${error.message}`);
      console.error(error);
      serverLog('Employee Attendance Update Failed', { employee_id: variables.id, error: error.message }, 'error');
    }
  });
};

export const useLogAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employee_id, action, hours = 0 }: { employee_id: string; action: 'Clock In' | 'Clock Out'; hours?: number }) => {
      const today = new Date().toISOString().split('T')[0];
      
      if (action === 'Clock In') {
        const { error } = await supabase.from('attendance_history').insert([{
          date: today,
          employee_id,
          hours: 0,
          status: 'Clocked In'
        }]);
        if (error) console.error("Error inserting attendance", error);
      } else {
        const { error } = await supabase.from('attendance_history').update({
          hours,
          status: 'Clocked Out'
        }).eq('employee_id', employee_id).eq('date', today);
        if (error) console.error("Error updating attendance", error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance_history'] });
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
    mutationFn: async ({ title, body, time, tone }: { title: string; body: string; time: string; tone: string }) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ title, body, time, tone }])
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
      // 1. Fetch active employees (including email for payslips)
      const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('id, name, email, department, role, status')
        .neq('status', 'Remote');

      if (fetchError) throw new Error(fetchError.message);
      
      if (!employees || employees.length === 0) {
        throw new Error("No active employees found to run payroll.");
      }

      // 2. Map to payslips
      const payslips = employees.map(emp => {
        const gross = emp.department === 'Engineering' ? 8500 : 5000;
        const net = Math.round(gross * 0.75);
        return {
          employee_id: emp.id,
          period: period,
          gross: gross,
          net: net,
          status: 'Paid'
        };
      });

      // 3. Insert payslips
      const { data, error } = await supabase
        .from('payslips')
        .insert(payslips)
        .select();

      if (error) throw new Error(error.message);
      
      // 4. Send emails
      for (const emp of employees) {
        const p = payslips.find(ps => ps.employee_id === emp.id);
        if (p) {
          sendEmail(
            emp.email,
            `Payslip for ${period}`,
            `Hi ${emp.name},\n\nYour payroll for ${period} has been processed.\nGross: $${p.gross}\nNet: $${p.net}\n\nYou can view the full breakdown in your employee portal.`
          );
        }
      }

      return { data, period, count: employees.length };
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

      toast.success("Payroll Processed", { description: "Payslips generated and emails sent." });
      serverLog('Payroll Run Completed', { period: result.period, employeesProcessed: result.count }, 'success');
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
