import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LandingView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Dynamic Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 flex justify-center">
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute right-[-10%] top-[20%] h-[600px] w-[600px] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-20%] left-[20%] h-[700px] w-[700px] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-multiply" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-blue-500 text-primary-foreground shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <span className="text-xl font-bold tracking-tight">Autodigix</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex">Features</Button>
            <Button variant="ghost" className="hidden sm:flex">Pricing</Button>
            <Button variant="outline" className="rounded-full">Contact Sales</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Copy */}
            <div className="max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                Autodigix HR Platform 2.0 is live
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                The intelligent way to manage your workforce.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Streamline payroll, automate attendance, and empower your employees with the most beautifully designed HR system built for modern teams.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="size-5 text-primary" />
                  Enterprise Ready
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="size-5 text-blue-500" />
                  Employee Centric
                </div>
              </div>
            </div>

            {/* Right Column: Login Card */}
            <div className="relative mx-auto w-full max-w-md animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {/* Decorative elements behind card */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/30 to-blue-500/30 blur-lg" />
              
              <div className="relative rounded-2xl border border-border/50 bg-background/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                  <p className="text-sm text-muted-foreground mt-1">Sign in to your Autodigix portal</p>
                </div>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@company.com" 
                      className="h-11 rounded-xl bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot?</a>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-11 rounded-xl bg-background/50"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    <Button 
                      type="button" 
                      onClick={() => navigate('/admin/dashboard')}
                      className="h-11 w-full rounded-xl group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        Sign in as Admin
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Button>
                    
                    <div className="relative py-2 text-center">
                      <div className="absolute inset-0 top-1/2 h-px bg-border" />
                      <span className="relative bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                        or
                      </span>
                    </div>

                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate('/employee/dashboard')}
                      className="h-11 w-full rounded-xl border-border/50 hover:bg-muted/50"
                    >
                      Sign in as Employee
                    </Button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
