"use client";

import { useState } from "react";
import { useAuditLogsQuery } from "@/hooks/useAdminQueries";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { AuditLog } from "@/types";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logsData, isLoading: loading, refetch: fetchLogs } = useAuditLogsQuery(page, 25);
  const logs = (logsData?.items || []) as AuditLog[];
  const totalPages = logsData?.totalPages || 1;

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
      log.entity.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Forensic Security &amp; Compliance Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Immutable log stream of administrative actions, authentication tokens, policy modifications, and IP addresses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchLogs()}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Audit Stream</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, operator email, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Table Container ──────────────────────────────────── */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={6} />
      ) : filteredLogs.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No audit log items located
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search ? "No events match your search query." : "Security events will be logged here as actions occur."}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Operator</th>
                  <th>Target Entity</th>
                  <th>Payload Summary</th>
                  <th>Source IP</th>
                  <th className="text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="font-extrabold text-blue-400 font-mono text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900 dark:text-white text-xs block">
                        {log.userEmail || "System Engine"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-purple-400 font-bold">
                        {log.entity}
                      </span>
                    </td>
                    <td>
                      <div
                        onClick={() => setSelectedLog(log)}
                        className="text-slate-400 text-xs font-mono max-w-xs truncate cursor-pointer hover:text-white transition-colors"
                        title="Click to inspect raw payload"
                      >
                        {typeof log.details === "object"
                          ? JSON.stringify(log.details)
                          : log.details || "—"}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-400">
                        {log.ipAddress || "127.0.0.1"}
                      </span>
                    </td>
                    <td className="text-right font-mono text-xs text-slate-400">
                      {formatDate(log.createdAt)}
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

      {/* ── Log Payload Modal ─────────────────────────────────── */}
      {selectedLog && (
        <Modal
          open={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Forensic Log: ${selectedLog.action}`}
          description={`Operator: ${selectedLog.userEmail || "System"} • Entity: ${selectedLog.entity}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/60 border border-slate-200 dark:border-white/[0.08] space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Raw Event Payload (JSON)
              </span>
              <pre className="text-xs font-mono text-emerald-400 overflow-x-auto p-2">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn-primary h-10 px-5 text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
