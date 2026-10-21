"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Activity,
  CheckCircle,
  Building2,
  Building,
  MapPin,
  Users,
  X,
  Menu,
  ChevronRight,
  Shield,
  FileCheck,
  Compass,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/services/apiClient";
import { useHealthQuery, useRecentAlerts } from "@/hooks/useAdminQueries";
import { motion, AnimatePresence } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import type { Bank, Company, Pincode, Lead } from "@/types";

import ThemeToggle from "@/components/ThemeToggle";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  // Cached Queries
  const { data: healthData, isError: isHealthError, isLoading: isHealthLoading } = useHealthQuery();
  const { data: notifications = [] } = useRecentAlerts();

  // Command Palette State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    banks: Bank[];
    companies: Company[];
    pincodes: Pincode[];
    leads: Lead[];
    feedback: any[];
    users: any[];
  }>({ banks: [], companies: [], pincodes: [], leads: [], feedback: [], users: [] });
  const [searching, setSearching] = useState(false);

  // Breadcrumbs calculation
  const pathSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " "));

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === "Escape" && showSearchModal) {
        setShowSearchModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearchModal]);

  // Perform live multi-entity search when query changes (debounced)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      const timer = setTimeout(() => {
        setSearchResults({ banks: [], companies: [], pincodes: [], leads: [], feedback: [], users: [] });
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [banksRes, cosRes, pinsRes, leadsRes, feedbackRes, usersRes] = await Promise.allSettled([
          apiClient.get(`/admin/banks`),
          apiClient.get(`/admin/companies?limit=5&query=${encodeURIComponent(trimmed)}`),
          apiClient.get(`/admin/pincodes?limit=5&query=${encodeURIComponent(trimmed)}`),
          apiClient.get(`/crm/leads?query=${encodeURIComponent(trimmed)}`),
          apiClient.get(`/admin/feedback?search=${encodeURIComponent(trimmed)}&limit=4`),
          apiClient.get(`/admin/users`),
        ]);

        const banksData = banksRes.status === "fulfilled" ? (banksRes.value.data?.data || []) : [];
        const cosData = cosRes.status === "fulfilled" ? (cosRes.value.data?.data?.items || []) : [];
        const pinsData = pinsRes.status === "fulfilled" ? (pinsRes.value.data?.data?.items || []) : [];
        const leadsData = leadsRes.status === "fulfilled" ? (leadsRes.value.data?.data || []) : [];
        const feedbackData = feedbackRes.status === "fulfilled" ? (feedbackRes.value.data?.data || []) : [];
        const usersData = usersRes.status === "fulfilled" ? (usersRes.value.data?.data || []) : [];

        const filteredBanks = (banksData as Bank[]).filter(
          (b) =>
            b.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            b.code.toLowerCase().includes(trimmed.toLowerCase())
        );

        const filteredUsers = (usersData as any[]).filter(
          (u) =>
            (u.name && u.name.toLowerCase().includes(trimmed.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(trimmed.toLowerCase()))
        );

        setSearchResults({
          banks: filteredBanks.slice(0, 4),
          companies: (cosData as Company[]).slice(0, 5),
          pincodes: (pinsData as Pincode[]).slice(0, 4),
          leads: (leadsData as Lead[]).slice(0, 4),
          feedback: (feedbackData as any[]).slice(0, 4),
          users: filteredUsers.slice(0, 4),
        });
      } catch (searchErr) {
        console.error(searchErr);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = (path: string) => {
    setShowSearchModal(false);
    setQuery("");
    router.push(path);
  };

  const systemStatus = isHealthError
    ? "error"
    : isHealthLoading
    ? "checking"
    : healthData?.status === "ok"
    ? "ok"
    : "error";

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-white/[0.08] px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between shrink-0 gap-2 sm:gap-3">
        {/* Left: Hamburger & Breadcrumbs */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 sm:flex-1 min-w-0">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
            <span className="text-slate-600 dark:text-slate-400 font-bold">Admin</span>
            {pathSegments.map((seg, i) => (
              <div key={i} className="flex items-center space-x-2">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                <span
                  className={
                    i === pathSegments.length - 1
                      ? "text-slate-900 dark:text-white font-bold"
                      : "text-slate-500"
                  }
                >
                  {seg}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center/Search trigger */}
        <div className="flex-1 max-w-xs sm:max-w-sm">
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-2 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-400 dark:text-slate-400 cursor-pointer transition-all min-h-[38px]"
            aria-label="Open search command palette"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium truncate">
                <span className="hidden sm:inline">Quick search...</span>
                <span className="sm:hidden">Search...</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] px-1.5 py-0.5 rounded-md shrink-0">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Live Gateway Status Pill */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-100/70 dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">API:</span>
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  systemStatus === "ok"
                    ? "bg-emerald-500"
                    : systemStatus === "error"
                    ? "bg-rose-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              />
              <span
                className={`text-[11px] font-bold ${
                  systemStatus === "ok"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : systemStatus === "error"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {systemStatus === "ok"
                  ? "Operational"
                  : systemStatus === "error"
                  ? "Offline"
                  : "Syncing"}
              </span>
            </div>
          </div>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Notifications Bell with Flyout */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:border-blue-500/40 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors relative"
              aria-label="View system notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#091024]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-[#091024] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 shadow-2xl space-y-3 z-50 animate-slow-fade">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Compliance Activity
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    {notifications.length} Logs
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/[0.04] text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-h-72 overflow-y-auto">
                  {notifications.map((note) => (
                    <div key={note.id} className="py-2.5 flex items-start space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 dark:text-white truncate font-bold text-xs">
                          {note.action}
                        </p>
                        <p className="text-slate-500 text-[10px] truncate font-medium">
                          {note.userEmail || "System Engine"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-500 font-normal">
                      No recent alerts
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Mini */}
          <div className="flex items-center space-x-2.5 sm:border-l sm:border-slate-200 sm:dark:border-white/[0.08] sm:pl-3 h-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20 shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="hidden xl:block text-left truncate max-w-28">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-none mb-0.5">
                {user?.name || "Admin"}
              </p>
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider leading-none">
                {user?.role?.replace("_", " ") || "SUPER ADMIN"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Cmd + K Command Palette Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-start justify-center p-2.5 sm:p-4 pt-4 sm:pt-20">
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-[#091024] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-white/[0.1] flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100"
            >
              {/* Search Input */}
              <div className="relative flex items-center border-b border-slate-200 dark:border-white/[0.08] pb-3 sm:pb-4 shrink-0">
                <Search className="w-5 h-5 text-blue-500 absolute left-2" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search lenders, companies, pincodes, leads, feedback..."
                  className="w-full bg-transparent pl-10 pr-10 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
                {query ? (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 p-1 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Clear search input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSearchModal(false)}
                    className="absolute right-2 text-[10px] text-slate-500 border border-slate-300 dark:border-white/[0.1] rounded-md px-2 py-0.5 hover:text-white cursor-pointer"
                    aria-label="Close search modal"
                  >
                    ESC
                  </button>
                )}
              </div>

              {/* Search Results Display */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs max-h-[62vh] sm:max-h-96 my-2">
                {searching ? (
                  <div className="py-12 text-center text-slate-400 font-semibold flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500 animate-spin" />
                    <span>Searching multi-entity records...</span>
                  </div>
                ) : query &&
                  !searchResults.banks.length &&
                  !searchResults.companies.length &&
                  !searchResults.pincodes.length &&
                  !searchResults.leads.length &&
                  !searchResults.feedback.length &&
                  !searchResults.users.length ? (
                  <div className="py-12 text-center text-slate-500 font-semibold">
                    No matching records found across system
                  </div>
                ) : (
                  <>
                    {/* Banks Section */}
                    {searchResults.banks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Banks &amp; NBFCs
                        </span>
                        {searchResults.banks.map((b) => (
                          <div
                            key={b.id}
                            onClick={() =>
                              navigateTo(`/banks?id=${encodeURIComponent(b.id)}&search=${encodeURIComponent(b.name)}`)
                            }
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-blue-50 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-white/[0.06] hover:border-blue-500/30 cursor-pointer transition-colors gap-2 min-h-[44px]"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {b.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                ({b.code})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold shrink-0">
                              {b.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Companies Section */}
                    {searchResults.companies.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Companies
                        </span>
                        {searchResults.companies.map((c) => (
                          <div
                            key={c.id}
                            onClick={() =>
                              navigateTo(
                                `/companies?id=${encodeURIComponent(c.id)}&search=${encodeURIComponent(c.name)}`
                              )
                            }
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-blue-50 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-white/[0.06] hover:border-blue-500/30 cursor-pointer transition-colors gap-2 min-h-[44px]"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {c.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {c.cin || "NO CIN"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pincodes Section */}
                    {searchResults.pincodes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Pincodes
                        </span>
                        {searchResults.pincodes.map((p) => (
                          <div
                            key={p.id}
                            onClick={() =>
                              navigateTo(
                                `/pincodes?id=${encodeURIComponent(p.id)}&search=${encodeURIComponent(p.pincode)}`
                              )
                            }
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-blue-50 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-white/[0.06] hover:border-blue-500/30 cursor-pointer transition-colors gap-2 min-h-[44px]"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white font-mono shrink-0">
                                {p.pincode}
                              </span>
                              <span className="text-slate-400 font-medium truncate">
                                {p.city}, {p.state}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                              {p.isServiceable ? "Serviceable" : "Unserviceable"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CRM Leads Section */}
                    {searchResults.leads.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          CRM Leads
                        </span>
                        {searchResults.leads.map((l) => (
                          <div
                            key={l.id}
                            onClick={() =>
                              navigateTo(
                                `/crm/leads?id=${encodeURIComponent(l.id)}&search=${encodeURIComponent(l.name)}`
                              )
                            }
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-blue-50 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-white/[0.06] hover:border-blue-500/30 cursor-pointer transition-colors gap-2 min-h-[44px]"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <Users className="w-4 h-4 text-purple-400 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {l.name}
                              </span>
                              <span className="text-slate-500 text-[10px] font-mono shrink-0">
                                ({l.mobile})
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase shrink-0">
                              {l.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Support Feedback Section */}
                    {searchResults.feedback.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Support &amp; Feedback Tickets
                        </span>
                        {searchResults.feedback.map((f) => (
                          <div
                            key={f.id}
                            onClick={() =>
                              navigateTo(
                                `/feedback?id=${encodeURIComponent(f.id)}&search=${encodeURIComponent(
                                  f.ticketNumber || f.subject
                                )}`
                              )
                            }
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-blue-50 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-white/[0.06] hover:border-blue-500/30 cursor-pointer transition-colors gap-2 min-h-[44px]"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {f.subject || f.ticketNumber}
                              </span>
                              <span className="text-slate-500 text-[10px] shrink-0">
                                ({f.name})
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase shrink-0">
                              {f.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Staff & Users Section */}
                    {searchResults.users.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Staff Accounts &amp; Executives
                        </span>
                        {searchResults.users.map((u) => (
                          <div
                            key={u.id}
                            onClick={() =>
                              navigateTo(
                                `/executives?id=${encodeURIComponent(u.id)}&search=${encodeURIComponent(
                                  u.name || u.email
                                )}`
                              )
                            }
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-blue-50 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-white/[0.06] hover:border-blue-500/30 cursor-pointer transition-colors gap-2 min-h-[44px]"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {u.name}
                              </span>
                              <span className="text-slate-500 text-[10px] truncate shrink-0">
                                ({u.email})
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase shrink-0">
                              {u.role?.replace("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
