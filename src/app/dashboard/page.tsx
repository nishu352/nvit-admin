"use client";

import { motion } from "framer-motion";
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
  Settings,
  ArrowUpRight,
} from "lucide-react";
import { AdminStatsSkeleton, AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: loading, refetch: fetchStats } = useDashboardStats();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Operations Overview</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Credit policy indexes, lead statuses, and system audit trail</p>
        </div>
        <button
          onClick={() => fetchStats()}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Control Panel</span>
        </button>
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
          className="space-y-8"
        >
          {/* Row 1: Core Institutional Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                title: "Partner Lenders",
                value: stats.metrics.totalBanks,
                desc: "Banks & NBFCs Indexed",
                icon: Building2,
                iconColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-900",
              },
              {
                title: "Normalized Companies",
                value: stats.metrics.totalCompanies,
                desc: "Unique verified employers",
                icon: FileSpreadsheet,
                iconColor: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-slate-900",
              },
              {
                title: "Pincode Coverage",
                value: stats.metrics.totalPincodes,
                desc: "Postal codes serviceable",
                icon: MapPin,
                iconColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-slate-900",
              },
              {
                title: "Loan Lead Inquiries",
                value: stats.metrics.totalApplications,
                desc: "Lifetime captures",
                icon: FileCheck,
                iconColor: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-slate-900",
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className={`glass-card p-6 rounded-2xl relative overflow-hidden group`}
                >
                  <div className="flex items-center justify-between z-10 relative">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{card.title}</span>
                    <div className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-center ${card.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 z-10 relative">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{card.value.toLocaleString()}</span>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Row 2: Lead CRM Statuses & Search Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lead Pipeline */}
            <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Lead Conversion Pipeline</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Active processing metrics</p>
                </div>
                <Link href="/crm/leads" className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  <span>CRM Board</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Today's Intake", value: stats.metrics.todaysLeads, icon: Clock, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                      { label: "Pending Verification", value: stats.metrics.pendingLeads, icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                      { label: "Approved (Credit)", value: stats.metrics.approvedLeads, icon: UserCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                      { label: "Rejected/Lost", value: stats.metrics.rejectedLeads, icon: XCircle, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <div key={idx} className={`p-4 rounded-xl border ${stat.color} flex flex-col justify-between`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{stat.label}</span>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-2xl font-black text-white mt-3">{stat.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Audit Search volumes */}
                <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Verification Searches</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Live portal query load</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-slate-500">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Checks Today:</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">{stats.metrics.todaysSearches}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Checks This Month:</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">{stats.metrics.monthlySearches}</span>
                    </div>
                    <div className="pt-2">
                      <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: "65%" }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold mt-1.5 block text-right">Quota Usage: 65% of Max Capacity</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Row 3: Live telemetry cells */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Active Admins", value: stats.metrics?.activeUsers ?? 1, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Google Ads", value: stats.metrics?.googleAdsStatus ?? "ACTIVE", icon: TrendingUp, color: (stats.metrics?.googleAdsStatus ?? "ACTIVE") === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400" },
                  { label: "Public Website", value: stats.metrics?.websiteStatus ?? "ACTIVE", icon: Globe, color: (stats.metrics?.websiteStatus ?? "ACTIVE") === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400" },
                  { label: "Storage In-Use", value: (stats.metrics?.storageUsage || "0 MB / 100 GB").split(" / ")[0], icon: HardDrive, color: "text-blue-600 dark:text-blue-400" },
                  { label: "System Health", value: stats.metrics?.systemHealth ?? "HEALTHY", icon: Activity, color: "text-emerald-600 dark:text-emerald-400 animate-pulse" },
                  { label: "Excel circulars", value: stats.metrics?.excelUploads ?? 0, icon: FileSpreadsheet, color: "text-purple-600 dark:text-purple-400" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={idx} variants={itemVariants} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 p-4 rounded-xl space-y-2 flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider leading-none">{item.label}</span>
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className={`text-xs font-black ${item.color} tracking-tight`}>{item.value}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Row 4: Recent Activities & Audit Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Latest Lead Inquiries */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Latest CRM Lead Inquiries</span>
                    </h3>
                    <Link href="/applications" className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                      View All
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    {(!stats?.latestLeads || stats.latestLeads.length === 0) ? (
                      <p className="text-slate-400 py-6 text-center font-medium">No lead inquiries found.</p>
                    ) : (
                      stats.latestLeads.map((lead: any) => (
                        <div key={lead.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/20 px-1 rounded-lg transition-colors">
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white">{lead.name}</h4>
                            <span className="text-[10px] text-slate-500 font-bold">{lead.loanType} • {formatCurrency(lead.loanAmount)}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                            lead.status === "FRESH"
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                              : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                          }`}>
                            {lead.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>

                {/* Recent Policy Updates */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Recent Policy Revisions</span>
                    </h3>
                    <Link href="/policies" className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                      Policies
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    {(!stats?.recentPolicyUpdates || stats.recentPolicyUpdates.length === 0) ? (
                      <p className="text-slate-400 py-6 text-center font-medium">No policy revisions recorded.</p>
                    ) : (
                      stats.recentPolicyUpdates.map((policy: any) => (
                        <div key={policy.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/20 px-1 rounded-lg transition-colors">
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white">{policy.bank?.name || "Lender"}</h4>
                            <span className="text-[10px] text-slate-500 font-bold">Category: {policy.companyCategory} • ROI: {policy.roi}% • Min Sal: {formatCurrency(policy.minSalary)}/pm</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold">
                            {formatDate(policy.updatedAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>

                {/* Audit Logs Trail */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-xl lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Security Audit Log Trail</span>
                    </h3>
                    <Link href="/security/users" className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                      Audit Trail
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-900 pb-2">
                          <th className="pb-3">Action</th>
                          <th className="pb-3">Agent</th>
                          <th className="pb-3">Resource</th>
                          <th className="pb-3">Details</th>
                          <th className="pb-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350">
                        {(!stats?.recentAuditLogs || stats.recentAuditLogs.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">No security logs recorded.</td>
                          </tr>
                        ) : (
                          stats.recentAuditLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10">
                              <td className="py-2.5 font-extrabold text-slate-900 dark:text-white">{log.action}</td>
                              <td className="py-2.5 text-slate-500 dark:text-slate-400 font-semibold">{log.userEmail || "System"}</td>
                              <td className="py-2.5 font-mono text-[10px]">{log.entity}</td>
                              <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium max-w-xs truncate">{log.details ? JSON.stringify(log.details) : "Session activity initialized"}</td>
                              <td className="py-2.5 text-right font-mono text-[10px] text-slate-400 dark:text-slate-500">{formatDate(log.createdAt)}</td>
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
            <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Unable to load live dashboard telemetry.</p>
              <button
                onClick={() => fetchStats()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Retry Refreshing Data
              </button>
            </div>
          )}
        </main>
  );
}
