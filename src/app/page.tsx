"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Mail,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: email.trim(), password });
      router.replace("/dashboard");
    } catch {
      // Handled by auth store
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc] dark:bg-[#030712] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden transition-colors duration-200">
      {/* ── Background Ambient Glows ────────────────────────────── */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Top-Right Theme Toggle Floating Bar ──────────────────── */}
      <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
        <ThemeToggle />
      </div>

      {/* ── Left Showcase Panel (Desktop) ───────────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-16 border-r border-slate-200 dark:border-white/[0.06] relative z-10 bg-slate-100/70 dark:bg-[#060c1c]/90 backdrop-blur-xl">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-[#091024] rounded-2xl flex items-center justify-center">
              <img
                src="/brand/nvit-icon-animated.svg"
                alt="NVIT.SPACE"
                className="nvit-logo w-7 h-7"
                width="28"
                height="28"
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl tracking-tight text-slate-900 dark:text-white flex items-center">
              <span className="font-extrabold">NVIT</span>
              <span className="text-blue-600 dark:text-blue-500 font-black">.</span>
              <span className="font-light tracking-wider text-slate-600 dark:text-slate-300">SPACE</span>
            </h2>
            <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-bold block">
              Enterprise Control Center
            </span>
          </div>
        </div>

        {/* Center Highlights */}
        <div className="max-w-lg space-y-8 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NVIT Engine 2.0 • Real-Time Underwriting</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Unified Fintech &amp; Lending Operations Platform
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Direct access to multi-bank policy matrices, automated company categorizations,
              pincode eligibility, and CRM pipeline controls.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              {
                icon: Layers,
                title: "Multi-Bank Policies",
                desc: "Real-time eligibility & FOIR calculation",
              },
              {
                icon: Activity,
                title: "Live Telemetry",
                desc: "VPS, PostgreSQL & API uptime logs",
              },
              {
                icon: Shield,
                title: "Forensic Audit Trail",
                desc: "Immutable compliance action history",
              },
              {
                icon: ShieldCheck,
                title: "Role Security Matrix",
                desc: "Granular RBAC with API key manager",
              },
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0b1329]/70 border border-slate-200 dark:border-white/[0.06] hover:border-blue-500/40 transition-all space-y-1.5 shadow-xs dark:shadow-none"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{f.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-slate-600 dark:text-slate-400">NVIT Gateway: Operational (99.98%)</span>
          </div>
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">v2.4.0-enterprise</span>
        </div>
      </div>

      {/* ── Right Login Form Area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white dark:bg-[#091024]/95 border border-slate-200 dark:border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-7"
        >
          {/* Mobile Logo Header */}
          <div className="text-center space-y-2 lg:hidden">
            <img
              src="/brand/nvit-icon-animated.svg"
              alt="NVIT.SPACE"
              className="nvit-logo w-12 h-12 mx-auto"
              width="48"
              height="48"
            />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">NVIT.SPACE Admin</h2>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Admin Sign In</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Enter your authorized enterprise credentials to access the console.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="admin-email"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nvit.space"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-[#050b18] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-[#050b18] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Open Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Guarantee */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] text-center space-y-1">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>TLS 1.3 &amp; 256-Bit Encrypted Admin Gateway</span>
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Unauthorized access attempts are audited and reported.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
