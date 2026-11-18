// @refresh reset
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/auth";
import { useLogAttendance } from "@/shared/api/mutations";
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
  // Seconds already accumulated from earlier, completed sessions today.
  const [baseSeconds, setBaseSeconds] = useState(0);
  // Guards against the auto-stop firing repeatedly on every tick.
  const stoppingRef = useRef(false);

  const { user } = useAuthStore();
  const logAttendanceMutation = useLogAttendance();

  // Load state from DB on mount
  useEffect(() => {
    async function loadAttendance() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const today = getLocalToday();
      const now = new Date();
      const nowMs = now.getTime();

      // 1. Auto-close any stale open sessions left from previous days at 7 PM.
      const { data: openRecords, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('employee_id', user.id)
        .eq('status', 'Clocked In');

      if (error) {
        console.error("Failed to load attendance", error);
      }

      for (const record of openRecords || []) {
        if (record.date === today) continue; // today's open session is handled below
        const clockInDate = new Date(record.clock_in_time || record.created_at);
        const shiftEnd = new Date(clockInDate);
        shiftEnd.setHours(18, 30, 0, 0);
        const finalEndTime = shiftEnd.getTime() < clockInDate.getTime() ? clockInDate.getTime() + 60000 : shiftEnd.getTime();
        const sessionSeconds = Math.max(0, Math.floor((finalEndTime - clockInDate.getTime()) / 1000));
        const totalHours = Number((Math.max(0, Number(record.hours) || 0) + sessionSeconds / 3600).toFixed(2));
        await supabase.from('attendance_history').update({
          status: 'Clocked Out',
          hours: totalHours,
        }).eq('id', record.id);
      }

      // 2. Load today's single attendance row.
      const { data: todayRows } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .order('id', { ascending: false })
        .limit(1);
      const todayRecord = todayRows && todayRows[0];

      if (todayRecord && todayRecord.status === 'Clocked In') {
        const sessionStart = new Date(todayRecord.clock_in_time || todayRecord.created_at).getTime();
        const base = Math.max(0, Math.floor((Number(todayRecord.hours) || 0) * 3600));
        const shiftEnd = new Date(sessionStart);
        shiftEnd.setHours(18, 30, 0, 0);

        if (nowMs >= shiftEnd.getTime()) {
          // Active session ran past 6:30 PM — close it out.
          const finalEndTime = shiftEnd.getTime() < sessionStart ? sessionStart + 60000 : shiftEnd.getTime();
          const sessionSeconds = Math.max(0, Math.floor((finalEndTime - sessionStart) / 1000));
          const totalHours = Number((Math.max(0, Number(todayRecord.hours) || 0) + sessionSeconds / 3600).toFixed(2));
          await supabase.from('attendance_history').update({
            status: 'Clocked Out',
            hours: totalHours,
          }).eq('id', todayRecord.id);
          setBaseSeconds(0);
          setClockInTime(null);
          setIsWorking(false);
          setSeconds(Math.floor(totalHours * 3600));
        } else {
          setBaseSeconds(base);
          setClockInTime(sessionStart);
          setIsWorking(true);
          setSeconds(base + Math.max(0, Math.floor((nowMs - sessionStart) / 1000)));
        }
      } else if (todayRecord && todayRecord.status === 'Clocked Out') {
        setBaseSeconds(0);
        setClockInTime(null);
        setIsWorking(false);
        setSeconds(Math.max(0, Math.floor((Number(todayRecord.hours) || 0) * 3600)));
      } else {
        setBaseSeconds(0);
        setClockInTime(null);
        setIsWorking(false);
        setSeconds(0);
      }
      setIsLoading(false);
    }

    loadAttendance();
  }, [user]);

  const startWork = async () => {
    if (!user?.id) return;

    if (new Date().getHours() >= 19 || (new Date().getHours() === 18 && new Date().getMinutes() >= 30)) {
      toast.error("Shift Ended", { description: "Today's shift ended at 6:30 PM. Clock-in is closed for today." });
      return;
    }

    const now = Date.now();
    const carried = Math.max(0, seconds); // total time already worked today
    setBaseSeconds(carried);
    setClockInTime(now);
    setIsWorking(true);

    try {
      await logAttendanceMutation.mutateAsync({ employee_id: user.id, employee_name: user.name, action: 'Clock In' });
      toast.success("Clocked In", { description: "Attendance started. You can pause and resume anytime before 6:30 PM." });
    } catch (e: any) {
      toast.error(e.message || "Failed to clock in");
      setIsWorking(false);
      setClockInTime(null);
      setBaseSeconds(0);
    }
  };

  const stopWork = async (autoStopAt7: boolean = false) => {
    if (!user?.id || !clockInTime) return;

    let finalEndTime = Date.now();

    if (autoStopAt7) {
      const shiftEnd = new Date(clockInTime);
      shiftEnd.setHours(18, 30, 0, 0);
      finalEndTime = shiftEnd.getTime();
    }

    if (finalEndTime < clockInTime) finalEndTime = clockInTime + 60000;

    const sessionSeconds = Math.max(0, Math.floor((finalEndTime - clockInTime) / 1000));
    const totalSeconds = baseSeconds + sessionSeconds;
    const hoursWorked = Number((sessionSeconds / 3600).toFixed(2));

    setIsWorking(false);
    setSeconds(totalSeconds);

    try {
      await logAttendanceMutation.mutateAsync({
        employee_id: user.id,
        employee_name: user.name,
        action: 'Clock Out',
        hours: hoursWorked,
        timestamp: new Date(finalEndTime).toISOString()
      });
      setClockInTime(null);
      setBaseSeconds(totalSeconds);
      toast.success("Clocked Out", { description: autoStopAt7 ? "Shift auto-ended at 6:30 PM." : "Paused — you can resume anytime before 6:30 PM." });
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
      const isAfterShiftEnd = now.getHours() > 18 || (now.getHours() === 18 && now.getMinutes() >= 30);
      if (isAfterShiftEnd) {
         if (!stoppingRef.current) {
           stoppingRef.current = true;
           stopWork(true).finally(() => { stoppingRef.current = false; });
         }
      } else {
         setSeconds(baseSeconds + Math.max(0, Math.floor((now.getTime() - clockInTime) / 1000)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorking, clockInTime, baseSeconds]);

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
