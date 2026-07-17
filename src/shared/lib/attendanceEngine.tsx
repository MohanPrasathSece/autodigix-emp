import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface AttendanceContextType {
  isWorking: boolean;
  seconds: number;
  startWork: () => void;
  stopWork: () => void;
  paidLeaves: number;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [isWorking, setIsWorking] = useState(() => localStorage.getItem("autodigix_is_working") === "true");
  
  const [seconds, setSeconds] = useState(() => {
    const todayStr = new Date().toDateString();
    const savedDate = localStorage.getItem("autodigix_timer_date");
    if (savedDate === todayStr) {
      return parseInt(localStorage.getItem("autodigix_today_seconds") || "0", 10);
    }
    return 0;
  });

  const [paidLeaves, setPaidLeaves] = useState(() => {
    const saved = localStorage.getItem("autodigix_paid_leaves");
    return saved !== null ? parseFloat(saved) : 2; // Default to 2 leaves
  });

  // Evaluate previous day on mount
  useEffect(() => {
    const lastCheck = localStorage.getItem("autodigix_last_check");
    const todayStr = new Date().toDateString();
    
    if (lastCheck !== todayStr) {
      // It's a new day! Evaluate yesterday.
      const yesterdayDataStr = localStorage.getItem("autodigix_yesterday_data");
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      
      const isWeekday = yesterdayDate.getDay() !== 0 && yesterdayDate.getDay() !== 6;
      
      if (isWeekday && yesterdayDataStr) {
        const yesterdayHours = parseFloat(yesterdayDataStr);
        // Standard day is 9 hours. Half day threshold is 4.5
        if (yesterdayHours < 4.5) {
          setPaidLeaves(prev => {
            const newLeaves = Math.max(0, prev - 0.5);
            localStorage.setItem("autodigix_paid_leaves", newLeaves.toString());
            // Small delay to ensure toaster is mounted
            setTimeout(() => {
              toast.warning("Half Day Deducted", {
                description: "You worked less than 4.5 hours yesterday. 0.5 paid leaves have been deducted.",
              });
            }, 1000);
            return newLeaves;
          });
        }
      }
      
      // Check for month rollover
      const currentMonth = new Date().getMonth().toString();
      const lastMonth = localStorage.getItem("autodigix_last_month");
      
      if (lastMonth !== null && lastMonth !== currentMonth) {
        setPaidLeaves(prev => {
          const newLeaves = Math.min(6, prev + 2);
          localStorage.setItem("autodigix_paid_leaves", newLeaves.toString());
          setTimeout(() => {
            toast.success("Leave Balance Updated", {
              description: `2 paid leaves added for the new month. Your balance is now ${newLeaves}.`,
            });
          }, 1000);
          return newLeaves;
        });
      }
      localStorage.setItem("autodigix_last_month", currentMonth);
      
      // Reset for today
      localStorage.setItem("autodigix_yesterday_data", "0");
      localStorage.setItem("autodigix_last_check", todayStr);
      localStorage.setItem("autodigix_timer_date", todayStr);
      localStorage.setItem("autodigix_today_seconds", "0");
      setSeconds(0);
      setIsWorking(false);
      localStorage.setItem("autodigix_is_working", "false");
    }
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isWorking) {
      interval = setInterval(() => {
        setSeconds(s => {
          const newS = s + 1;
          localStorage.setItem("autodigix_today_seconds", newS.toString());
          return newS;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorking]);

  // System time polling for auto-close at 19:00 (7 PM)
  useEffect(() => {
    const timePoller = setInterval(() => {
      const now = new Date();
      if (isWorking && now.getHours() >= 19) {
        // Stop work
        setIsWorking(false);
        localStorage.setItem("autodigix_is_working", "false");
        const hoursWorked = seconds / 3600;
        localStorage.setItem("autodigix_yesterday_data", hoursWorked.toString());
        toast.info("Auto Clocked-Out", {
          description: "It is 7:00 PM. Your shift has been automatically closed.",
        });
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(timePoller);
  }, [isWorking, seconds]);

  const startWork = () => {
    setIsWorking(true);
    localStorage.setItem("autodigix_is_working", "true");
  };
  
  const stopWork = () => {
    setIsWorking(false);
    localStorage.setItem("autodigix_is_working", "false");
    const hoursWorked = seconds / 3600;
    // Save current hours to yesterday_data (we overwrite it through the day)
    localStorage.setItem("autodigix_yesterday_data", hoursWorked.toString());
  };

  return (
    <AttendanceContext.Provider value={{ isWorking, seconds, startWork, stopWork, paidLeaves }}>
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
