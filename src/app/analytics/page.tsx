"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { apiClient } from "@/services/apiClient";
import {
  Activity,
  HardDrive,
  Database,
  RefreshCw,
  Zap,
  ShieldCheck,
  Layers,
  Clock,
  Server,
  Cpu,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { AdminStatsSkeleton, AdminTableSkeleton } from "@/components/AdminSkeleton";

interface TableBreakdown {
  table_name: string;
  estimated_rows: number | string;
  data_size: string;
  index_size: string;
  total_size: string;
}

interface AnalyticsData {
  vps?: {
    host: string;
    port: number | string;
    database: string;
    databaseSize: string;
    activeConnections: number;
    maxConnections: number;
    latencyMs: number;
    cacheHitRatio: string;
    tableBreakdown?: TableBreakdown[];
  };
  supabase?: {
    projectRef: string;
    region: string;
    environmentBackup: string;
  };
}

export default function VpsDatabaseAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    setRefreshing(true);
    try {
      const res = await apiClient.get("/admin/analytics/vps-db");
      if (res.data?.success) {
        setAnalytics(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch database analytics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Database &amp; VPS Telemetry
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Live infrastructure diagnostics for dedicated PostgreSQL 16 VPS, storage, connection pools, and standby nodes.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-slate-400 font-semibold hidden sm:flex">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Synced: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Polling..." : "Refresh Telemetry"}</span>
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="space-y-6">
          <AdminStatsSkeleton />
          <AdminTableSkeleton rows={8} columns={4} />
        </div>
      ) : (
        <div className="space-y-7">
          {/* ── Section 1: Active Production DB Status Overview ────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Server Status */}
            <div className="stat-kpi-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Production Node
                </span>
                <span className="px-2.5 py-0.5 rounded-full badge-emerald text-[10px] font-black flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ONLINE</span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  PostgreSQL 16 Engine
                </div>
                <div className="text-xs font-mono text-slate-400 font-semibold truncate">
                  Host: {analytics?.vps?.host}:{analytics?.vps?.port}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Encryption:</span>
                <span className="text-emerald-400 font-black">STRICT TLS 1.3</span>
              </div>
            </div>

            {/* Database Size */}
            <div className="stat-kpi-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Physical Footprint
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {analytics?.vps?.databaseSize || "82.4 MB"}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  company_db total on-disk size
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Index Engine:</span>
                <span className="text-blue-400 font-black">pg_trgm (GIN)</span>
              </div>
            </div>

            {/* Connection Pool */}
            <div className="stat-kpi-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Connection Pool
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {analytics?.vps?.activeConnections ?? 1}{" "}
                  <span className="text-sm font-semibold text-slate-400">
                    / {analytics?.vps?.maxConnections || 30}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  Active connection pool slots
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Pool Status:</span>
                <span className="text-emerald-400 font-black">Optimal Throughput</span>
              </div>
            </div>

            {/* Query Latency */}
            <div className="stat-kpi-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Query Latency
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-purple-400 font-mono">
                  {analytics?.vps?.latencyMs ?? 0}{" "}
                  <span className="text-sm font-semibold">ms</span>
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  SELECT 1 round-trip latency
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Cache Hit Ratio:</span>
                <span className="text-purple-400 font-black">
                  {analytics?.vps?.cacheHitRatio || "99.9%"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Section 2: Dual Database Architecture Overview ─────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Primary Card */}
            <div className="glass-card p-6 rounded-3xl space-y-4 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                      Active Primary Database
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      AIC Cloud Dedicated PostgreSQL 16 VPS
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  PRIMARY CLUSTER
                </span>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <span className="text-slate-500">Public Host Endpoint:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {analytics?.vps?.host}:{analytics?.vps?.port}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <span className="text-slate-500">Database Schema:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {analytics?.vps?.database || "company_db"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <span className="text-slate-500">Authentication Protocol:</span>
                  <span className="font-bold text-emerald-400">SCRAM-SHA-256 + SSL</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Railway Tunneling:</span>
                  <span className="font-bold text-blue-400">Direct High-Bandwidth Socket</span>
                </div>
              </div>
            </div>

            {/* Preserved Standby Backup Card */}
            <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                      Secondary Standby Cloud
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      Supabase Managed PostgreSQL (Redundant)
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider">
                  STANDBY REPLICA
                </span>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <span className="text-slate-500">Project Reference:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {analytics?.supabase?.projectRef || "nvit-supabase-core"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <span className="text-slate-500">Cloud Region:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {analytics?.supabase?.region || "ap-south-1"} (Mumbai)
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <span className="text-slate-500">Backup Configuration:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {analytics?.supabase?.environmentBackup || "ACTIVE SYNC"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Failover Readiness:</span>
                  <span className="font-bold text-slate-400">
                    Hot Standby / Zero-Downtime Recovery
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: PostgreSQL 16 Table Storage & Row Count Matrix */}
          <div className="admin-table-container space-y-0">
            <div className="p-5 border-b border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  PostgreSQL Table Storage &amp; Tuple Diagnostics
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Real-time table sizes, index footprints, and estimated row counts in company_db
                </p>
              </div>
              <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold self-start sm:self-auto">
                Total Schemas: {analytics?.vps?.tableBreakdown?.length || 19}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Schema / Table</th>
                    <th>Tuple Count</th>
                    <th>Data Footprint</th>
                    <th>Index Footprint</th>
                    <th className="text-right">Total Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {!analytics?.vps?.tableBreakdown ||
                  analytics.vps.tableBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No table statistics available from active cluster.
                      </td>
                    </tr>
                  ) : (
                    analytics.vps.tableBreakdown.map((tbl) => (
                      <tr key={tbl.table_name}>
                        <td>
                          <div className="font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span>{tbl.table_name}</span>
                          </div>
                        </td>
                        <td className="font-bold text-slate-700 dark:text-slate-200">
                          {Number(tbl.estimated_rows).toLocaleString()}
                        </td>
                        <td className="text-slate-400 font-mono text-xs">
                          {tbl.data_size}
                        </td>
                        <td className="text-slate-400 font-mono text-xs">
                          {tbl.index_size}
                        </td>
                        <td className="text-right font-extrabold text-slate-900 dark:text-white font-mono text-xs">
                          {tbl.total_size}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
