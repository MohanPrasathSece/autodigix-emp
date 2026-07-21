import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
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
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}
