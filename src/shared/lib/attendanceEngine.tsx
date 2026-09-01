// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/auth";
import { useUpdateAttendance, useLogAttendance } from "@/shared/api/mutations";
import { supabase } from "@/lib/supabaseClient";
import { getLocalToday } from "@/shared/lib/dateUtils";

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
      
      const today = getLocalToday();
      const { data: openRecords, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('employee_id', user.id)
        .eq('status', 'Clock In');

      if (error) {
        console.error("Failed to load attendance", error);
      }

      let activeClockInTime: number | null = null;
      const now = new Date();

      if (openRecords && openRecords.length > 0) {
        for (const record of openRecords) {
          const clockInDate = new Date(record.clock_in_time);
          const isToday = record.date === today;
          
          const sevenPM = new Date(clockInDate);
          sevenPM.setHours(19, 0, 0, 0);

          if (!isToday || now.getTime() >= sevenPM.getTime()) {
            // Auto close at 7 PM of that day
            const finalEndTime = sevenPM.getTime() < clockInDate.getTime() ? clockInDate.getTime() + 60000 : sevenPM.getTime();
            const finalSeconds = Math.floor((finalEndTime - clockInDate.getTime()) / 1000);
            const hoursWorked = finalSeconds / 3600;
            
            await supabase.from('attendance_history').update({
              status: 'Clocked Out',
              clock_out_time: new Date(finalEndTime).toISOString(),
              hours: hoursWorked
            }).eq('id', record.id);
          } else {
            // Still active today and before 7 PM
            activeClockInTime = clockInDate.getTime();
          }
        }
      }

      if (activeClockInTime) {
        setIsWorking(true);
        setClockInTime(activeClockInTime);
        setSeconds(Math.floor((now.getTime() - activeClockInTime) / 1000));
      } else {
        setIsWorking(false);
        setClockInTime(null);
        // Load today's total seconds if clocked out
        const { data: todayData } = await supabase
          .from('attendance_history')
          .select('*')
          .eq('employee_id', user.id)
          .eq('date', today)
          .maybeSingle();
        
        if (todayData && todayData.clock_out_time) {
          setSeconds(Math.floor(todayData.hours * 3600));
        } else {
          setSeconds(0);
        }
      }
      setIsLoading(false);
    }
    
    loadAttendance();
  }, [user]);

  const startWork = async () => {
    if (!user?.id) return;
    
    const now = Date.now();
    setClockInTime(now);
    setIsWorking(true);
    
    try {
      await logAttendanceMutation.mutateAsync({ employee_id: user.id, action: 'Clock In' });
      await updateAttendanceMutation.mutateAsync({ id: user.id, newAttendance: 50 });
      toast.success("Clocked In", { description: "Your attendance has been logged in the system." });
    } catch (e: any) {
      toast.error(e.message || "Failed to clock in");
      setIsWorking(false);
      setClockInTime(null);
    }
  };

  const stopWork = async (autoStopAt7: boolean = false) => {
    if (!user?.id || !clockInTime) return;

    let finalEndTime = Date.now();
    
    if (autoStopAt7) {
      const sevenPM = new Date(clockInTime);
      sevenPM.setHours(19, 0, 0, 0);
      finalEndTime = sevenPM.getTime();
    }

    if (finalEndTime < clockInTime) finalEndTime = clockInTime + 60000;

    const finalSeconds = Math.floor((finalEndTime - clockInTime) / 1000);
    const hoursWorked = finalSeconds / 3600;
    
    setIsWorking(false);
    setSeconds(finalSeconds);

    try {
      await logAttendanceMutation.mutateAsync({ 
        employee_id: user.id, 
        action: 'Clock Out', 
        hours: hoursWorked,
        timestamp: new Date(finalEndTime).toISOString()
      });
      if (hoursWorked < 4) {
        await updateAttendanceMutation.mutateAsync({ id: user.id, newAttendance: 50 });
      } else {
        await updateAttendanceMutation.mutateAsync({ id: user.id, newAttendance: 100 });
      }
      toast.success("Clocked Out", { description: autoStopAt7 ? "Shift auto-ended at 7 PM." : "Your shift has ended." });
    } catch (e: any) {
      toast.error(e.message || "Failed to clock out");
      setIsWorking(true);
    }
  };

  // Tick every second if working & enforce 7 PM
  useEffect(() => {
    if (!isWorking || !clockInTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() >= 19) {
         stopWork(true);
      } else {
         setSeconds(Math.floor((now.getTime() - clockInTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorking, clockInTime]);

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
