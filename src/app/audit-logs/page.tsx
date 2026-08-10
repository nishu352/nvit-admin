"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { apiClient } from "@/services/apiClient";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/audit-logs").then((res) => {
      if (res.data.success) {
        setLogs(res.data.data.items);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-royal selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="border-b border-slate-900 pb-5">
          <h1 className="text-2xl font-black text-white tracking-tight">Security & Compliance Audit Trail</h1>
          <p className="text-xs text-slate-400 font-medium font-semibold">Immutable audit trail of admin actions, login events & policy circular ingestions</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading audit logs...</div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 text-[11px] uppercase font-black tracking-wider border-b border-slate-800">
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">User Email</th>
                  <th className="py-4 px-6">Entity</th>
                  <th className="py-4 px-6">Details</th>
                  <th className="py-4 px-6">IP Address</th>
                  <th className="py-4 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-450 font-semibold">
                      No security audit log items found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/60 bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6 font-extrabold text-blue-400">{log.action}</td>
                      <td className="py-4 px-6 font-semibold text-white">{log.userEmail || "Anonymous / Public"}</td>
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-400 font-semibold">{log.entity}</td>
                      <td className="py-4 px-6 text-slate-300 max-w-xs truncate font-medium">{log.details || "-"}</td>
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-450 font-semibold">{log.ipAddress || "127.0.0.1"}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono font-semibold">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
