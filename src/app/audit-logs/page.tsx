"use client";

import { useAuditLogsQuery } from "@/hooks/useAdminQueries";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export default function AdminAuditLogsPage() {
  const { data: logsData, isLoading: loading } = useAuditLogsQuery(1, 50);
  const logs = logsData?.items || [];

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-900 pb-5">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Security &amp; Compliance Audit Trail</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">Immutable audit trail of admin actions, login events &amp; policy circular ingestions</p>
        </div>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} columns={6} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-350 text-[10px] uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">User Email</th>
                  <th className="py-4 px-6">Entity</th>
                  <th className="py-4 px-6">Details</th>
                  <th className="py-4 px-6">IP Address</th>
                  <th className="py-4 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-bold text-slate-700 dark:text-slate-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No security audit log items found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors">
                      <td className="py-4 px-6 font-extrabold text-blue-600 dark:text-blue-400 font-mono text-[11px]">{log.action}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{log.userEmail || "Anonymous / Public"}</td>
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{log.entity}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 max-w-xs truncate font-medium">{log.details || "-"}</td>
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-500 dark:text-slate-450 font-semibold">{log.ipAddress || "127.0.0.1"}</td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono font-semibold text-[11px]">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
