import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, CheckCircle2, Clock, PlaneTakeoff, Wallet, FileText, Users, CalendarCheck, MessageSquare, Building2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/shared/store/auth";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { serverLog } from "@/shared/lib/logger";
import { hashPassword } from "@/shared/lib/hash";

export function LandingView() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Contact State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isContactLoading, setIsContactLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!email || !password) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);



    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        serverLog('Login Failed', { email, reason: 'query_error', message: error.message }, 'error');
        setLoginError("Unable to sign in right now. Please try again.");
        setIsLoading(false);
        return;
      }

      // Generic message for both unknown email and wrong password (avoids account enumeration).
      if (!data) {
        serverLog('Login Failed', { email, reason: 'unknown_email' }, 'error');
        setLoginError("Invalid email or password.");
        setIsLoading(false);
        return;
      }

      const hashedPassword = await hashPassword(password);

      if (data.password !== hashedPassword && data.password !== password) {
        // Never log the attempted password.
        serverLog('Login Failed', { email, reason: 'bad_password' }, 'error');
        setLoginError("Invalid email or password.");
        setIsLoading(false);
        return;
      }

      // Use the explicit access_level column; fall back to job title check for legacy data
      const role = data.access_level === 'admin' 
        ? 'admin' 
        : data.access_level === 'employee' 
          ? 'employee'
          : (data.role.toLowerCase().includes('manager') || data.role.toLowerCase().includes('admin') ? 'admin' : 'employee');

      serverLog('Login Success', { id: data.id, email: data.email, role }, 'success');

      login({ 
        id: data.id, 
        name: data.name, 
        email: data.email, 
        role: role 
      });

      toast.success(`Welcome back, ${data.name}!`);
      
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      toast.error("An error occurred during login.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      toast.error("Please fill out all fields.");
      return;
    }

    setIsContactLoading(true);
    try {
      // 1. Save contact message to Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          { 
            name: contactName, 
            email: contactEmail, 
            message: contactMessage 
          }
        ]);

      if (error) throw error;

      // 2. Dispatch notification email to mohanprasath563@gmail.com
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'mohanprasath563@gmail.com',
            subject: `New Support Inquiry from ${contactName}`,
            text: `Name: ${contactName}\nEmail: ${contactEmail}\nMessage:\n${contactMessage}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="background-color: #1e293b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 20px;">New Support / Contact Inquiry</h2>
                  <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Autodigix CRM Landing Page</p>
                </div>
                <div style="padding: 24px; color: #334155; line-height: 1.6;">
                  <p style="margin-top: 0;"><strong>Sender Name:</strong> ${contactName}</p>
                  <p><strong>Sender Email:</strong> <a href="mailto:${contactEmail}" style="color: #2563eb;">${contactEmail}</a></p>
                  <p><strong>Message:</strong></p>
                  <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; white-space: pre-wrap; font-size: 14px; color: #0f172a;">${contactMessage}</div>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">Autodigix CRM System Notification</p>
                </div>
              </div>
            `
          })
        });
      } catch (emailErr) {
        console.error('Failed to dispatch contact email notification:', emailErr);
      }

      toast.success("Message sent successfully! We'll get back to you soon.");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (err) {
      toast.error("Failed to send message. Please try again later.");
      console.error(err);
    } finally {
      setIsContactLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Animation variants
  const staggerContainer: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const fadeUp: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const scaleUp: any = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div 
      className="min-h-screen bg-white text-black antialiased overflow-x-hidden selection:bg-gray-200"
      style={{ fontFamily: '"Inter", sans-serif' }}
    >
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 z-50 w-full bg-white border-b border-blue-100 shadow-sm"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer font-semibold text-xl tracking-tight" onClick={() => window.scrollTo(0,0)}>
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md">
              <Building2 className="size-4" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Autodigix CRM</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">Capabilities</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">Platform</button>
            <button onClick={() => scrollToSection('contact')} className="text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">Contact</button>
            <Button onClick={() => scrollToSection('login')} className="rounded-full bg-blue-600 text-white hover:bg-blue-700 px-6 font-medium shadow-md hover:shadow-lg transition-all">
              Sign In
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                Complete Workforce Management,<br/>
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">simplified.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-gray-600 mb-8 leading-relaxed font-normal">
                Autodigix CRM brings your entire workforce under one unified platform. Track attendance in real-time, manage leaves effortlessly, automate payroll, and empower employees with self-service access.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => scrollToSection('login')} className="h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg px-8 text-base font-medium transition-all hover:scale-105 shadow-md">
                  Access Portal
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button variant="outline" onClick={() => scrollToSection('features')} className="h-12 rounded-full px-8 text-base border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-all hover:scale-105">
                  Explore Features
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-sm text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-blue-600" />
                  Instant Syncing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-blue-600" />
                  Automated Notifications
                </div>
              </motion.div>
            </motion.div>

            {/* Login Card inside Hero */}
            <motion.div 
              id="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative mx-auto w-full max-w-md lg:ml-auto"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition"></div>
              <div className="relative rounded-3xl border border-blue-200 bg-white p-8 shadow-xl">
                <div className="mb-8">
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold mb-3">Secure Login</div>
                  <h2 className="text-3xl font-bold text-gray-900">Portal Login</h2>
                  <p className="text-sm text-gray-500 mt-2 font-normal">For administrators and employees</p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">WORK EMAIL</Label>
                    <Input 
                      type="email" 
                      placeholder="e.g. admin@company.com" 
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                      className="h-12 rounded-xl border-blue-200 bg-blue-50 focus-visible:ring-blue-500 focus:border-blue-500 font-normal transition-all hover:border-blue-300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">PASSWORD</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                      className="h-12 rounded-xl border-blue-200 bg-blue-50 focus-visible:ring-blue-500 focus:border-blue-500 font-normal transition-all hover:border-blue-300"
                      required
                    />
                  </div>

                  {loginError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
                    >
                      {loginError}
                    </motion.p>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transition-all mt-6 font-medium shadow-md"
                  >
                    {isLoading ? <Loader2 className="animate-spin size-4" /> : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-blue-100">
                  <p className="text-xs text-gray-500 text-center">Enterprise-grade security • SSL encrypted</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* Capabilities Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-blue-50 to-white border-y border-blue-100 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-gray-900">Powerful Features for Modern Workforce Management</h2>
            <p className="text-gray-600 text-lg font-normal">
              Autodigix CRM comes packed with everything you need to manage your team efficiently and effectively.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Clock className="size-6" />,
                title: "Real-time Attendance Tracking",
                desc: "Employees clock in/out with instant updates. Admin sees live working status, daily records, and attendance analytics from November onwards."
              },
              {
                icon: <PlaneTakeoff className="size-6" />,
                title: "Leave Management",
                desc: "Employees apply for leave with date ranges. Admins approve/reject requests. System automatically excludes weekends and holidays from leave calculations."
              },
              {
                icon: <Wallet className="size-6" />,
                title: "Automated Payroll",
                desc: "Month-end payroll processing with one click. Automatic calculation of gross/net pay, deductions, LOP, tax withholding, and instant payslip generation."
              },
              {
                icon: <FileText className="size-6" />,
                title: "Digital Payslips",
                desc: "Professional payslip PDFs generated automatically. Shows earnings, deductions, and net pay. Auto-emailed to employees with complete payment history."
              },
              {
                icon: <Users className="size-6" />,
                title: "Employee Directory",
                desc: "Centralized employee database for admins. Manage profiles, employment details, emergency contacts, and view complete attendance analytics per employee."
              },
              {
                icon: <CalendarCheck className="size-6" />,
                title: "Holiday Calendar",
                desc: "Company-wide holiday management. Upcoming holidays displayed to employees, automatically excluded from work calculations and leave planning."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={fadeUp}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 border border-blue-100 shadow-md transition-all hover:shadow-lg hover:border-blue-300"
              >
                <div className="size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center mb-6 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-normal">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works / Deep Dive */}
      <section id="how-it-works" className="py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1 relative h-[500px] rounded-3xl border border-gray-100 bg-gray-50 overflow-hidden p-8 flex flex-col justify-center shadow-inner"
            >
               <motion.div 
                 variants={staggerContainer}
                 initial="hidden"
                 whileInView="show"
                 viewport={{ once: true }}
                 className="space-y-4 max-w-sm mx-auto w-full"
               >
                  <motion.div variants={scaleUp} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform hover:scale-105 cursor-default">
                     <div className="flex items-center gap-3">
                       <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-sm">EMP</div>
                       <div>
                         <p className="text-sm font-semibold">Liam O'Brien</p>
                         <p className="text-xs text-gray-500 font-normal">Requested 5 days off</p>
                       </div>
                     </div>
                     <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-600 rounded-md">Pending</span>
                  </motion.div>
                  
                  <motion.div variants={fadeUp} className="flex justify-center py-2">
                     <div className="w-0.5 h-8 bg-gray-200"></div>
                  </motion.div>

                  <motion.div variants={scaleUp} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform hover:scale-105 cursor-default">
                     <div className="flex items-center gap-3">
                       <div className="size-10 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm">ADM</div>
                       <div>
                         <p className="text-sm font-semibold">Admin Action</p>
                         <p className="text-xs text-gray-500 font-normal">Approved request</p>
                       </div>
                     </div>
                     <motion.div
                       initial={{ scale: 0 }}
                       whileInView={{ scale: 1 }}
                       transition={{ delay: 1, type: "spring" }}
                     >
                        <CheckCircle2 className="size-5 text-black" />
                     </motion.div>
                  </motion.div>

                  <motion.div variants={fadeUp} className="flex justify-center py-2">
                     <div className="w-0.5 h-8 bg-gray-200"></div>
                  </motion.div>

                  <motion.div variants={scaleUp} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-black transition-transform hover:scale-105 cursor-default">
                     <div className="flex items-center gap-3">
                       <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
                         <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                       </div>
                       <div>
                         <p className="text-sm font-semibold">Notification Sent</p>
                         <p className="text-xs text-gray-500 font-normal">Notifying employee of approval</p>
                       </div>
                     </div>
                  </motion.div>
               </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2 space-y-6"
            >
              <h2 className="text-3xl font-semibold tracking-tight">A platform that works instantly.</h2>
              <p className="text-lg text-gray-500 leading-relaxed font-normal">
                Experience a deeply integrated system where approvals, timesheets, and communications happen without delay.
              </p>
              
              <ul className="space-y-4 pt-4">
                {[
                  { title: "Live Timesheets", desc: "When an employee clocks in, the Admin's \"Working Now\" dashboard counter immediately ticks up.", icon: <Clock className="size-3 text-black" /> },
                  { title: "Automated Communications", desc: "Approving leaves, generating payroll, or onboarding employees automatically notifies the right people instantly.", icon: <ShieldCheck className="size-3 text-black" /> },
                  { title: "Centralized Hub", desc: "All holiday calendars, notifications, and company directories are unified in one secure system.", icon: <Building2 className="size-3 text-black" /> },
                ].map((item, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-start gap-4 p-3 -ml-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default"
                  >
                    <div className="mt-1 size-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 font-normal">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-50 border-t border-gray-100 overflow-hidden">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex size-12 rounded-xl bg-black text-white items-center justify-center mb-6 shadow-md">
              <MessageSquare className="size-6" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight mb-4">Report an Issue</h2>
            <p className="text-gray-500 text-lg font-normal">
              Experiencing problems with your portal? Send a message directly to our support team and we'll get it sorted out immediately.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm"
          >
            <form className="space-y-6" onSubmit={handleContact}>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your Name</Label>
                  <Input 
                    type="text" 
                    placeholder="John Doe" 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-black font-normal transition-colors hover:border-gray-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email Address</Label>
                  <Input 
                    type="email" 
                    placeholder="name@company.com" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-black font-normal transition-colors hover:border-gray-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">How can we help?</Label>
                <textarea 
                  rows={4}
                  placeholder="Describe the problem you are facing..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 font-normal transition-colors hover:border-gray-300 resize-none"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isContactLoading}
                className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800 transition-all font-medium"
              >
                {isContactLoading ? <Loader2 className="animate-spin size-4" /> : "Send Message"}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-black" />
            <span className="text-lg font-semibold">Autodigix CRM</span>
          </div>
          <p className="text-sm text-gray-400 font-normal">
            © 2026 Autodigix. Enterprise ready.
          </p>
        </div>
      </footer>
    </div>
  );
}
