"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/apiClient";
import {
  ShieldCheck,
  Key,
  Plus,
  Trash2,
  Lock,
  User,
  Activity,
  Copy,
  Check,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";

export default function AdminSecurityUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Copy
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [usersRes, keysRes, logsRes] = await Promise.all([
        apiClient.get("/admin/users"),
        apiClient.get("/admin/security/apikeys"),
        apiClient.get("/admin/audit-logs?limit=15"),
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (keysRes.data.success) setApiKeys(keysRes.data.data);
      if (logsRes.data.success) setAuditLogs(logsRes.data.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      const res = await apiClient.post("/admin/security/apikeys", { name: keyName });
      if (res.data.success) {
        setNewGeneratedKey(res.data.data.key);
        setKeyName("");
        fetchSecurityData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API Key? Connected integrations will lose access!")) return;
    try {
      await apiClient.patch(`/admin/security/apikeys/${id}/revoke`);
      fetchSecurityData();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Security & Integration Keys</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage machine authentication tokens, active operator sessions, and system audit logs</p>
            </div>
            <button
              onClick={() => {
                setNewGeneratedKey(null);
                setShowKeyModal(true);
              }}
              className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Generate API Key</span>
            </button>
          </div>

          {loading ? (
            <AdminCardGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* API Keys Table */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-3">
                  <Key className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Integration API Tokens</h3>
                </div>

                {apiKeys.length === 0 ? (
                  <div className="py-12 text-center text-xs font-semibold text-slate-500">
                    No active API key credentials registered.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white">{key.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                            key.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {key.isActive ? "ACTIVE" : "REVOKED"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 bg-slate-900 p-2 rounded-lg">
                          <span>{key.key.slice(0, 16)}••••••••</span>
                          {key.isActive && (
                            <button
                              onClick={() => handleRevokeApiKey(key.id)}
                              className="text-rose-400 hover:text-rose-300 font-sans text-[9px] font-bold cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Trail Logs */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-3">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">System Audit Trail Stream</h3>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs font-medium space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white">{log.action}</span>
                        <span className="text-[9px] font-mono text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>User: {log.userEmail || "System"}</span>
                        <span>IP: {log.ipAddress || "127.0.0.1"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generate API Key Modal */}
          <AnimatePresence>
            {showKeyModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800 space-y-6 text-slate-100"
                >
                  <h2 className="text-lg font-black text-white">Generate Integration API Token</h2>

                  {newGeneratedKey ? (
                    <div className="space-y-4">
                      <p className="text-xs text-emerald-400 font-semibold">
                        API Key generated! Copy this secret key immediately. It will not be shown again.
                      </p>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 font-mono text-xs text-white flex items-center justify-between break-all">
                        <span>{newGeneratedKey}</span>
                        <button
                          onClick={() => copyToClipboard(newGeneratedKey)}
                          className="ml-2 p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        onClick={() => setShowKeyModal(false)}
                        className="w-full py-3 bg-royal text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateApiKey} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Token Name / Integration Purpose *</label>
                        <input
                          type="text"
                          required
                          value={keyName}
                          onChange={(e) => setKeyName(e.target.value)}
                          placeholder="e.g. Mobile App Gateway"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowKeyModal(false)}
                          className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 rounded-xl bg-royal text-white text-xs font-bold cursor-pointer hover:bg-royal-hover transition-colors"
                        >
                          Generate Token
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
  );
}
