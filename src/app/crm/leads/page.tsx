"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { useCrmLeadsQuery } from "@/hooks/useAdminQueries";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  DollarSign,
  Clock,
  Send,
  UserCheck,
  FileText,
  MessageSquare,
  ChevronRight,
  X,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import type { Lead } from "@/types";

const CRM_STAGES = [
  { id: "FRESH", title: "Fresh Inquiry", badgeClass: "badge-blue" },
  { id: "ASSIGNED", title: "Assigned", badgeClass: "badge-indigo" },
  { id: "CONTACTED", title: "Contacted", badgeClass: "badge-purple" },
  { id: "INTERESTED", title: "Interested", badgeClass: "badge-blue" },
  { id: "DOCUMENTS_PENDING", title: "Docs Pending", badgeClass: "badge-amber" },
  { id: "BANK_SUBMITTED", title: "Bank Submitted", badgeClass: "badge-amber" },
  { id: "APPROVED", title: "Approved", badgeClass: "badge-emerald" },
  { id: "REJECTED", title: "Rejected", badgeClass: "badge-rose" },
  { id: "DISBURSED", title: "Disbursed", badgeClass: "badge-emerald" },
  { id: "LOST", title: "Lost", badgeClass: "badge-rose" },
];

export default function AdminCRMLeadsPage() {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [statusUpdateRemark, setStatusUpdateRemark] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { showToast } = useToast();

  const { data: leadsData = [], isLoading: loading, refetch: fetchLeads } = useCrmLeadsQuery(
    search || undefined
  );

  const leads = leadsData as Lead[];

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await apiClient.put(`/crm/leads/${leadId}/status`, {
        status: newStatus,
        remarks: statusUpdateRemark || `Stage moved to ${newStatus}`,
      });
      setStatusUpdateRemark("");
      showToast({ title: `Lead status updated to ${newStatus}`, type: "success" });
      fetchLeads();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update lead status";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLead) return;
    setIsAddingNote(true);

    try {
      const res = await apiClient.post(`/crm/leads/${selectedLead.id}/notes`, { note: newNote.trim() });
      if (res.data.success) {
        setNewNote("");
        showToast({ title: "Note added to applicant timeline", type: "success" });
        fetchLeads();
        setSelectedLead(res.data.data);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to add note";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div className="space-y-7 flex flex-col h-[calc(100vh-8rem)]">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08] shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              CRM Lead Pipeline
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Applicant inquiry stages, underwriting telemetry, borrower notes, and bank conversion funnel.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search applicant name, mobile, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={() => fetchLeads()}
            className="btn-secondary h-9 px-3.5 text-xs font-bold shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── Kanban Board Horizontal Container ────────────────── */}
      <div className="flex-1 min-h-0 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1700px] h-full">
          {CRM_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.id);
            return (
              <div
                key={stage.id}
                className="w-72 flex flex-col rounded-2xl bg-slate-100/70 dark:bg-[#070e22] border border-slate-200 dark:border-white/[0.06] overflow-hidden"
              >
                {/* Stage Header */}
                <div className="p-3.5 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between bg-white dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {stage.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/[0.06] text-slate-400 font-mono">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Stage Card List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-500 font-medium">
                      No applicants in this stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                          selectedLead?.id === lead.id
                            ? "bg-purple-500/10 border-purple-500 shadow-md"
                            : "bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:border-purple-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {lead.name}
                          </h4>
                          <span className="text-[10px] font-bold text-emerald-400 font-mono shrink-0">
                            {formatCurrency(lead.loanAmount || 0)}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-400 font-medium">
                          {lead.companyName && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Building className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{lead.companyName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="font-mono">{lead.mobile}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{lead.loanType || "Personal Loan"}</span>
                          <span className="font-mono">{formatDate(lead.createdAt)}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Lead Detail Slideover Drawer ─────────────────────── */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-[#060c1c] border-l border-slate-200 dark:border-white/[0.08] h-full shadow-2xl flex flex-col p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedLead.name}
                  </h3>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    Lead ID: #{selectedLead.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Mobile Number
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {selectedLead.mobile}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Email Address
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white text-xs truncate block">
                      {selectedLead.email || "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Requested Loan
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-xs">
                      {formatCurrency(selectedLead.loanAmount || 0)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Monthly Salary
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                      {formatCurrency(selectedLead.monthlySalary || 0)}
                    </span>
                  </div>
                </div>

                {/* Company Details */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Employer &amp; Location
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-white">
                    {selectedLead.companyName || "Self-Employed / Unlisted"}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    City: {selectedLead.city || "—"} • Pincode: {selectedLead.pincode || "—"}
                  </p>
                </div>

                {/* Status Changer */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="text-xs font-bold text-slate-300">
                    Move Applicant Stage
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedLead.status}
                      disabled={isUpdatingStatus}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                      className="px-3 py-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
                    >
                      {CRM_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={statusUpdateRemark}
                      onChange={(e) => setStatusUpdateRemark(e.target.value)}
                      placeholder="Status change remarks..."
                      className="px-3 py-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes Thread */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Applicant Notes &amp; Follow-ups
                  </h4>

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add follow-up notes..."
                      className="flex-1 px-3.5 py-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newNote.trim() || isAddingNote}
                      className="btn-primary h-9 px-4 text-xs font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(!selectedLead.notes || selectedLead.notes.length === 0) ? (
                      <p className="text-slate-500 py-4 text-center text-xs">
                        No activity notes recorded yet.
                      </p>
                    ) : (
                      selectedLead.notes.map((n: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] space-y-1"
                        >
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>{n.authorName || "Staff"}</span>
                            <span>{formatDate(n.createdAt)}</span>
                          </div>
                          <p className="text-slate-200 text-xs font-medium">{n.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
