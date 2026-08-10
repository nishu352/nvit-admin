"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { apiClient } from "@/services/apiClient";
import {
  Sliders,
  Save,
  CheckCircle2,
  Mail,
  MessageSquare,
  Power,
  Server,
} from "lucide-react";

export default function AdminSystemPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // System Fields
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

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
    setSuccessMsg(false);

    const payload = {
      smtp: { host: smtpHost, port: smtpPort, user: smtpUser, password: smtpPassword },
      gateways: { smsKey: smsApiKey, whatsappKey: whatsappApiKey },
      maintenance: maintenanceMode,
    };

    try {
      const res = await apiClient.put("/admin/system", payload);
      if (res.data.success) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-royal selection:text-white">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <AdminHeader />

        <main className="flex-1 p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">System & Infrastructure Control</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Configure transactional SMTP credentials, SMS & WhatsApp APIs, and system maintenance switches</p>
            </div>
            <button
              onClick={handleSaveSystem}
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Updating Systems..." : "Save System Config"}</span>
            </button>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>System infrastructure configurations saved successfully!</span>
            </div>
          )}

          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading infrastructure parameters...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveSystem} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SMTP Credentials */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-4">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Transactional SMTP Credentials</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SMTP Server Host</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.sendgrid.net"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SMTP Port</label>
                      <input
                        type="text"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="587"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SMTP Username</label>
                      <input
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="apikey"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SMTP Password</label>
                      <input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Messaging Gateways */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-4">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">SMS & WhatsApp API Gateways</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SMS Gateway API Key (Fast2SMS / DLT)</label>
                    <input
                      type="text"
                      value={smsApiKey}
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      placeholder="Paste SMS Gateway API Token"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white font-mono rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">WhatsApp Business API Key (WATI / Interakt)</label>
                    <input
                      type="text"
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                      placeholder="Paste WhatsApp Business Token"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white font-mono rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Switch */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                  <div className="flex items-center space-x-2">
                    <Power className="w-5 h-5 text-amber-400" />
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Platform Maintenance Mode</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      maintenanceMode
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-850 hover:text-white"
                    }`}
                  >
                    {maintenanceMode ? "SYSTEM IN MAINTENANCE MODE" : "NORMAL SYSTEM OPERATION"}
                  </button>
                </div>

                <p className="text-xs text-slate-400 font-semibold">
                  Toggling maintenance mode will restrict public applicant access and display a system upgrade banner across the landing page. Admin portal remains active.
                </p>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
