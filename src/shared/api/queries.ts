import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, name, email, password, role, department, status, attendance, 
          avatarColor:avatar_color, initials, avatarUrl:avatar_url, 
          phone, location, manager_id, created_at,
          absentDates:absent_dates(date, subject)
        `);
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useHolidays = () => {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase.from('holidays').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('id', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useLeaveRequests = () => {
  return useQuery({
    queryKey: ['leaveRequests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leave_requests').select('id, employee_id, name, type, from:from_date, to:to_date, days, status, subject, description');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useAttendanceTrend = () => {
  return useQuery({
    queryKey: ['attendanceTrend'],
    queryFn: async () => {
      const { data, error } = await supabase.from('attendance_trend_view').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const usePayrollTrend = () => {
  return useQuery({
    queryKey: ['payrollTrend'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payroll_trend_view').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useDepartmentSplit = () => {
  return useQuery({
    queryKey: ['departmentSplit'],
    queryFn: async () => {
      const { data, error } = await supabase.from('department_split_view').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const usePayslips = () => {
  return useQuery({
    queryKey: ['payslips'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payslips').select('*').order('id', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useAttendanceHistory = () => {
  return useQuery({
    queryKey: ['attendanceHistory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('attendance_history').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};
