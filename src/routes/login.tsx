import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Pulse HR" },
      { name: "description", content: "Sign in to your Pulse HR workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] translate-x-1/3 translate-y-1/3 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_60%,var(--background)_100%)]" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-blue-400 text-primary-foreground shadow-elevated">
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your Pulse HR workspace</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/" });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Work email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  defaultValue="aarav@pulse.co"
                  className="h-11 rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pw" className="text-xs font-medium text-muted-foreground">
                  Password
                </Label>
                <a href="#" className="text-xs font-medium text-primary hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="pw" type="password" placeholder="••••••••" defaultValue="password" className="h-11 rounded-xl pl-9" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox defaultChecked /> Keep me signed in for 30 days
            </label>
            <Button type="submit" className="h-11 w-full rounded-xl text-sm font-medium">
              Sign in
              <ArrowRight className="ml-1 size-4" />
            </Button>
            <div className="relative py-1 text-center">
              <div className="absolute inset-0 top-1/2 h-px bg-border" />
              <span className="relative bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                or
              </span>
            </div>
            <Button type="button" variant="outline" className="h-11 w-full rounded-xl font-medium">
              Continue with SSO
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          New to Pulse HR?{" "}
          <Link to="/" className="font-medium text-primary hover:underline">
            Explore the demo
          </Link>
        </p>
      </div>
    </div>
  );
}
