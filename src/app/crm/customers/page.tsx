"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";

export default function AdminCRMCustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customerData, isLoading: loading } = useCrmCustomersQuery(page, search || undefined);
  const customers = customerData?.items || [];
  const totalPages = customerData?.totalPages || 1;

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Customer Database Profiles</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">Centralized client repository, document compliance checklists, and historical inquiries</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search customer name, phone, email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none shadow-xs"
        />
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} columns={6} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-350 text-[10px] uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6">Customer Name</th>
                  <th className="py-4 px-6">Contact Channels</th>
                  <th className="py-4 px-6">Company / Employer</th>
                  <th className="py-4 px-6">Monthly Salary</th>
                  <th className="py-4 px-6">Latest Status</th>
                  <th className="py-4 px-6 text-right">Profile Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-bold text-slate-700 dark:text-slate-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No customer records located.
                    </td>
                  </tr>
                ) : (
                  customers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="py-4.5 px-6 font-black text-slate-900 dark:text-white">{c.name}</td>
                      <td className="py-4.5 px-6">
                        <div className="text-slate-800 dark:text-slate-300 font-mono text-[11px]">{c.mobile}</div>
                        <div className="text-[9px] text-slate-500 font-extrabold">{c.email}</div>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="font-extrabold text-slate-900 dark:text-white">{c.company}</div>
                        <div className="text-[9px] text-slate-500 font-mono uppercase">{c.city}, {c.state}</div>
                      </td>
                      <td className="py-4.5 px-6 font-mono text-emerald-600 dark:text-emerald-400 font-black">
                        ₹{c.monthlyIncome.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="px-2.5 py-0.5 rounded text-[9px] font-black border bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-extrabold transition-colors cursor-pointer"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-850 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Drawer */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 w-full max-w-xl h-full p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">CLIENT DOSSIER PROFILE</span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedCustomer.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs font-black text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-900 pb-1.5">
                    <span className="text-slate-500">Mobile Number:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{selectedCustomer.mobile}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-900 pb-1.5">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="text-slate-900 dark:text-white">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-900 pb-1.5">
                    <span className="text-slate-500">Employer Company:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{selectedCustomer.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Declared Income:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">₹{selectedCustomer.monthlyIncome.toLocaleString("en-IN")}/mo</span>
                  </div>
                </div>

                {/* Document Checklist */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Document Checklist Verification</span>
                  </h3>

                  <div className="space-y-2">
                    {["PAN Card Verification", "Aadhaar e-KYC Verification", "3-Month Bank Statement", "Latest Salary Slips"].map((doc, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{doc}</span>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
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
    </main>
  );
}
