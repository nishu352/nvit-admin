"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  RefreshCw,
  Sparkles,
  Shield,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { ApiKey, Executive, AuditLog } from "@/types";

export default function AdminSecurityUsersPage() {
  const [users, setUsers] = useState<Executive[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Modals & Copy
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [usersRes, keysRes, logsRes] = await Promise.all([
        apiClient.get("/admin/users"),
        apiClient.get("/admin/security/apikeys"),
        apiClient.get("/admin/audit-logs?limit=10"),
      ]);

      if (usersRes.data?.success) setUsers(usersRes.data.data || []);
      if (keysRes.data?.success) setApiKeys(keysRes.data.data || []);
      if (logsRes.data?.success) setAuditLogs(logsRes.data.data?.items || []);
    } catch (err) {
      console.error("Failed to load security telemetry", err);
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
    setIsSubmitting(true);

    try {
      const res = await apiClient.post("/admin/security/apikeys", { name: keyName.trim() });
      if (res.data.success) {
        setNewGeneratedKey(res.data.data.key);
        setKeyName("");
        showToast({ title: "API Key generated successfully", type: "success" });
        fetchSecurityData();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to generate API Key";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeApiKey = async () => {
    if (!revokeTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch(`/admin/security/apikeys/${revokeTarget.id}/revoke`);
      showToast({ title: "API Key revoked permanently", type: "success" });
      setRevokeTarget(null);
      fetchSecurityData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Revocation failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast({ title: "API Key copied to clipboard", type: "info" });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Security &amp; Machine Access Tokens
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Manage programmatic API credentials, active operator privileges, and system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setNewGeneratedKey(null);
              setKeyName("");
              setShowKeyModal(true);
            }}
            className="btn-primary h-10 px-4 text-xs font-bold"
          >
            <Key className="w-4 h-4" />
            <span>Generate API Token</span>
          </button>
        </div>
      </div>

      {loading ? (
        <AdminCardGridSkeleton count={4} />
      ) : (
        <div className="space-y-7">
          {/* ── Section 1: Active API Keys ───────────────────────── */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-blue-500" />
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Programmatic API Access Keys
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Machine tokens for external webhook integrations and underwriting sync
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {apiKeys.length} Active Keys
              </span>
            </div>

            {apiKeys.length === 0 ? (
              <p className="text-slate-500 py-6 text-center text-xs">
                No active API integration keys provisioned.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {k.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${
                            k.status === "ACTIVE" ? "badge-emerald" : "badge-rose"
                          }`}
                        >
                          {k.status}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block">
                        Prefix: <strong className="text-slate-300">{k.keyPrefix || "nvit_live_"}...</strong>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500">
                      <span>Created: {formatDate(k.createdAt)}</span>
                      {k.status === "ACTIVE" && (
                        <button
                          onClick={() => setRevokeTarget(k)}
                          className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke Token</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 2: Active Operators ──────────────────────── */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Authorized System Operators
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Users with administrative console login credentials
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {users.length} Users
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                        {u.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[180px]">
                        {u.email}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-black border badge-blue uppercase">
                      {u.role}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500">
                    <span>Registered:</span>
                    <span className="font-mono">{formatDate(u.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Key Generation Modal ─────────────────────────────── */}
      {showKeyModal && (
        <Modal
          open={showKeyModal}
          onClose={() => setShowKeyModal(false)}
          title="Generate Programmatic API Key"
          description="Provision a secure machine token for server-to-server integration."
        >
          {newGeneratedKey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold space-y-2">
                <p>
                  Copy this API key now. For security purposes, it will never be displayed again.
                </p>
                <div className="p-3 bg-black/50 rounded-xl font-mono text-xs text-white break-all select-all flex items-center justify-between gap-2">
                  <span>{newGeneratedKey}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(newGeneratedKey)}
                    className="btn-secondary h-8 px-2.5 text-xs font-bold shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="btn-primary h-10 px-5 text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Key Friendly Name *
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Webhook Gateway"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="btn-secondary h-10 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary h-10 px-5 text-xs font-bold"
                >
                  {isSubmitting ? "Generating..." : "Generate Token"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ── Revoke Key Dialog ────────────────────────────────── */}
      {revokeTarget && (
        <ConfirmDialog
          open={Boolean(revokeTarget)}
          onClose={() => setRevokeTarget(null)}
          onConfirm={handleRevokeApiKey}
          title={`Revoke API Key: ${revokeTarget.name}?`}
          description={`Are you sure you want to permanently revoke this key (${revokeTarget.keyPrefix}...)? All external API requests using this token will be rejected immediately.`}
          confirmLabel="Permanently Revoke"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
