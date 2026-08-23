"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import {
  MessageSquareText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  X,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Inbox,
  Send,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDate } from "@/lib/utils";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface FeedbackTicket {
  id: string;
  ticketNumber: string;
  type: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  priority: string;
  adminNotes?: string | null;
  resolvedAt?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeedbackPage() {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("ALL");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackTicket | null>(null);
  const { showToast } = useToast();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        apiClient.get("/admin/feedback", {
          params: {
            type: activeType !== "ALL" ? activeType : undefined,
            status: activeStatus !== "ALL" ? activeStatus : undefined,
            search: searchQuery.trim() || undefined,
            limit: 100,
          },
        }),
        apiClient.get("/admin/feedback/stats"),
      ]);

      if (listRes.data?.success) {
        setTickets(listRes.data.data || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data || null);
      }
    } catch (err) {
      console.error("Failed to load feedback tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeType, activeStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await apiClient.patch(`/admin/feedback/${id}`, {
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
      });
      if (res.data?.success) {
        if (selectedTicket && selectedTicket.id === id) {
          setSelectedTicket(res.data.data);
        }
        showToast({ title: `Ticket #${selectedTicket?.ticketNumber || id} updated`, type: "success" });
        fetchTickets();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update ticket";
      showToast({ title: msg, type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/admin/feedback/${deleteTarget.id}`);
      showToast({ title: "Feedback ticket removed", type: "success" });
      if (selectedTicket?.id === deleteTarget.id) setSelectedTicket(null);
      setDeleteTarget(null);
      fetchTickets();
    } catch {
      showToast({ title: "Delete failed", type: "error" });
    }
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <MessageSquareText className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Feedback &amp; Grievance Desk
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            User inquiries, platform feedback, borrower grievances, and resolution telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchTickets}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Tickets</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-kpi-card p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Tickets</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats.total || 0}
            </span>
          </div>
          <div className="stat-kpi-card p-4 border-blue-500/30 bg-blue-500/5">
            <span className="text-[10px] uppercase font-bold text-blue-400">Open Tickets</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">
              {stats.byStatus?.OPEN || 0}
            </span>
          </div>
          <div className="stat-kpi-card p-4 border-amber-500/30 bg-amber-500/5">
            <span className="text-[10px] uppercase font-bold text-amber-400">In Progress</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {stats.byStatus?.IN_PROGRESS || 0}
            </span>
          </div>
          <div className="stat-kpi-card p-4 border-emerald-500/30 bg-emerald-500/5">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Resolved</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {stats.byStatus?.RESOLVED || 0}
            </span>
          </div>
        </div>
      )}

      {/* ── Filters & Search ─────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket #, name, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeStatus === st
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {st === "ALL" ? "All Statuses" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tickets List ─────────────────────────────────────── */}
      {loading ? (
        <AdminCardGridSkeleton count={6} />
      ) : tickets.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <Inbox className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No feedback tickets found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? "No tickets match your search criteria."
              : "User grievances and inquiries submitted through the portal will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((t) => (
            <motion.div
              key={t.id}
              onClick={() => {
                setSelectedTicket(t);
                setAdminNotes(t.adminNotes || "");
              }}
              className={`glass-card p-5 rounded-2xl space-y-3 cursor-pointer transition-all ${
                selectedTicket?.id === t.id
                  ? "border-purple-500 bg-purple-500/5 shadow-md"
                  : "hover:border-purple-500/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-purple-400 block mb-0.5">
                    #{t.ticketNumber || t.id.slice(-6).toUpperCase()}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                    {t.subject}
                  </h3>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                    t.status === "RESOLVED"
                      ? "badge-emerald"
                      : t.status === "IN_PROGRESS"
                      ? "badge-amber"
                      : "badge-blue"
                  }`}
                >
                  {t.status.replace("_", " ")}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium line-clamp-2">{t.message}</p>

              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold">{t.name}</span>
                <span className="font-mono">{formatDate(t.createdAt)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Ticket Detail Slideover Drawer ───────────────────── */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-[#060c1c] border-l border-slate-200 dark:border-white/[0.08] h-full shadow-2xl flex flex-col p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-purple-400 block mb-0.5">
                    Ticket #{selectedTicket.ticketNumber || selectedTicket.id.slice(-6).toUpperCase()}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
                {/* Contact Channel Details */}
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/[0.06] space-y-2">
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                    <span className="text-slate-400">User Name:</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {selectedTicket.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                    <span className="text-slate-400">Email Address:</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedTicket.email}
                    </span>
                  </div>
                  {selectedTicket.phone && (
                    <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                      <span className="text-slate-400">Phone Number:</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {selectedTicket.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category Type:</span>
                    <span className="font-bold text-purple-400">{selectedTicket.type}</span>
                  </div>
                </div>

                {/* User Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Message Description:
                  </label>
                  <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/[0.06] text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Status & Resolution Controls */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="text-xs font-bold text-slate-300">
                    Resolution Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedTicket.status === st
                            ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                            : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 hover:text-white"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Staff Response Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Internal Staff Notes
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Document resolution steps, customer callback details..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-medium focus:outline-none resize-none"
                  />
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, selectedTicket.status)}
                    disabled={updating}
                    className="btn-primary h-9 px-4 text-xs font-bold w-full"
                  >
                    <span>Save Internal Notes</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex justify-between">
                <button
                  onClick={() => setDeleteTarget(selectedTicket)}
                  className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Ticket</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ───────────────────────── */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteTicket}
          title="Delete Feedback Ticket?"
          description={`Are you sure you want to permanently remove ticket #${deleteTarget.ticketNumber}?`}
          confirmLabel="Delete Ticket"
        />
      )}
    </div>
  );
}
