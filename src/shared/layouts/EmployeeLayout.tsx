import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/shared/store/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { EmployeeSidebar } from "@/employee/EmployeeSidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Toaster } from "@/components/ui/sonner";
import { AttendanceProvider } from "@/lib/attendanceEngine";

export function EmployeeLayout() {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/" replace />;

  return (
    <AttendanceProvider>
      <SidebarProvider>
        <EmployeeSidebar />
        <SidebarInset className="bg-background">
          <AppTopbar />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={typeof window !== "undefined" ? window.location.pathname : ""}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </AttendanceProvider>
  );
}
