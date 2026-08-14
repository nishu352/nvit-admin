"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/apiClient";
import { useCrmLeadsQuery, ADMIN_QUERY_KEYS } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Plus,
  Filter,
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
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const CRM_STAGES = [
  { id: "FRESH", title: "Fresh Inquiry", color: "border-blue-500 text-blue-400 bg-blue-500/10" },
  { id: "ASSIGNED", title: "Assigned", color: "border-slate-500 text-slate-400 bg-slate-500/10" },
  { id: "CONTACTED", title: "Contacted", color: "border-purple-500 text-purple-400 bg-purple-500/10" },
  { id: "INTERESTED", title: "Interested", color: "border-indigo-500 text-indigo-400 bg-indigo-500/10" },
  { id: "DOCUMENTS_PENDING", title: "Docs Pending", color: "border-cyan-500 text-cyan-400 bg-cyan-500/10" },
  { id: "BANK_SUBMITTED", title: "Submitted to Bank", color: "border-amber-500 text-amber-400 bg-amber-500/10" },
  { id: "APPROVED", title: "Approved", color: "border-emerald-500 text-emerald-400 bg-emerald-500/10" },
  { id: "REJECTED", title: "Rejected", color: "border-rose-500 text-rose-400 bg-rose-500/10" },
  { id: "DISBURSED", title: "Disbursed", color: "border-teal-500 text-teal-400 bg-teal-500/10" },
  { id: "LOST", title: "Lost", color: "border-slate-700 text-slate-500 bg-slate-900" },
];

export default function AdminCRMLeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [statusUpdateRemark, setStatusUpdateRemark] = useState("");

  const { data: leads = [], isLoading: loading, refetch: fetchLeads } = useCrmLeadsQuery(search || undefined);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await apiClient.put(`/crm/leads/${leadId}/status`, {
        status: newStatus,
        remarks: statusUpdateRemark || `Moved to ${newStatus}`,
      });
      setStatusUpdateRemark("");
      fetchLeads();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLead) return;

    try {
      const res = await apiClient.post(`/crm/leads/${selectedLead.id}/notes`, { note: newNote });
      if (res.data.success) {
        setNewNote("");
        fetchLeads();
        setSelectedLead(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">CRM Lead Management Board</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">Track applicant inquiries, update underwriting statuses, and record notes</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applicant name, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex space-x-4 overflow-x-auto pb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 shrink-0 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 space-y-3 animate-pulse">
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-800 rounded" />
              <div className="h-28 w-full bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-28 w-full bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex space-x-4 overflow-x-auto pb-6">
          {CRM_STAGES.map((stage) => {
            const stageLeads = leads.filter((l: any) => l.status === stage.id);
            return (
              <div key={stage.id} className="w-72 shrink-0 flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-850 p-4 space-y-3">
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.color.split(" ")[0].replace("border-", "bg-")}`} />
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">{stage.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850 shadow-xs">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="py-12 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 border border-dashed border-slate-300 dark:border-slate-850 rounded-xl">
                      No leads in stage
                    </div>
                  ) : (
                    stageLeads.map((lead: any) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="p-4 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer space-y-3 group shadow-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-xs leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {lead.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold mt-1">{lead.company}</p>
                          </div>
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                            ₹{(lead.loanAmount/100000)}L
                          </span>
                        </div>

                        <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-450 font-semibold border-t border-slate-100 dark:border-slate-900 pt-2">
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-slate-400 dark:text-slate-550 shrink-0" />
                            <span className="font-mono">{lead.mobile}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3 h-3 text-slate-400 dark:text-slate-550 shrink-0" />
                            <span>{lead.loanType} • ₹{(lead.monthlyIncome/1000)}k/mo</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 dark:text-slate-550 border-t border-slate-100 dark:border-slate-900/60 pt-2">
                          <span>{formatDate(lead.createdAt)}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail & Timeline Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 w-full max-w-xl h-full p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">APPLICANT DOSSIER</span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedLead.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-xs font-black text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Loan Amount Requested</span>
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹{selectedLead.loanAmount.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Monthly Income</span>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">₹{selectedLead.monthlyIncome.toLocaleString("en-IN")}</div>
                  </div>
                </div>

                {/* Applicant Info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-900 pb-1.5">
                    <span className="text-slate-500">Mobile Number:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{selectedLead.mobile}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-900 pb-1.5">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="text-slate-900 dark:text-white">{selectedLead.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-900 pb-1.5">
                    <span className="text-slate-500">Company:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{selectedLead.company}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-900 pb-1.5">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-900 dark:text-white">{selectedLead.city}, {selectedLead.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Product Type:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{selectedLead.loanType}</span>
                  </div>
                </div>

                {/* Stage Transition Select */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Update Pipeline Stage *</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      {CRM_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Internal Notes Section */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-850">
                  <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Internal Notes &amp; Remarks</span>
                  </h3>

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type internal remark..."
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white text-xs font-semibold rounded-xl focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Notes list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(() => {
                      const notesArr = typeof selectedLead.internalNotes === "string"
                        ? JSON.parse(selectedLead.internalNotes)
                        : (Array.isArray(selectedLead.internalNotes) ? selectedLead.internalNotes : []);
                      if (notesArr.length === 0) return <p className="text-[10px] text-slate-400 italic">No notes logged yet.</p>;
                      return notesArr.map((n: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 space-y-1 text-xs font-medium">
                          <p className="text-slate-800 dark:text-slate-200">{n.note}</p>
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>{n.createdBy || "Admin"}</span>
                            <span>{new Date(n.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
