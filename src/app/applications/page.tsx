"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useApplicationsQuery } from "@/hooks/useAdminQueries";
import {
  FileCheck,
  RefreshCw,
  Search,
  Phone,
  Mail,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  Filter,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface ApplicationItem {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  company?: string;
  monthlyIncome?: number;
  loanType?: string;
  loanAmount?: number;
  city?: string;
  state?: string;
  createdAt: string;
}

export default function AdminApplicationsPage() {
  const [search, setSearch] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("ALL");

  const { data: applications = [], isLoading: loading, refetch: fetchApplications } =
    useApplicationsQuery();

  const filteredApps = useMemo(() => {
    return (applications as ApplicationItem[]).filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.mobile.includes(search) ||
        (app.email && app.email.toLowerCase().includes(search.toLowerCase())) ||
        (app.company && app.company.toLowerCase().includes(search.toLowerCase()));
      const matchesType = loanTypeFilter === "ALL" || app.loanType === loanTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [applications, search, loanTypeFilter]);

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Loan Application Submissions
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Direct online borrower inquiries, income parameters, and product preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchApplications()}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Applications</span>
          </button>
          <Link href="/crm/leads" className="btn-primary h-10 px-4 text-xs">
            <span>CRM Pipeline</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applicant name, phone, email, employer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing {filteredApps.length} Applications
        </span>
      </div>

      {/* ── Table Container ──────────────────────────────────── */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={6} />
      ) : filteredApps.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <FileCheck className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No application submissions located
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? "No applications match your search query."
              : "Borrower inquiries submitted via the portal will appear here in real-time."}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Contact Info</th>
                  <th>Employer &amp; Salary</th>
                  <th>Loan Type &amp; Amount</th>
                  <th>Location</th>
                  <th className="text-right">Submission Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                          {app.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: #{app.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs text-slate-300 font-bold block">
                          {app.mobile}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium block truncate max-w-xs">
                          {app.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block truncate max-w-xs">
                          {app.company || "Self-Employed"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Income: {formatCurrency(app.monthlyIncome || 0)}/mo
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-blue">
                          {app.loanType || "Personal Loan"}
                        </span>
                        <span className="font-black text-emerald-400 font-mono text-xs block">
                          {formatCurrency(app.loanAmount || 0)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {app.city || "—"}, {app.state || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-mono text-xs text-slate-400">
                      {formatDate(app.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
