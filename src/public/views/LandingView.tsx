import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck, Clock, Users, Building2, Wallet, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/shared/store/auth";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { serverLog } from "@/shared/lib/logger";

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

      if (!data) {
        serverLog('Login Failed', { email, error: error?.message || 'Email not found' }, 'error');
        setLoginError("Account does not exist.");
        setIsLoading(false);
        return;
      }

      if (data.password !== password) {
        serverLog('Login Failed', { email, attemptedPassword: password, actualPassword: data.password }, 'error');
        setLoginError(`Incorrect password! Hint: The actual password in the database is '${data.password}'`);
        setIsLoading(false);
        return;
      }

      const role = data.role.toLowerCase().includes('manager') || data.role.toLowerCase().includes('admin') 
        ? 'admin' 
        : 'employee';

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
      // Save contact message to Supabase
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
        className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer font-semibold text-xl tracking-tight" onClick={() => window.scrollTo(0,0)}>
            <div className="grid size-8 place-items-center rounded-lg bg-black text-white shadow-sm">
              <Building2 className="size-4" />
            </div>
            Autodigix HR
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollToSection('features')} className="text-gray-500 hover:text-black transition-colors hidden sm:block">Capabilities</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-500 hover:text-black transition-colors hidden sm:block">Platform</button>
            <button onClick={() => scrollToSection('contact')} className="text-gray-500 hover:text-black transition-colors hidden sm:block">Contact</button>
            <Button onClick={() => scrollToSection('login')} className="rounded-full bg-black text-white hover:bg-gray-800 px-6 font-medium">
              Sign In
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-24 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
                Your entire workforce, <br/>
                <span className="text-gray-400 font-medium">managed in one place.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-gray-500 mb-8 leading-relaxed font-normal">
                Autodigix is a comprehensive HR platform connecting administrators and employees. Automate your payroll, track live attendance, and approve leave requests with zero friction.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => scrollToSection('login')} className="h-12 rounded-full bg-black text-white hover:bg-gray-800 px-8 text-base font-medium transition-transform hover:scale-105">
                  Access Portal
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button variant="outline" onClick={() => scrollToSection('features')} className="h-12 rounded-full px-8 text-base border-gray-200 font-medium transition-transform hover:scale-105">
                  Explore Features
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-black" />
                  Instant Syncing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-black" />
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
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold tracking-tight">Portal Login</h2>
                  <p className="text-sm text-gray-500 mt-1 font-normal">For administrators and employees.</p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Work Email</Label>
                    <Input 
                      type="email" 
                      placeholder="e.g. admin@company.com" 
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                      className="h-12 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-black font-normal transition-colors hover:border-gray-300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal uppercase tracking-wider text-gray-500">Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                      className="h-12 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-black font-normal transition-colors hover:border-gray-300"
                      required
                    />
                  </div>

                  {loginError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-lg border border-red-100"
                    >
                      {loginError}
                    </motion.p>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800 transition-all mt-4 font-medium"
                  >
                    {isLoading ? <Loader2 className="animate-spin size-4" /> : "Sign In"}
                  </Button>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* Capabilities Section */}
      <section id="features" className="py-24 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl font-semibold tracking-tight mb-4">A complete HR ecosystem</h2>
            <p className="text-gray-500 text-lg font-normal">
              Designed for absolute clarity and speed. Every action taken in Autodigix reflects instantly across the entire organization, keeping your team perfectly aligned.
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
                icon: <ShieldCheck className="size-6" />,
                title: "Admin Command Center",
                desc: "A powerful overview of your company. Monitor live attendance, review pending leave requests, manage departments, and onboard new hires with automated welcome emails."
              },
              {
                icon: <Users className="size-6" />,
                title: "Employee Self-Service",
                desc: "A dedicated portal for your staff. Employees can clock in and out, apply for time off, view the company holiday calendar, and access their historical payslips securely."
              },
              {
                icon: <Wallet className="size-6" />,
                title: "Automated Payroll",
                desc: "Run payroll for the entire company with one click. The system calculates gross and net pay based on active status, generates digital payslips, and automatically emails them."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={fadeUp}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="size-12 rounded-xl bg-black text-white flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-normal">
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
            <span className="text-lg font-semibold">Autodigix HR</span>
          </div>
          <p className="text-sm text-gray-400 font-normal">
            © 2026 Autodigix. Enterprise ready.
          </p>
        </div>
      </footer>
    </div>
  );
}
