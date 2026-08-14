"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

// Centralized role permissions mapping for client-side pages
const PAGE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/banks": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/categories": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/companies": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/pincodes": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/loan-products": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/policies": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/import": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "/import-history": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "/crm/leads": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/crm/customers": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/executives": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "/cms": ["SUPER_ADMIN", "ADMIN"],
  "/marketing": ["SUPER_ADMIN", "ADMIN"],
  "/security/users": ["SUPER_ADMIN", "ADMIN"],
  "/audit-logs": ["SUPER_ADMIN", "ADMIN"],
  "/applications": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"],
  "/system": ["SUPER_ADMIN", "ADMIN"],
};

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();

  // checking = true until the async checkAuth() call finishes
  const [checking, setChecking] = useState(true);
  // redirecting = true while we're waiting for router.push to take effect
  const [redirecting, setRedirecting] = useState(false);

  // ── Step 1: Run auth check once on mount ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await checkAuth();
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [checkAuth]);

  // ── Step 2: Apply role/page CSS classes to <html> ───────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.className = root.className
      .split(" ")
      .filter((c) => !c.startsWith("role-") && !c.startsWith("page-"))
      .join(" ");

    if (user) root.classList.add(`role-${user.role.toLowerCase()}`);
    const pageName =
      pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home";
    root.classList.add(`page-${pageName}`);
  }, [user, pathname]);

  // ── Step 3: Handle redirects in useEffect (NOT during render) ───────────
  useEffect(() => {
    if (checking) return; // Wait until auth check is done

    // On login page ("/") — if already logged in, go to dashboard
    if (pathname === "/" && isAuthenticated) {
      setRedirecting(true);
      router.replace("/dashboard");
      return;
    }

    // On protected pages — if not logged in, go to login
    if (pathname !== "/" && (!isAuthenticated || !user)) {
      setRedirecting(true);
      router.replace("/");
      return;
    }

    setRedirecting(false);
  }, [checking, isAuthenticated, user, pathname, router]);

  // ── Loading states ───────────────────────────────────────────────────────
  if (checking || isLoading || redirecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-royal animate-spin" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          {redirecting ? "Redirecting..." : "Restoring secure session..."}
        </p>
      </div>
    );
  }

  // ── Login page — unauthenticated users see the login form ────────────────
  if (pathname === "/") {
    return <div key={pathname} className="contents">{children}</div>;
  }

  // ── Protected page — check role authorization ────────────────────────────
  const allowedRoles =
    PAGE_PERMISSIONS[pathname] ?? ["SUPER_ADMIN", "ADMIN"]; // strict fallback
  const isAuthorized = user ? allowedRoles.includes(user.role) : false;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 selection:bg-royal text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white tracking-tight">
              Access Restricted
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Your current role{" "}
              <span className="text-rose-400 font-black">({user?.role})</span>{" "}
              does not have privileges to view{" "}
              <span className="font-mono text-slate-200">{pathname}</span>.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800">
            <button
              className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
