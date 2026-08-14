"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Activity, User, ShieldAlert, CheckCircle, Building2, Building, MapPin, FileCheck, Users, X, Menu } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/services/apiClient";
import { useHealthQuery, useRecentAlerts } from "@/hooks/useAdminQueries";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  // Cached Queries
  const { data: healthData, isError: isHealthError, isLoading: isHealthLoading } = useHealthQuery();
  const { data: notifications = [] } = useRecentAlerts();

  // Command Palette State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    banks: any[];
    companies: any[];
    pincodes: any[];
    policies: any[];
    leads: any[];
  }>({ banks: [], companies: [], pincodes: [], policies: [], leads: [] });
  const [searching, setSearching] = useState(false);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Perform live multi-entity search when query changes (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults({ banks: [], companies: [], pincodes: [], policies: [], leads: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [banksRes, cosRes, pinsRes, leadsRes] = await Promise.all([
          apiClient.get(`/admin/banks`),
          apiClient.get(`/admin/companies?limit=5&query=${encodeURIComponent(query)}`),
          apiClient.get(`/admin/pincodes?limit=5&query=${encodeURIComponent(query)}`),
          apiClient.get(`/crm/leads?query=${encodeURIComponent(query)}`),
        ]);

        const filteredBanks = (banksRes.data.data || []).filter(
          (b: any) =>
            b.name.toLowerCase().includes(query.toLowerCase()) ||
            b.code.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults({
          banks: filteredBanks.slice(0, 4),
          companies: cosRes.data.data?.items || [],
          pincodes: pinsRes.data.data?.items || [],
          policies: [],
          leads: (leadsRes.data.data || []).slice(0, 4),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

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
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-900 px-4 sm:px-8 h-16 flex items-center justify-between shrink-0 gap-3">
        {/* Left: Mobile Hamburger & Search Bar */}
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden w-9 h-9 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search (⌘ K)..."
              readOnly
              onClick={() => setShowSearchModal(true)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 bg-slate-950/50 hover:bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-xl text-xs font-semibold text-slate-350 placeholder-slate-600 cursor-pointer focus:outline-none transition-colors"
            />
            <div className="hidden sm:flex absolute right-3.5 top-1/2 -translate-y-1/2 items-center space-x-0.5 text-[9px] text-slate-500 font-extrabold border border-slate-850 bg-slate-900/60 px-1.5 py-0.5 rounded">
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 sm:space-x-6 shrink-0">
          {/* Health Indicator */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-[11px] font-medium text-slate-400">Gateway:</span>
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
                className={`text-[11px] font-semibold ${
                  systemStatus === "ok"
                    ? "text-emerald-400"
                    : systemStatus === "error"
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {systemStatus === "ok"
                  ? "Operational"
                  : systemStatus === "error"
                  ? "Offline"
                  : "Checking"}
              </span>
            </div>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors relative"
              aria-label="View system notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-850 rounded-2xl p-4 shadow-2xl space-y-3 z-50 animate-slow-fade">
                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-xs font-bold text-white">System Activity Logs</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    {notifications.length} LOGS
                  </span>
                </div>
                <div className="divide-y divide-slate-850 text-[10px] font-bold text-slate-300">
                  {notifications.map((note: any) => (
                    <div key={note.id} className="py-2.5 flex items-start space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate font-bold">{note.action}</p>
                        <p className="text-slate-400 text-[9px] truncate font-medium">{note.userEmail || "System"}</p>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-500 font-normal">No recent alerts</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2 sm:border-l sm:border-slate-900 sm:pl-6 h-8">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              {user?.name ? user.name.charAt(0) : "A"}
            </div>
            <div className="hidden md:block text-left truncate max-w-28">
              <p className="text-xs font-bold text-white truncate leading-none mb-0.5">{user?.name || "Admin"}</p>
              <span className="text-[9px] text-slate-500 font-semibold uppercase leading-none">{user?.role || "SUPER_ADMIN"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Cmd + K Command Palette Overlay */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-800 space-y-4 text-slate-100"
            >
              {/* Search Header */}
              <div className="relative flex items-center border-b border-slate-800 pb-4">
                <Search className="w-5 h-5 text-blue-400 absolute left-2" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search lenders, companies, pincodes, leads..."
                  className="w-full bg-transparent pl-10 pr-10 text-white text-sm font-semibold placeholder-slate-500 focus:outline-none"
                />
                {query ? (
                  <button onClick={() => setQuery("")} className="absolute right-2 text-slate-500 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => setShowSearchModal(false)} className="absolute right-2 text-[10px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 hover:text-white cursor-pointer">
                    ESC
                  </button>
                )}
              </div>

              {/* Search Results Display */}
              <div className="max-h-96 overflow-y-auto space-y-4 pr-1 text-xs">
                {searching ? (
                  <div className="py-12 text-center text-slate-400 font-semibold flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400 animate-spin" />
                    <span>Searching system records...</span>
                  </div>
                ) : query && !searchResults.banks.length && !searchResults.companies.length && !searchResults.pincodes.length && !searchResults.leads.length ? (
                  <div className="py-12 text-center text-slate-500 font-semibold">
                    No matching records found across system
                  </div>
                ) : (
                  <>
                    {/* Banks Section */}
                    {searchResults.banks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Banks & NBFCs</span>
                        {searchResults.banks.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => navigateTo("/banks")}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-royal/10 border border-slate-850 hover:border-royal/30 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <Building2 className="w-4 h-4 text-blue-400" />
                              <span className="font-bold text-white">{b.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({b.code})</span>
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">{b.type}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Companies Section */}
                    {searchResults.companies.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Companies</span>
                        {searchResults.companies.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => navigateTo("/companies")}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-royal/10 border border-slate-850 hover:border-royal/30 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <Building className="w-4 h-4 text-emerald-400" />
                              <span className="font-bold text-white">{c.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{c.cin || "NO CIN"}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pincodes Section */}
                    {searchResults.pincodes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pincodes</span>
                        {searchResults.pincodes.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => navigateTo("/pincodes")}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-royal/10 border border-slate-850 hover:border-royal/30 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <MapPin className="w-4 h-4 text-amber-400" />
                              <span className="font-bold text-white font-mono">{p.pincode}</span>
                              <span className="text-slate-400 font-semibold">{p.city}, {p.state}</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold">{p.isServiceable ? "Serviceable" : "Unserviceable"}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CRM Leads Section */}
                    {searchResults.leads.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CRM Leads</span>
                        {searchResults.leads.map((l) => (
                          <div
                            key={l.id}
                            onClick={() => navigateTo("/crm/leads")}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-royal/10 border border-slate-850 hover:border-royal/30 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <Users className="w-4 h-4 text-purple-400" />
                              <span className="font-bold text-white">{l.name}</span>
                              <span className="text-slate-400 text-[10px] font-mono">({l.mobile})</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">{l.status}</span>
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
