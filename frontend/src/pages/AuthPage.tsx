import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { ApiError, api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Field, FormField } from "../components/ui/Field";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const schema = z.object({
    username: z.string().min(isRegister ? 3 : 1, isRegister ? "Use at least 3 characters" : "Enter your username").max(100),
    email: isRegister ? z.string().email("Enter a valid email") : z.string().optional(),
    password: z.string().min(isRegister ? 8 : 1, isRegister ? "Use at least 8 characters" : "Enter your password"),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { acceptSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/app";
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", password: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    setServerError("");
    try {
      const session = isRegister
        ? await api.register(values.username, values.email ?? "", values.password)
        : await api.login(values.username, values.password);
      acceptSession(session);
      navigate(next, { replace: true });
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  });

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.02fr_.98fr]">
      <section className="relative hidden overflow-hidden bg-[#123e34] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-32 -top-28 size-[480px] rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-12 size-[340px] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-lime text-brand"><Activity size={21} /></span><span className="text-lg font-bold tracking-tight">ledgerflow</span></div>
        <div className="relative max-w-lg">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-[#d5f16b]"><span className="size-1.5 rounded-full bg-lime" /> YOUR FINANCES, IN GOOD FLOW</p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">Move money<br />with <span className="text-[#d5f16b]">more meaning.</span></h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-white/65">A considered space for the everyday movement of your money. Clear balances, confident transfers, and a ledger that keeps its word.</p>
          <div className="mt-9 space-y-3">
            {["A clear view across every wallet", "Transfers with built-in protection", "A complete, transparent history"].map((item) => <p key={item} className="flex items-center gap-2.5 text-sm text-white/80"><CheckCircle2 size={17} className="text-[#d5f16b]" />{item}</p>)}
          </div>
        </div>
        <p className="relative text-xs text-white/40">Thoughtful money movement. Built on a double-entry ledger.</p>
      </section>
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex items-center gap-2 lg:hidden"><span className="grid size-9 place-items-center rounded-xl bg-brand text-lime"><Activity size={19} /></span><span className="font-bold tracking-tight text-ink">ledgerflow</span></div>
        <div className="mx-auto my-auto w-full max-w-[420px] py-10">
          <div className="mb-8">
            <span className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-[#edf7f3] text-brand"><LockKeyhole size={22} /></span>
            <p className="text-sm font-semibold text-brand">{isRegister ? "GET STARTED" : "WELCOME BACK"}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{isRegister ? "Create your account" : "Sign in to LedgerFlow"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{isRegister ? "A better view of your money starts here." : "Your money, right where you left it."}</p>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <FormField label="Username" error={form.formState.errors.username?.message}>
              <Field autoComplete="username" placeholder="Your username" aria-invalid={!!form.formState.errors.username} {...form.register("username")} />
            </FormField>
            {isRegister && <FormField label="Email address" error={form.formState.errors.email?.message}>
              <Field type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
            </FormField>}
            <FormField label="Password" error={form.formState.errors.password?.message}>
              <span className="relative block">
                <Field type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "At least 8 characters" : "Your password"} aria-invalid={!!form.formState.errors.password} {...form.register("password")} />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </FormField>
            {serverError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{serverError}</div>}
            <Button className="mt-2 w-full" disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"} {!form.formState.isSubmitting && <ArrowRight size={17} />}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            {isRegister ? "Already have an account?" : "New to LedgerFlow?"}{" "}
            <Link className="font-semibold text-brand hover:underline" to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
          </p>
          <p className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted"><LockKeyhole size={13} /> Your session is protected and stays on this device.</p>
        </div>
      </section>
    </main>
  );
}
