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
  "/data-cleanup": ["SUPER_ADMIN", "ADMIN"],
};

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();

  // checking = true until initial checkAuth() finishes
  const [checking, setChecking] = useState(true);

  // ── Step 1: Run auth check once on mount ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await checkAuth();
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [checkAuth]);

  // ── Handle custom auth redirect events from apiClient / useAuthStore ────
  useEffect(() => {
    const handleAuthRedirect = (e: Event) => {
      const { path } = (e as CustomEvent<{ path: string }>).detail;
      router.replace(path);
    };
    window.addEventListener("admin:auth:redirect", handleAuthRedirect);
    return () => window.removeEventListener("admin:auth:redirect", handleAuthRedirect);
  }, [router]);

  // ── Step 2: Apply role/page CSS classes to <html> safely ───────────────
  useEffect(() => {
    const root = document.documentElement;
    // Remove only previous role-* and page-* classes without removing dark mode
    const classesToRemove: string[] = [];
    root.classList.forEach((cls) => {
      if (cls.startsWith("role-") || cls.startsWith("page-")) {
        classesToRemove.push(cls);
      }
    });
    classesToRemove.forEach((cls) => root.classList.remove(cls));

    if (user) root.classList.add(`role-${user.role.toLowerCase()}`);
    const pageName =
      pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home";
    root.classList.add(`page-${pageName}`);
  }, [user, pathname]);

  // ── Step 3: Handle redirects in useEffect ───────────────────────────────
  const shouldRedirectToDashboard = !checking && pathname === "/" && isAuthenticated && Boolean(user);
  const shouldRedirectToLogin = !checking && pathname !== "/" && (!isAuthenticated || !user);
  const isRedirecting = shouldRedirectToDashboard || shouldRedirectToLogin;

  useEffect(() => {
    if (shouldRedirectToDashboard) {
      router.replace("/dashboard");
    } else if (shouldRedirectToLogin) {
      router.replace("/");
    }
  }, [shouldRedirectToDashboard, shouldRedirectToLogin, router]);

  // ── Initial Loading state (only when user session is not yet loaded) ────
  const showInitialLoading = (!user && checking) || (!user && isLoading) || (!user && isRedirecting);
  if (showInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#040813] flex flex-col items-center justify-center space-y-4 text-slate-800 dark:text-slate-200">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
          {isRedirecting ? "Redirecting..." : "Restoring secure session..."}
        </p>
      </div>
    );
  }

  // ── Login page — unauthenticated users see login form ───────────────────
  if (pathname === "/") {
    return <div key="admin-auth-login" className="contents">{children}</div>;
  }

  // ── Protected page — check role authorization ────────────────────────────
  const allowedRoles =
    PAGE_PERMISSIONS[pathname] ?? ["SUPER_ADMIN", "ADMIN"];
  const isAuthorized = user ? allowedRoles.includes(user.role) : false;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#040813] p-6 selection:bg-blue-600 text-slate-900 dark:text-white">
        <div className="w-full max-w-md bg-white dark:bg-[#060c1c] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Access Restricted
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              Your current role{" "}
              <span className="text-rose-600 dark:text-rose-400 font-black">({user?.role})</span>{" "}
              does not have privileges to view{" "}
              <span className="font-mono text-slate-800 dark:text-slate-200">{pathname}</span>.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              className="btn-secondary w-full h-11 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
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
