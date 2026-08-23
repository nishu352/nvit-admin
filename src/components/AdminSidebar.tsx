"use client";

import React, { useState, useMemo, memo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "motion/react";
import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Building,
  FolderTree,
  MapPin,
  Package,
  FileSpreadsheet,
  UploadCloud,
  History,
  GitPullRequest,
  UserCheck,
  UserSquare2,
  Globe,
  Layout,
  Megaphone,
  Target,
  Shield,
  User,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  Sparkles,
  Sliders,
  Activity,
  MessageSquareText,
  PanelLeftClose,
  PanelLeft,
  FileCheck,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarSection {
  title: string;
  id: string;
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  items: SidebarItem[];
}

interface AdminSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ── Custom SVG icon for Database ──────────────────────────────────────────────
function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

// ── Static sidebar sections ───────────────────────────────────────────────────
const STATIC_SECTIONS: SidebarSection[] = [
  {
    title: "MASTER MANAGEMENT",
    id: "master",
    icon: DatabaseIcon,
    items: [
      { name: "Banks & NBFCs", href: "/banks", icon: Building2 },
      { name: "Company Management", href: "/companies", icon: Building },
      { name: "Company Categories", href: "/categories", icon: FolderTree },
      { name: "Pincode Management", href: "/pincodes", icon: MapPin },
      { name: "Loan Products", href: "/loan-products", icon: Package },
      { name: "Bank Policies", href: "/policies", icon: FileSpreadsheet },
    ],
  },
  {
    title: "DATA MANAGEMENT",
    id: "data",
    icon: UploadCloud,
    items: [
      { name: "Company Excel Upload", href: "/import", icon: UploadCloud },
      { name: "Pincode Excel Upload", href: "/pincodes/import", icon: UploadCloud },
      { name: "Import History", href: "/import-history", icon: History },
      { name: "Database Sanitizer", href: "/data-cleanup", icon: Sparkles },
    ],
  },
  {
    title: "CRM & INQUIRIES",
    id: "crm",
    icon: UserSquare2,
    items: [
      { name: "Lead Pipeline", href: "/crm/leads", icon: GitPullRequest },
      { name: "Customers Registry", href: "/crm/customers", icon: UserCheck },
      { name: "Loan Applications", href: "/applications", icon: FileCheck },
      { name: "Field Executives", href: "/executives", icon: UserSquare2 },
    ],
  },
  {
    title: "WEBSITE CMS",
    id: "cms",
    icon: Globe,
    items: [
      { name: "Live Site Editor", href: "/cms", icon: Layout },
    ],
  },
  {
    title: "MARKETING & ADS",
    id: "marketing",
    icon: Megaphone,
    items: [
      { name: "Ad Conversions & SEO", href: "/marketing", icon: Target },
    ],
  },
  {
    title: "SECURITY & LOGS",
    id: "security",
    icon: Shield,
    items: [
      { name: "Admin Users & Keys", href: "/security/users", icon: User },
      { name: "Forensic Audit Trail", href: "/audit-logs", icon: ShieldAlert },
    ],
  },
  {
    title: "SUPPORT & TICKETS",
    id: "support",
    icon: MessageSquareText,
    items: [
      { name: "Feedback & Grievances", href: "/feedback", icon: MessageSquareText },
    ],
  },
  {
    title: "INFRASTRUCTURE",
    id: "system",
    icon: Sliders,
    items: [
      { name: "VPS & DB Analytics", href: "/analytics", icon: Activity },
      { name: "System Settings", href: "/system", icon: Sliders },
    ],
  },
];

// ── Sidebar Component ─────────────────────────────────────────────────────────
function AdminSidebarComponent({
  isMobile,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      master: false,
      data: false,
      crm: false,
      cms: false,
      marketing: false,
      support: false,
      security: false,
      system: false,
    };
    for (const sec of STATIC_SECTIONS) {
      if (
        sec.items.some(
          (item) =>
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
        )
      ) {
        initial[sec.id] = true;
      }
    }
    return initial;
  });

  // Role-based visible sections
  const visibleSections = useMemo(() => {
    return STATIC_SECTIONS
      .filter((sec) => {
        if (!user) return false;
        if (user.role === "EXECUTIVE") return sec.id === "crm";
        if (user.role === "VIEWER") return sec.id === "master" || sec.id === "crm";
        if (user.role === "MANAGER") return ["master", "data", "crm"].includes(sec.id);
        return true;
      })
      .map((sec) => {
        let items = sec.items;
        if (user?.role === "EXECUTIVE" || user?.role === "VIEWER") {
          items = items.filter((item) => item.href !== "/executives");
        }
        return { ...sec, items };
      });
  }, [user]);

  // Auto-expand active section during render when pathname changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    const activeSection = visibleSections.find((sec) =>
      sec.items.some(
        (item) =>
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
      )
    );
    if (activeSection && !expandedSections[activeSection.id]) {
      setExpandedSections((prev) => ({ ...prev, [activeSection.id]: true }));
    }
  }

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const handleLinkClick = useCallback(() => {
    if (isMobile && onClose) onClose();
  }, [isMobile, onClose]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  return (
    <aside
      className={`h-full flex flex-col bg-white dark:bg-[#060c1c] border-r border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 overflow-hidden select-none transition-all duration-250 ${
        collapsed && !isMobile ? "w-16" : "w-64"
      }`}
    >
      {/* ── Brand Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 dark:border-white/[0.08] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1px] shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-[#060c1c] rounded-xl flex items-center justify-center">
              <img
                src="/brand/nvit-icon-animated.svg"
                alt="NVIT.SPACE"
                className="nvit-logo w-5 h-5 shrink-0"
                width="20"
                height="20"
              />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-[15px] leading-tight tracking-tight flex items-center">
                <span className="font-extrabold text-slate-900 dark:text-white">NVIT</span>
                <span className="text-blue-500 font-black">.</span>
                <span className="font-light tracking-wide text-slate-600 dark:text-slate-400">SPACE</span>
              </h2>
              <span className="text-[8px] uppercase tracking-[0.2em] text-emerald-400 font-bold block">
                Enterprise Admin
              </span>
            </div>
          )}
        </div>

        {/* Mobile close / Desktop collapse toggle */}
        {isMobile && onClose ? (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        ) : onToggleCollapse ? (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        ) : null}
      </div>

      {/* ── User Card ─────────────────────────────────────────── */}
      <div
        className={`mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex items-center shrink-0 overflow-hidden transition-all duration-200 ${
          collapsed ? "p-2 justify-center" : "p-3 gap-3"
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-blue-600/20">
          {userInitial}
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-none mb-1">
              {user?.name || "Admin User"}
            </h4>
            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider leading-none">
              {user?.role?.replace("_", " ") || "SUPER ADMIN"}
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 px-2.5 overflow-y-auto pb-4 space-y-0.5">
        {/* Main Dashboard Link */}
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          title={collapsed ? "Operations Dashboard" : undefined}
          className={`relative flex items-center rounded-xl text-xs font-bold transition-all overflow-hidden ${
            collapsed ? "h-10 justify-center px-0" : "h-9 px-3 gap-3"
          } ${
            pathname === "/dashboard"
              ? "text-white"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          }`}
        >
          {pathname === "/dashboard" && (
            <motion.div
              layoutId="sidebar-active-bg"
              className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30 pointer-events-none"
              transition={{ type: "spring", stiffness: 500, damping: 36 }}
            />
          )}
          <LayoutDashboard className="w-4 h-4 shrink-0 relative z-10" />
          {!collapsed && <span className="relative z-10 truncate">Dashboard</span>}
        </Link>

        {/* Section Navigation Groups */}
        {visibleSections.map((section) => {
          const SectionIcon = section.icon as React.ElementType;
          const expanded = expandedSections[section.id];
          const isSubitemActive = section.items.some(
            (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          );

          return (
            <div key={section.id} className="pt-1">
              <button
                type="button"
                onClick={() => (collapsed ? undefined : toggleSection(section.id))}
                title={collapsed ? section.title : undefined}
                className={`w-full flex items-center rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer overflow-hidden ${
                  collapsed ? "h-10 justify-center px-0" : "h-8 px-3 gap-2 justify-between"
                } ${
                  isSubitemActive
                    ? "text-blue-500 bg-blue-500/10"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <SectionIcon className="w-3.5 h-3.5 shrink-0" />
                  {!collapsed && <span className="truncate">{section.title}</span>}
                </div>
                {!collapsed &&
                  (expanded ? (
                    <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />
                  ))}
              </button>

              {/* Sub-items list */}
              <AnimatePresence initial={false}>
                {expanded && !collapsed && (
                  <motion.div
                    key={`section-${section.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3.5 ml-3 border-l border-slate-200 dark:border-white/[0.08] py-0.5 space-y-0.5 my-0.5">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const active =
                          pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`relative flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-xs transition-colors ${
                              active
                                ? "text-blue-500 bg-blue-500/10 font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] font-medium"
                            }`}
                          >
                            {active && (
                              <motion.div
                                layoutId="sidebar-active-subitem"
                                className="absolute inset-0 rounded-lg border-l-2 border-blue-500 pointer-events-none"
                                transition={{ type: "spring", stiffness: 500, damping: 36 }}
                              />
                            )}
                            <ItemIcon className="w-3.5 h-3.5 shrink-0 relative z-10" />
                            <span className="relative z-10 truncate">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ── Footer / Logout ──────────────────────────────────── */}
      <div className="px-2.5 pb-4 border-t border-slate-100 dark:border-white/[0.08] pt-3 shrink-0">
        <button
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer overflow-hidden ${
            collapsed ? "h-10 justify-center" : "h-9 px-3 gap-2.5"
          } text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

const AdminSidebar = memo(AdminSidebarComponent);
export default AdminSidebar;
