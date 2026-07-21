// @refresh reset
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/auth";
import { useUpdateAttendance, useLogAttendance } from "@/shared/api/mutations";

interface AttendanceContextType {
  isWorking: boolean;
  seconds: number;
  startWork: () => void;
  stopWork: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const KEYS = {
  IS_WORKING: "autodigix_is_working",
  CLOCK_IN_AT: "autodigix_clock_in_at",       // timestamp (ms) when last clock-in happened
  ACCUMULATED: "autodigix_accumulated_secs",  // seconds accumulated in prior sessions today
  TIMER_DATE: "autodigix_timer_date",
  LAST_CHECK: "autodigix_last_check",
};

function getTodayStr() {
  return new Date().toDateString();
}

/** Compute total seconds for today based on stored state */
function computeSeconds(): number {
  const accumulated = parseInt(localStorage.getItem(KEYS.ACCUMULATED) || "0", 10);
  const clockInAt = localStorage.getItem(KEYS.CLOCK_IN_AT);
  const isWorking = localStorage.getItem(KEYS.IS_WORKING) === "true";

  if (isWorking && clockInAt) {
    const elapsed = Math.floor((Date.now() - parseInt(clockInAt, 10)) / 1000);
    return accumulated + elapsed;
  }
  return accumulated;
}

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [isWorking, setIsWorking] = useState(() => localStorage.getItem(KEYS.IS_WORKING) === "true");
  const [seconds, setSeconds] = useState(() => computeSeconds());

  const { user } = useAuthStore();
  const updateAttendanceMutation = useUpdateAttendance();
  const logAttendanceMutation = useLogAttendance();

  // ── New-day reset ────────────────────────────────────────────────────────────
  useEffect(() => {
    const todayStr = getTodayStr();
    const lastCheck = localStorage.getItem(KEYS.LAST_CHECK);

    if (lastCheck !== todayStr) {
      // New day: reset everything
      localStorage.setItem(KEYS.LAST_CHECK, todayStr);
      localStorage.setItem(KEYS.TIMER_DATE, todayStr);
      localStorage.setItem(KEYS.ACCUMULATED, "0");
      localStorage.removeItem(KEYS.CLOCK_IN_AT);
      localStorage.setItem(KEYS.IS_WORKING, "false");
      setSeconds(0);
      setIsWorking(false);
    }
  }, []);

  // ── Tick every second (just re-reads the real elapsed time) ─────────────────
  useEffect(() => {
    if (!isWorking) return;

    const interval = setInterval(() => {
      setSeconds(computeSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorking]);

  // ── Auto clock-out at 19:00 ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isWorking) return;

    const timePoller = setInterval(() => {
      const now = new Date();
      if (now.getHours() >= 19) {
        stopWork();
        toast.info("Auto Clocked-Out", {
          description: "It is 7:00 PM. Your shift has been automatically closed.",
        });
      }
    }, 10000);

    return () => clearInterval(timePoller);
  }, [isWorking]);

  const startWork = () => {
    // Snapshot accumulated seconds so far today, then record new clock-in time
    const currentAccumulated = computeSeconds();
    localStorage.setItem(KEYS.ACCUMULATED, currentAccumulated.toString());
    localStorage.setItem(KEYS.CLOCK_IN_AT, Date.now().toString());
    localStorage.setItem(KEYS.IS_WORKING, "true");
    setIsWorking(true);

    if (user?.id) {
      updateAttendanceMutation.mutate({ id: user.id, newAttendance: 100 });
      logAttendanceMutation.mutate({ employee_id: user.id, action: 'Clock In' });
      toast.success("Clocked In", { description: "Your attendance has been logged in the system." });
    }
  };

  const stopWork = () => {
    // Snapshot the final total seconds and clear the running clock-in marker
    const finalSeconds = computeSeconds();
    localStorage.setItem(KEYS.ACCUMULATED, finalSeconds.toString());
    localStorage.removeItem(KEYS.CLOCK_IN_AT);
    localStorage.setItem(KEYS.IS_WORKING, "false");
    setIsWorking(false);
    setSeconds(finalSeconds);

    const hoursWorked = finalSeconds / 3600;

    if (user?.id) {
      logAttendanceMutation.mutate({ employee_id: user.id, action: 'Clock Out', hours: hoursWorked });
      if (hoursWorked < 4) {
        updateAttendanceMutation.mutate({ id: user.id, newAttendance: 50 });
      }
    }
    toast.success("Clocked Out", { description: "Your shift has ended." });
  };

  return (
    <AttendanceContext.Provider value={{ isWorking, seconds, startWork, stopWork }}>
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
