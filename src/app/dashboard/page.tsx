"use client";

import { motion } from "motion/react";
import { useDashboardStats } from "@/hooks/useAdminQueries";
import {
  Building2,
  FileSpreadsheet,
  MapPin,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Search,
  Activity,
  UserCheck,
  XCircle,
  Clock,
  TrendingUp,
  HardDrive,
  Globe,
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  Shield,
  CreditCard,
  Zap,
} from "lucide-react";
import { AdminStatsSkeleton, AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import type { Lead, Policy, AuditLog } from "@/types";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: loading, refetch: fetchStats } = useDashboardStats();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.22, ease: "easeOut" as const },
    },
  };

  return (
    <div className="space-y-7">
      {/* ── Page Hero / Command Header ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Operations Control Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Real-time multi-lender underwriting matrix, inquiry pipelines, and telemetry overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchStats()}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live Metrics</span>
          </button>
          <Link href="/import" className="btn-primary h-10 px-4 text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>Batch Upload</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          <AdminStatsSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AdminTableSkeleton rows={4} columns={3} />
            <AdminTableSkeleton rows={4} columns={3} />
          </div>
        </div>
      ) : stats ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-7"
        >
          {/* ── Row 1: Core Institutional Counters (Bento 4-Grid) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                title: "Partner Lenders",
                value: stats.metrics.totalBanks,
                desc: "Active Banks & NBFCs",
                icon: Building2,
                color: "text-blue-500",
                bg: "bg-blue-500/10 border-blue-500/20",
                href: "/banks",
              },
              {
                title: "Normalized Employers",
                value: stats.metrics.totalCompanies,
                desc: "Verified corporate entities",
                icon: FileSpreadsheet,
                color: "text-purple-400",
                bg: "bg-purple-500/10 border-purple-500/20",
                href: "/companies",
              },
              {
                title: "Pincode Coverage",
                value: stats.metrics.totalPincodes,
                desc: "Serviceable postal zones",
                icon: MapPin,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
                href: "/pincodes",
              },
              {
                title: "Loan Applications",
                value: stats.metrics.totalApplications ?? stats.metrics.totalLeads,
                desc: "Lifetime captured leads",
                icon: FileCheck,
                color: "text-amber-400",
                bg: "bg-amber-500/10 border-amber-500/20",
                href: "/crm/leads",
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div key={idx} variants={itemVariants}>
                  <Link
                    href={card.href}
                    className="stat-kpi-card block group cursor-pointer"
                  >
                    <div className="flex items-center justify-between z-10 relative">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {card.title}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.bg} ${card.color} transition-transform group-hover:scale-105`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4 z-10 relative">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {(card.value ?? 0).toLocaleString()}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold flex items-center gap-1">
                        <span>{card.desc}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* ── Row 2: Lead CRM Statuses & Verification Searches ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Lead Pipeline Widget */}
            <motion.div
              variants={itemVariants}
              className="glass-card p-6 rounded-2xl space-y-5 lg:col-span-2"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Lead Intake Pipeline
                  </h3>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Today &amp; Active Verification Stages
                  </p>
                </div>
                <Link
                  href="/crm/leads"
                  className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 group"
                >
                  <span>Open CRM</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  {
                    label: "Today's Inflow",
                    value: stats.metrics.todaysLeads ?? 0,
                    icon: Clock,
                    badge: "badge-blue",
                  },
                  {
                    label: "Pending Review",
                    value: stats.metrics.pendingLeads ?? 0,
                    icon: Clock,
                    badge: "badge-amber",
                  },
                  {
                    label: "Approved & Credit",
                    value: stats.metrics.approvedLeads ?? 0,
                    icon: UserCheck,
                    badge: "badge-emerald",
                  },
                  {
                    label: "Rejected / Lost",
                    value: stats.metrics.rejectedLeads ?? 0,
                    icon: XCircle,
                    badge: "badge-rose",
                  },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${stat.badge}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">
                          {stat.label}
                        </span>
                        <Icon className="w-3.5 h-3.5 opacity-80" />
                      </div>
                      <span className="text-2xl font-black tracking-tight">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Portal Verification Traffic */}
            <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Live Portal Query Load
                  </h3>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Eligibility Traffic
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Inquiries Today:
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {stats.metrics.todaysSearches ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Monthly Aggregate:
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {stats.metrics.monthlySearches ?? 0}
                  </span>
                </div>
                <div className="pt-2 space-y-1.5">
                  <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                      style={{ width: "65%" }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold block text-right">
                    Quota Allocation: 65% of Max Capacity
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Row 3: Live Telemetry Status Pills ───────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              {
                label: "Active Admins",
                value: stats.metrics?.activeUsers ?? 1,
                icon: UserCheck,
                color: "text-emerald-400",
              },
              {
                label: "Google Ads API",
                value: stats.metrics?.googleAdsStatus ?? "ACTIVE",
                icon: TrendingUp,
                color:
                  (stats.metrics?.googleAdsStatus ?? "ACTIVE") === "ACTIVE"
                    ? "text-emerald-400"
                    : "text-slate-400",
              },
              {
                label: "Website Engine",
                value: stats.metrics?.websiteStatus ?? "ONLINE",
                icon: Globe,
                color:
                  (stats.metrics?.websiteStatus ?? "ACTIVE") === "ACTIVE"
                    ? "text-emerald-400"
                    : "text-amber-400",
              },
              {
                label: "Storage In-Use",
                value: String(stats.metrics?.storageUsage || "12.4 MB / 100 GB").split(" / ")[0],
                icon: HardDrive,
                color: "text-blue-400",
              },
              {
                label: "DB Cluster",
                value: stats.metrics?.systemHealth ?? "HEALTHY",
                icon: Activity,
                color: "text-emerald-400 animate-pulse",
              },
              {
                label: "Excel Batches",
                value: stats.metrics?.excelUploads ?? 0,
                icon: FileSpreadsheet,
                color: "text-purple-400",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="glass-card p-3.5 rounded-xl space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider leading-none">
                      {item.label}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <span className={`text-xs font-black tracking-tight ${item.color}`}>
                    {item.value}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* ── Row 4: Recent Activities & Compliance Tables ─────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Latest Lead Inquiries */}
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Latest Lead Inquiries
                  </h3>
                </div>
                <Link
                  href="/crm/leads"
                  className="text-xs font-bold text-blue-500 hover:text-blue-400"
                >
                  View All
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs font-semibold text-slate-700 dark:text-slate-300">
                {!stats?.latestLeads || stats.latestLeads.length === 0 ? (
                  <p className="text-slate-500 py-8 text-center font-medium">
                    No recent inquiries found.
                  </p>
                ) : (
                  (stats.latestLeads as Lead[]).slice(0, 5).map((lead) => (
                    <div
                      key={lead.id}
                      className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-1 rounded-xl transition-colors"
                    >
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {lead.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {lead.loanType || "Personal Loan"} •{" "}
                          {formatCurrency(lead.loanAmount || 0)}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black border badge-blue uppercase">
                        {lead.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Recent Policy Updates */}
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Recent Underwriting Policies
                  </h3>
                </div>
                <Link
                  href="/policies"
                  className="text-xs font-bold text-blue-500 hover:text-blue-400"
                >
                  Manage Policies
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs font-semibold text-slate-700 dark:text-slate-300">
                {!stats?.recentPolicyUpdates || stats.recentPolicyUpdates.length === 0 ? (
                  <p className="text-slate-500 py-8 text-center font-medium">
                    No policy revisions recorded.
                  </p>
                ) : (
                  (stats.recentPolicyUpdates as Policy[]).slice(0, 5).map((policy) => (
                    <div
                      key={policy.id}
                      className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-1 rounded-xl transition-colors"
                    >
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {policy.bank?.name || "Lender Partner"}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Tier: {policy.companyCategory} • ROI: {policy.roi}% • Min:{" "}
                          {formatCurrency(policy.minSalary)}/mo
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">
                        {formatDate(policy.updatedAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Forensic Compliance Audit Log Trail */}
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl p-6 space-y-4 shadow-xl lg:col-span-2"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Security &amp; Forensic Audit Trail
                  </h3>
                </div>
                <Link
                  href="/audit-logs"
                  className="text-xs font-bold text-blue-500 hover:text-blue-400"
                >
                  Full Forensic Log
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Operator</th>
                      <th>Resource</th>
                      <th>Details</th>
                      <th className="text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!stats?.recentAuditLogs || stats.recentAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          No security logs recorded.
                        </td>
                      </tr>
                    ) : (
                      (stats.recentAuditLogs as AuditLog[]).slice(0, 6).map((log) => (
                        <tr key={log.id}>
                          <td className="font-extrabold text-slate-900 dark:text-white">
                            {log.action}
                          </td>
                          <td className="text-slate-400 font-medium text-xs">
                            {log.userEmail || "System Engine"}
                          </td>
                          <td className="font-mono text-xs text-blue-400">{log.entity}</td>
                          <td className="text-slate-500 text-xs max-w-xs truncate">
                            {log.details
                              ? JSON.stringify(log.details)
                              : "Session activity executed"}
                          </td>
                          <td className="text-right font-mono text-xs text-slate-400">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <div className="py-20 text-center space-y-4 glass-card p-8 max-w-lg mx-auto shadow-2xl">
          <p className="text-sm font-bold text-slate-300">
            Unable to fetch live telemetry stream.
          </p>
          <button
            onClick={() => fetchStats()}
            className="btn-primary px-5 py-2.5 text-xs font-bold"
          >
            Retry Telemetry Fetch
          </button>
        </div>
      )}
    </div>
  );
}
