// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/auth";
import { useUpdateAttendance, useLogAttendance } from "@/shared/api/mutations";
import { supabase } from "@/lib/supabaseClient";

interface AttendanceContextType {
  isWorking: boolean;
  seconds: number;
  startWork: () => void;
  stopWork: () => void;
  isLoading: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [isWorking, setIsWorking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [clockInTime, setClockInTime] = useState<number | null>(null);

  const { user } = useAuthStore();
  const updateAttendanceMutation = useUpdateAttendance();
  const logAttendanceMutation = useLogAttendance();

  // Load state from DB on mount
  useEffect(() => {
    async function loadAttendance() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error("Failed to load attendance", error);
      }

      if (data) {
        if (data.clock_out_time) {
          // Already clocked out
          setSeconds(Math.floor(data.hours * 3600));
          setIsWorking(false);
        } else if (data.clock_in_time) {
          // Currently clocked in
          setIsWorking(true);
          setClockInTime(new Date(data.clock_in_time).getTime());
        }
      } else {
        // No record today
        setSeconds(0);
        setIsWorking(false);
      }
      setIsLoading(false);
    }
    
    loadAttendance();
  }, [user]);

  // Tick every second if working
  useEffect(() => {
    if (!isWorking || !clockInTime) return;

    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - clockInTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorking, clockInTime]);

  const startWork = async () => {
    if (!user?.id) return;
    
    const now = Date.now();
    setClockInTime(now);
    setIsWorking(true);
    
    try {
      await logAttendanceMutation.mutateAsync({ employee_id: user.id, action: 'Clock In' });
      await updateAttendanceMutation.mutateAsync({ id: user.id, newAttendance: 100 });
      toast.success("Clocked In", { description: "Your attendance has been logged in the system." });
    } catch (e: any) {
      toast.error(e.message || "Failed to clock in");
      setIsWorking(false);
      setClockInTime(null);
    }
  };

  const stopWork = async () => {
    if (!user?.id || !clockInTime) return;

    const finalSeconds = Math.floor((Date.now() - clockInTime) / 1000);
    const hoursWorked = finalSeconds / 3600;
    
    setIsWorking(false);
    setSeconds(finalSeconds);

    try {
      await logAttendanceMutation.mutateAsync({ employee_id: user.id, action: 'Clock Out', hours: hoursWorked });
      if (hoursWorked < 4) {
        await updateAttendanceMutation.mutateAsync({ id: user.id, newAttendance: 50 });
      }
      toast.success("Clocked Out", { description: "Your shift has ended." });
    } catch (e: any) {
      toast.error(e.message || "Failed to clock out");
      // Revert state if failed
      setIsWorking(true);
    }
  };

  return (
    <AttendanceContext.Provider value={{ isWorking, seconds, startWork, stopWork, isLoading }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
}
