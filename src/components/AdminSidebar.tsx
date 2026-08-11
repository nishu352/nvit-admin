"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  Building2,
  Building,
  FolderTree,
  MapPin,
  Package,
  Percent,
  FileSpreadsheet,
  Users,
  UploadCloud,
  History,
  Download,
  Save,
  FileText,
  GitPullRequest,
  UserCheck,
  UserSquare2,
  CheckSquare,
  CalendarClock,
  Globe,
  Settings2,
  Layout,
  Info,
  Briefcase,
  MessageSquare,
  HelpCircle,
  Phone,
  AlignJustify,
  Palette,
  Search,
  Megaphone,
  Target,
  BarChart3,
  Tag,
  Eye,
  Activity,
  Compass,
  Share2,
  Shield,
  User,
  Key,
  FileSearch,
  ShieldAlert,
  Monitor,
  KeyRound,
  Settings,
  Mail,
  MessageCircle,
  HardDrive,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

interface SidebarSection {
  title: string;
  id: string;
  icon: any;
  items: SidebarItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    master: false,
    data: false,
    crm: false,
    cms: false,
    marketing: false,
    security: false,
    system: false,
  });

  const sections: SidebarSection[] = [
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
      ],
    },
    {
      title: "CRM",
      id: "crm",
      icon: UserSquare2,
      items: [
        { name: "Lead Management", href: "/crm/leads", icon: GitPullRequest },
        { name: "Customer Management", href: "/crm/customers", icon: UserCheck },
        { name: "Executives", href: "/executives", icon: UserSquare2 },
      ],
    },
    {
      title: "WEBSITE CMS",
      id: "cms",
      icon: Globe,
      items: [
        { name: "CMS Live Config", href: "/cms", icon: Layout },
      ],
    },
    {
      title: "MARKETING",
      id: "marketing",
      icon: Megaphone,
      items: [
        { name: "Marketing Integrations", href: "/marketing", icon: Target },
      ],
    },
    {
      title: "USERS & SECURITY",
      id: "security",
      icon: Shield,
      items: [
        { name: "Security Users", href: "/security/users", icon: User },
        { name: "Compliance Audit Logs", href: "/audit-logs", icon: ShieldAlert },
      ],
    },
  ];

  // Dynamically filter sections based on role
  const visibleSections = useMemo(() => {
    return sections
      .filter((sec) => {
        if (!user) return false;
        if (user.role === "EXECUTIVE") {
          return sec.id === "crm";
        }
        if (user.role === "VIEWER") {
          return sec.id === "master" || sec.id === "crm";
        }
        if (user.role === "MANAGER") {
          return sec.id === "master" || sec.id === "data" || sec.id === "crm";
        }
        return true;
      })
      .map((sec) => {
        let items = [...sec.items];
        // Hide Executives list from EXECUTIVE & VIEWER roles
        if (user?.role === "EXECUTIVE" || user?.role === "VIEWER") {
          items = items.filter((item) => item.href !== "/executives");
        }
        return { ...sec, items };
      });
  }, [user]);

  // Helper component for Master Management icon to prevent variable naming conflicts
  function DatabaseIcon(props: any) {
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

  // Auto-expand active section on load
  useEffect(() => {
    const activeSection = visibleSections.find((sec) =>
      sec.items.some((item) => pathname.startsWith(item.href))
    );
    if (activeSection) {
      setExpandedSections((prev) => {
        if (prev[activeSection.id]) return prev; // Avoid redundant updates
        return { ...prev, [activeSection.id]: true };
      });
    }
  }, [pathname, visibleSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between h-screen border-r border-slate-900 shrink-0 sticky top-0 overflow-y-auto">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-900 flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-black text-white text-md tracking-tight">NVIT SOLUTION</h2>
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-extrabold block">
              Enterprise Admin
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-4 rounded-2xl bg-slate-900/50 border border-slate-900 flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
            {user?.name ? user.name.charAt(0) : "A"}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-white truncate">{user?.name || "Admin User"}</h4>
            <span className="text-[9px] text-slate-400 font-semibold uppercase">{user?.role || "SUPER_ADMIN"}</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-6">
          {/* Main Dashboard Link */}
          <Link
            href="/dashboard"
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              pathname === "/dashboard"
                ? "bg-royal text-white shadow-md shadow-royal/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {/* Section list */}
          {visibleSections.map((section) => {
            const SectionIcon = section.icon;
            const expanded = expandedSections[section.id];
            const isSubitemActive = section.items.some((item) => pathname === item.href);

            return (
              <div key={section.id} className="space-y-0.5 pt-1">
                {/* Header button */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                    isSubitemActive
                      ? "text-blue-400 bg-slate-900/20"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <SectionIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{section.title}</span>
                  </div>
                  {expanded ? (
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  )}
                </button>

                {/* Sub items collapsible list */}
                {expanded && (
                  <div className="pl-3 space-y-0.5 border-l border-slate-900 ml-5 my-0.5 animate-slow-fade">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                            active
                              ? "text-blue-400 bg-slate-900 font-bold border-r-2 border-blue-500"
                              : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                          }`}
                        >
                          <ItemIcon className="w-3.5 h-3.5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer logout button */}
      <div className="p-4 border-t border-slate-900 shrink-0">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-900 hover:border-rose-950 text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
