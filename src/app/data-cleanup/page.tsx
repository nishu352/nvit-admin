"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import {
  Sparkles,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Building,
  Users,
  Eye,
  X,
  Database,
  Layers,
  CheckSquare,
  Square,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { ScanCategory } from "@/types";

interface DatabaseStats {
  totalCompanies: number;
  totalBanks: number;
  totalPincodes: number;
  totalLeads: number;
  totalSessions: number;
  totalImportErrors: number;
  totalAuditLogs: number;
}

export default function DataCleanupPage() {
  const { showToast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [categories, setCategories] = useState<ScanCategory[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [totalRemovable, setTotalRemovable] = useState(0);

  // Selected categories for cleanup
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({
    expiredSessions: true,
    staleImportErrors: true,
    orphanCompanies: false,
    duplicateLeads: false,
    testLeads: true,
    duplicateCompanies: false,
  });

  // Preview Drawer State
  const [previewCategory, setPreviewCategory] = useState<ScanCategory | null>(null);

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [successReport, setSuccessReport] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runScan = async () => {
    setScanning(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get("/admin/maintenance/scan");
      if (res.data.success) {
        const data = res.data.data;
        setScannedAt(data.scannedAt);
        setCategories(data.categories || []);
        setDbStats(data.databaseStats || null);
        setTotalRemovable(data.totalRemovableRecords || 0);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to scan database";
      setErrorMessage(msg);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExecuteCleanup = async () => {
    if (confirmInput !== "PURGE") return;
    setExecuting(true);
    setErrorMessage(null);

    const categoriesToClean = Object.keys(selectedCategories).filter(
      (k) => selectedCategories[k]
    );

    try {
      const res = await apiClient.post("/admin/maintenance/execute", {
        categories: categoriesToClean,
      });

      if (res.data.success) {
        setSuccessReport(res.data.data);
        setShowConfirmModal(false);
        setConfirmInput("");
        showToast({ title: "Database sanitization complete!", type: "success" });
        runScan();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Sanitization failed";
      setErrorMessage(msg);
    } finally {
      setExecuting(false);
    }
  };

  const selectedCount = Object.keys(selectedCategories).filter(
    (k) => selectedCategories[k]
  ).length;

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Database Maintenance &amp; Sanitizer
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Purge orphaned records, stale user sessions, duplicate lead inquiries, and dead batch errors.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={runScan}
            disabled={scanning}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
            <span>{scanning ? "Scanning Tables..." : "Re-Scan Database"}</span>
          </button>

          <button
            disabled={selectedCount === 0 || scanning}
            onClick={() => setShowConfirmModal(true)}
            className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Selected ({selectedCount})</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stats ────────────────────────────────────── */}
      {dbStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-kpi-card p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Employers</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {dbStats.totalCompanies.toLocaleString()}
            </span>
          </div>
          <div className="stat-kpi-card p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Postal Zones</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {dbStats.totalPincodes.toLocaleString()}
            </span>
          </div>
          <div className="stat-kpi-card p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Inquiry Leads</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {dbStats.totalLeads.toLocaleString()}
            </span>
          </div>
          <div className="stat-kpi-card p-4 border-rose-500/30 bg-rose-500/5">
            <span className="text-[10px] uppercase font-bold text-rose-400">Removable Records</span>
            <span className="text-xl font-black text-rose-400 mt-1 block">
              {totalRemovable.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* ── Scan Category Cards ──────────────────────────────── */}
      {scanning && categories.length === 0 ? (
        <AdminCardGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const isSelected = selectedCategories[cat.id] || false;
            return (
              <div
                key={cat.id}
                className={`glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isSelected ? "border-purple-500/40 bg-purple-500/5" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => toggleSelect(cat.id)}
                      className="flex items-center gap-2 cursor-pointer text-left"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-purple-400 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500 shrink-0" />
                      )}
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {cat.title}
                      </h3>
                    </button>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${
                        cat.riskLevel === "SAFE"
                          ? "badge-emerald"
                          : cat.riskLevel === "LOW"
                          ? "badge-amber"
                          : "badge-rose"
                      }`}
                    >
                      {cat.riskLevel} RISK
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium">{cat.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {cat.count.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1 font-semibold">Records</span>
                  </div>

                  {cat.count > 0 && (
                    <button
                      onClick={() => setPreviewCategory(cat)}
                      className="btn-secondary h-8 px-3 text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Inspect Sample</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sample Inspection Drawer ─────────────────────────── */}
      <AnimatePresence>
        {previewCategory && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewCategory(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-[#060c1c] border-l border-slate-200 dark:border-white/[0.08] h-full shadow-2xl flex flex-col p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {previewCategory.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Sample preview ({previewCategory.sampleItems.length} records shown)
                  </p>
                </div>
                <button
                  onClick={() => setPreviewCategory(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {previewCategory.sampleItems.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">
                    No sample records found.
                  </p>
                ) : (
                  previewCategory.sampleItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs font-mono space-y-1"
                    >
                      <pre className="text-slate-300 text-[11px] overflow-x-auto">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Purge Confirmation Modal ─────────────────────────── */}
      {showConfirmModal && (
        <Modal
          open={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setConfirmInput("");
          }}
          title="Confirm Database Sanitization"
          description="High-risk maintenance action: Selected stale records and duplicates will be permanently purged from PostgreSQL."
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                To proceed, type <strong className="font-mono text-white font-bold">PURGE</strong> below to authorize irreversible database deletion.
              </span>
            </div>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder='Enter "PURGE" to authorize'
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-bold focus:outline-none focus:border-rose-500 rounded-xl"
            />

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmInput("");
                }}
                className="btn-secondary h-10 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmInput !== "PURGE" || executing}
                onClick={handleExecuteCleanup}
                className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                {executing ? "Sanitizing Tables..." : "Execute Purge"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
