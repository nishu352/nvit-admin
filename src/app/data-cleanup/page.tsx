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
  FileSpreadsheet,
  Building,
  Users,
  Eye,
  X,
  Database,
  Layers,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";

interface ScanCategory {
  id: string;
  title: string;
  description: string;
  count: number;
  riskLevel: "SAFE" | "LOW" | "MODERATE";
  impact: string;
  sampleItems: any[];
}

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
        setCategories(data.categories);
        setDbStats(data.databaseStats);
        setTotalRemovable(data.totalRemovableRecords);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to scan database for duplicates and stale data");
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

  const selectAll = () => {
    const allSelected: Record<string, boolean> = {};
    categories.forEach((cat) => {
      allSelected[cat.id] = true;
    });
    setSelectedCategories(allSelected);
  };

  const deselectAll = () => {
    const noneSelected: Record<string, boolean> = {};
    categories.forEach((cat) => {
      noneSelected[cat.id] = false;
    });
    setSelectedCategories(noneSelected);
  };

  const selectedCount = categories
    .filter((cat) => selectedCategories[cat.id])
    .reduce((sum, cat) => sum + cat.count, 0);

  const handleExecuteCleanup = async () => {
    if (confirmInput !== "CLEAN DATABASE") return;

    setExecuting(true);
    setErrorMessage(null);
    try {
      const payload = {
        cleanExpiredSessions: Boolean(selectedCategories.expiredSessions),
        cleanStaleImportErrors: Boolean(selectedCategories.staleImportErrors),
        cleanOrphanCompanies: Boolean(selectedCategories.orphanCompanies),
        cleanDuplicateLeads: Boolean(selectedCategories.duplicateLeads),
        cleanTestLeads: Boolean(selectedCategories.testLeads),
        deduplicateCompanies: Boolean(selectedCategories.duplicateCompanies),
        staleErrorsDays: 30,
        confirmationText: confirmInput,
      };

      const res = await apiClient.post("/admin/maintenance/clean", payload);
      if (res.data.success) {
        setSuccessReport(res.data.data);
        setShowConfirmModal(false);
        setConfirmInput("");
        // Re-run scan to refresh counters
        await runScan();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Database cleanup execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case "expiredSessions":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "staleImportErrors":
        return <FileSpreadsheet className="w-5 h-5 text-purple-500" />;
      case "orphanCompanies":
        return <Building className="w-5 h-5 text-amber-500" />;
      case "duplicateLeads":
      case "testLeads":
        return <Users className="w-5 h-5 text-emerald-500" />;
      case "duplicateCompanies":
        return <Layers className="w-5 h-5 text-indigo-500" />;
      default:
        return <Database className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-royal" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Safe Database Sanitizer &amp; Cleaner
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
            Audit, deduplicate, and safely purge redundant sessions, stale error logs, unmapped companies, and spam leads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runScan}
            disabled={scanning}
            className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-black transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin text-royal" : ""}`} />
            <span>{scanning ? "Scanning Database..." : "Run Health Scan"}</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={selectedCount === 0 || scanning}
            className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-black shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Selected ({selectedCount})</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successReport && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Database Sanitization Completed Successfully!</span>
            </div>
            <button
              onClick={() => setSuccessReport(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            Purged a total of <span className="font-black text-emerald-950 dark:text-white">{successReport.totalRecordsPurged}</span> records safely. Audit log entry generated.
          </p>
        </div>
      )}

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Removable Items</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalRemovable}</p>
          <span className="text-[10px] text-slate-500 font-semibold block">
            {scannedAt ? `Scanned ${new Date(scannedAt).toLocaleTimeString()}` : "Ready to scan"}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Companies</span>
            <Building className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {dbStats?.totalCompanies ?? "..."}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold block">Enterprise database</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total CRM Leads</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {dbStats?.totalLeads ?? "..."}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold block">Active applicant records</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">System Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {totalRemovable > 0 ? "Optimizations Available" : "Database Clean"}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold block">
            {totalRemovable > 0 ? `${totalRemovable} records flagged` : "All tables healthy"}
          </span>
        </div>
      </div>

      {/* Category Section with Selection Tools */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Sanitization Modules ({categories.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-[11px] font-bold text-royal hover:underline cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={deselectAll}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>

        {scanning ? (
          <AdminCardGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {categories.map((cat) => {
              const isSelected = Boolean(selectedCategories[cat.id]);
              return (
                <div
                  key={cat.id}
                  className={`p-6 rounded-3xl border transition-all space-y-4 relative ${
                    isSelected
                      ? "bg-white dark:bg-slate-900 border-blue-500/50 shadow-md shadow-royal/5"
                      : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(cat.id)}
                        className="text-royal cursor-pointer shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-royal" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                        {getCategoryIcon(cat.id)}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-white">{cat.title}</h3>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                          {cat.description}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 border ${
                        cat.riskLevel === "SAFE"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : cat.riskLevel === "LOW"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {cat.riskLevel} RISK
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Removable Rows</span>
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">{cat.count}</span>
                    </div>
                    {cat.sampleItems && cat.sampleItems.length > 0 && (
                      <button
                        onClick={() => setPreviewCategory(cat)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Samples ({cat.sampleItems.length})</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Impact: </span>
                    {cat.impact}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspect Sample Records Modal */}
      {previewCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {getCategoryIcon(previewCategory.id)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Sample Records: {previewCategory.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Showing up to {previewCategory.sampleItems.length} candidate rows
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewCategory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {previewCategory.sampleItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono text-[11px] space-y-1.5 overflow-x-auto"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-850 pb-1">
                    <span>RECORD #{idx + 1}</span>
                    <span>ID: {item.id || "N/A"}</span>
                  </div>
                  <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans text-xs">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end shrink-0">
              <button
                onClick={() => setPreviewCategory(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Type-to-Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-500/30 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Confirm Database Sanitization
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                You are about to purge <span className="text-rose-600 font-black">{selectedCount}</span> records from the database across your selected categories.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Selected Modules:
              </span>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                {categories
                  .filter((cat) => selectedCategories[cat.id])
                  .map((cat) => (
                    <li key={cat.id} className="flex items-center justify-between">
                      <span>• {cat.title}</span>
                      <span className="font-mono font-bold">{cat.count} rows</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Type <span className="text-rose-600 font-mono font-black">CLEAN DATABASE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="CLEAN DATABASE"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-rose-500 uppercase text-center"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmInput("");
                }}
                className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteCleanup}
                disabled={confirmInput !== "CLEAN DATABASE" || executing}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{executing ? "Sanitizing..." : "Execute Purge"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
