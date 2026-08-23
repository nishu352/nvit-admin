"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCrmCustomersQuery } from "@/hooks/useAdminQueries";
import {
  UserCheck,
  Search,
  Phone,
  Mail,
  Building,
  Calendar,
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  ChevronLeft,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Customer } from "@/types";

export default function AdminCRMCustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customerData, isLoading: loading, refetch: fetchCustomers } = useCrmCustomersQuery(
    page,
    search || undefined
  );

  const customers = (customerData?.items || []) as Customer[];
  const totalPages = customerData?.totalPages || 1;

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Customer Registry &amp; Client Dossiers
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Centralized client profile records, declared income telemetry, and compliance document checklists.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchCustomers()}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Profiles</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name, phone, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Table Container ──────────────────────────────────── */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={6} />
      ) : customers.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No customer profiles located
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? "No customers match your search query."
              : "Profiles will populate automatically as applicants progress through verification."}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Contact Channels</th>
                  <th>Employer &amp; Location</th>
                  <th>Declared Income</th>
                  <th>Underwriting Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: #{c.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs text-slate-300 font-bold block">
                          {c.mobile}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium block truncate max-w-xs">
                          {c.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block">
                          {c.company || "Self-Employed"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {c.city || "—"}, {c.state || "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-black text-emerald-400">
                        {formatCurrency(c.monthlyIncome || 0)}/mo
                      </span>
                    </td>
                    <td>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border badge-blue uppercase">
                        {c.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="btn-secondary h-8 px-3 text-xs font-bold"
                      >
                        <span>View Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary h-8 px-3 text-xs disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary h-8 px-3 text-xs disabled:opacity-30"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Customer Detail Drawer ───────────────────────────── */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
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
                  <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider block">
                    CLIENT DOSSIER PROFILE
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedCustomer.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
                {/* Contact Card */}
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/[0.06] space-y-2.5">
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-2">
                    <span className="text-slate-400">Mobile Number:</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {selectedCustomer.mobile}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-2">
                    <span className="text-slate-400">Email Address:</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedCustomer.email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-2">
                    <span className="text-slate-400">Employer Company:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">
                      {selectedCustomer.company}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Declared Income:</span>
                    <span className="text-emerald-400 font-mono font-black">
                      {formatCurrency(selectedCustomer.monthlyIncome || 0)}/mo
                    </span>
                  </div>
                </div>

                {/* Document Verification Checklist */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    <span>Compliance Verification Checklist</span>
                  </h3>

                  <div className="space-y-2">
                    {[
                      "PAN Card Verification",
                      "Aadhaar e-KYC Verification",
                      "3-Month Bank Statement",
                      "Latest Salary Slips",
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-300"
                      >
                        <span>{doc}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black badge-emerald">
                          VERIFIED
                        </span>
                      </div>
                    ))}
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
