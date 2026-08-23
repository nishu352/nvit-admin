"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import {
  Sliders,
  Save,
  CheckCircle2,
  Mail,
  MessageSquare,
  Power,
  Server,
  Shield,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { AdminFormSkeleton } from "@/components/AdminSkeleton";
import { useToast } from "@/components/ui/Toast";

export default function AdminSystemPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // System Fields
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [twoStepVerification, setTwoStepVerification] = useState(true);

  const fetchSystemSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/system");
      if (res.data.success) {
        const data = res.data.data;
        if (data.smtp) {
          setSmtpHost(data.smtp.host || "");
          setSmtpPort(data.smtp.port || "587");
          setSmtpUser(data.smtp.user || "");
          setSmtpPassword(data.smtp.password || "");
        }
        if (data.gateways) {
          setSmsApiKey(data.gateways.smsKey || "");
          setWhatsappApiKey(data.gateways.whatsappKey || "");
        }
        if (data.maintenance !== undefined) {
          setMaintenanceMode(Boolean(data.maintenance));
        }
        if (data.twoStepVerification !== undefined) {
          setTwoStepVerification(Boolean(data.twoStepVerification));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      smtp: { host: smtpHost.trim(), port: smtpPort.trim(), user: smtpUser.trim(), password: smtpPassword },
      gateways: { smsKey: smsApiKey.trim(), whatsappKey: whatsappApiKey.trim() },
      maintenance: maintenanceMode,
      twoStepVerification: twoStepVerification,
    };

    try {
      const res = await apiClient.put("/admin/system", payload);
      if (res.data.success) {
        showToast({ title: "System engine settings saved successfully!", type: "success" });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Save failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              System Settings &amp; Engine Control
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Transactional email gateways, SMS / WhatsApp providers, 2FA security, and platform maintenance killswitches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleSaveSystem}
            disabled={saving}
            className="btn-primary h-10 px-5 text-xs font-bold"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving Config..." : "Save System Config"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <AdminFormSkeleton />
      ) : (
        <form onSubmit={handleSaveSystem} className="space-y-6">
          {/* ── Killswitches & Core Operational Mode ────────────── */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <Power className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Platform Operational Modes &amp; Security Controls
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Maintenance Mode */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Maintenance Mode
                    </span>
                    {maintenanceMode && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black badge-rose">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Restrict public user access and display a maintenance notice
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-500 cursor-pointer shrink-0"
                />
              </div>

              {/* 2FA */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Two-Step Operator Verification
                  </span>
                  <p className="text-xs text-slate-400 font-medium">
                    Enforce OTP challenges for admin console sessions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={twoStepVerification}
                  onChange={(e) => setTwoStepVerification(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>

          {/* ── Transactional SMTP Email ────────────────────────── */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <Mail className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Transactional SMTP Gateway
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">SMTP Host / Server</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="e.g. smtp.postmarkapp.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">SMTP Port</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Username / Key</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="apikey"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Password / Token</label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ── SMS & WhatsApp Communication Gateways ────────────── */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                SMS &amp; WhatsApp Notification Gateways
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">SMS Gateway API Key</label>
                <input
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  WhatsApp Business API Token
                </label>
                <input
                  type="password"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
