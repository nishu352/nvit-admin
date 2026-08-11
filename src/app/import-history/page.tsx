"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { apiClient } from "@/services/apiClient";
import {
  History,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  Building2,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  BadgeCheck,
  AlertCircle,
  TriangleAlert,
  Eye,
  Database,
  AlertTriangle,
  Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportHistoryItem {
  id: string;
  bankId: string;
  bankName: string;
  bankCode: string;
  bankType: string;
  fileName: string;
  importType: "MERGE" | "REPLACE";
  totalRecords: number;
  processedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage?: string;
  mappingJson?: string;
  createdAt: string;
  createdByName: string;
  createdByEmail: string;
}

interface ImportErrorItem {
  id: string;
  rowNumber: number;
  columnName?: string;
  errorCode: string;
  errorMessage: string;
  rawData?: string;
  createdAt: string;
}

interface ImportErrorsData {
  total: number;
  page: number;
  totalPages: number;
  breakdown: { code: string; count: number }[];
  items: ImportErrorItem[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PROCESSING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    PENDING: "bg-slate-700/40 text-slate-400 border-slate-600/30",
    FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  const icons: Record<string, React.ReactNode> = {
    COMPLETED: <BadgeCheck className="w-3 h-3" />,
    PROCESSING: <Loader2 className="w-3 h-3 animate-spin" />,
    PENDING: <AlertCircle className="w-3 h-3" />,
    FAILED: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black border ${styles[status] || styles.FAILED}`}>
      {icons[status]}
      {status}
    </span>
  );
}

// ─── Mode badge ───────────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black border ${
      mode === "REPLACE"
        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }`}>
      {mode}
    </span>
  );
}

// ─── Progress mini bar ────────────────────────────────────────────────────────

function MiniProgress({ processed, total, status }: { processed: number; total: number; status: string }) {
  if (total === 0) return null;
  const pct = Math.min(100, Math.round((processed / total) * 100));
  return (
    <div className="space-y-0.5">
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${status === "COMPLETED" ? "bg-emerald-400" : status === "FAILED" ? "bg-rose-400" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[9px] text-slate-500 font-semibold">
        {processed.toLocaleString()} / {total.toLocaleString()}
      </p>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────

function ReportModal({ item, onClose }: { item: ImportHistoryItem; onClose: () => void }) {
  let mapping: Record<string, string> | null = null;
  try {
    if (item.mappingJson) mapping = JSON.parse(item.mappingJson);
  } catch {}

  const fieldLabels: Record<string, string> = {
    company_name: "🏢 Company Name",
    category: "🏷️ Category",
    status: "✅ Status",
    cin: "🪪 CIN / Reg No.",
    remarks: "📝 Remarks",
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slow-fade">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-sm font-black text-white">Import Report</h2>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[280px]" title={item.fileName}>
              {item.fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + Mode */}
          <div className="flex items-center gap-3">
            <StatusBadge status={item.status} />
            <ModeBadge mode={item.importType} />
            <span className="text-[10px] text-slate-500 font-medium ml-auto">
              {new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>

          {/* Core stats grid */}
          <div className="bg-slate-950 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {[
              { label: "Bank / NBFC", value: `${item.bankName} (${item.bankCode})` },
              { label: "Imported By", value: item.createdByName },
              { label: "Total Rows", value: item.totalRecords?.toLocaleString() ?? "0" },
              { label: "Imported", value: item.processedRecords?.toLocaleString() ?? "0", color: "text-emerald-400" },
              { label: "Skipped", value: item.skippedRecords?.toLocaleString() ?? "0", color: "text-amber-400" },
              { label: "Failed", value: item.failedRecords?.toLocaleString() ?? "0", color: "text-rose-400" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={`text-xs font-black mt-0.5 ${(s as any).color || "text-white"} truncate`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {item.totalRecords > 0 && (
            <MiniProgress
              processed={item.processedRecords}
              total={item.totalRecords}
              status={item.status}
            />
          )}

          {/* Column mapping used */}
          {mapping && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                Column Mapping Used
              </h4>
              <div className="bg-slate-950 rounded-xl divide-y divide-slate-900">
                {Object.entries(mapping)
                  .filter(([_, v]) => v)
                  .map(([key, col]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2">
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {fieldLabels[key] || key}
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold truncate max-w-[180px]">{col}</span>
                    </div>
                  ))}
                {Object.entries(mapping)
                  .filter(([_, v]) => !v)
                  .map(([key, _]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2">
                      <span className="text-[10px] text-slate-600 font-semibold">
                        {fieldLabels[key] || key}
                      </span>
                      <span className="text-[10px] text-slate-700 font-medium italic">— Not mapped</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {item.errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-300 font-semibold">{item.errorMessage}</p>
            </div>
          )}

          {/* Security notice */}
          <div className="text-[9px] text-slate-600 font-medium border-t border-slate-800 pt-3">
            Import ID: {item.id} · This report is read-only and stored in the audit log.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Import Errors Modal ────────────────────────────────────────────────────

const ERROR_CODE_STYLES: Record<string, string> = {
  MISSING_NAME:  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  INVALID_NAME:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  DUPLICATE:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CHUNK_FAILED:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function ImportErrorsModal({ item, onClose }: { item: ImportHistoryItem; onClose: () => void }) {
  const [data, setData] = useState<ImportErrorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterCode, setFilterCode] = useState("");
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());
  const [selectAllGlobally, setSelectAllGlobally] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<number | null>(null);

  const fetchErrors = async (p = 1, code = filterCode) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "50" });
      if (code) params.set("errorCode", code);
      const res = await apiClient.get(`/import/${item.id}/errors?${params}`);
      if (res.data.success) {
        setData(res.data.data);
        setPage(p);
        setSelectedErrors(new Set()); // Clear selection on page change
        setSelectAllGlobally(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchErrors(1, ""); }, []);

  const handleFilter = (code: string) => {
    const next = filterCode === code ? "" : code;
    setFilterCode(next);
    fetchErrors(1, next);
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectAllGlobally || selectedErrors.size > 0) {
      setSelectAllGlobally(false);
      setSelectedErrors(new Set());
    } else {
      setSelectAllGlobally(true);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectAllGlobally) {
      setSelectAllGlobally(false);
      const next = new Set(data?.items.map((i) => i.id) || []);
      next.delete(id);
      setSelectedErrors(next);
    } else {
      const next = new Set(selectedErrors);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedErrors(next);
    }
  };

  const handleForceSync = async () => {
    if (!selectAllGlobally && selectedErrors.size === 0) return;
    setSyncing(true);
    setSyncSuccess(null);
    try {
      const res = await apiClient.post(`/import/${item.id}/force-sync`, {
        errorIds: selectAllGlobally ? [] : Array.from(selectedErrors),
        forceSyncAll: selectAllGlobally,
        filterCode: selectAllGlobally ? filterCode : undefined,
      });
      if (res.data.success) {
        setSyncSuccess(res.data.data.forceSynced);
        fetchErrors(page);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Force sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-black text-white">Row-Level Import Errors</h2>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[400px]" title={item.fileName}>
              {item.fileName} · {item.failedRecords.toLocaleString()} failed rows
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {data && data.items.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white text-[10px] font-black text-slate-300 uppercase tracking-wider transition-colors cursor-pointer"
              >
                {selectAllGlobally || selectedErrors.size > 0 ? "Deselect All" : `Select All ${data.total.toLocaleString()}`}
              </button>
            )}
            
            {(selectAllGlobally || selectedErrors.size > 0) && (
              <button
                onClick={handleForceSync}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-[10px] font-black tracking-wider uppercase shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Force Sync ({selectAllGlobally ? data?.total.toLocaleString() : selectedErrors.size})
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {syncSuccess !== null && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-emerald-300 font-bold">Successfully synced {syncSuccess} records!</p>
                <p className="text-[9px] text-emerald-400/80 mt-0.5">They have been added to the database and removed from this error log.</p>
              </div>
            </div>
          )}

          {/* Breakdown pills */}
          {data && data.breakdown.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider self-center">
                <Filter className="w-3 h-3 inline mr-1" />Filter:
              </span>
              {data.breakdown.map((b) => (
                <button
                  key={b.code}
                  onClick={() => handleFilter(b.code)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                    filterCode === b.code
                      ? (ERROR_CODE_STYLES[b.code] || "bg-slate-700 text-white border-slate-600") + " ring-1 ring-white/20"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  {b.code} ({b.count.toLocaleString()})
                </button>
              ))}
              {filterCode && (
                <button
                  onClick={() => handleFilter("")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-slate-800 text-slate-500 border-slate-700 hover:text-white cursor-pointer"
                >
                  Clear ✕
                </button>
              )}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-xs font-bold">Loading errors…</p>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <BadgeCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-black text-white">No errors found{filterCode ? ` for ${filterCode}` : ""}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectAllGlobally || (data.items.length > 0 && selectedErrors.size === data.items.length)}
                        onChange={toggleSelectAll}
                        className="rounded bg-slate-900 border-slate-700 text-royal focus:ring-royal/50"
                      />
                    </th>
                    {["Row #", "Error Code", "Message", "Raw Data"].map((col) => (
                      <th key={col} className="py-3 px-4 text-[9px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {data.items.map((err) => (
                    <tr key={err.id} className={`hover:bg-slate-800/30 transition-colors ${selectAllGlobally || selectedErrors.has(err.id) ? "bg-slate-800/20" : ""}`}>
                      <td className="py-2.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectAllGlobally || selectedErrors.has(err.id)}
                          onChange={() => toggleSelect(err.id)}
                          className="rounded bg-slate-900 border-slate-700 text-royal focus:ring-royal/50"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-[10px] font-black text-slate-300 whitespace-nowrap">
                        #{err.rowNumber}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black border ${
                          ERROR_CODE_STYLES[err.errorCode] || "bg-slate-700/40 text-slate-400 border-slate-600/30"
                        }`}>
                          {err.errorCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[10px] text-slate-300 font-medium max-w-[260px]">
                        <span className="line-clamp-2" title={err.errorMessage}>{err.errorMessage}</span>
                      </td>
                      <td className="py-2.5 px-4 text-[10px] font-mono text-slate-500 max-w-[200px]">
                        {err.rawData ? (
                          <span className="truncate block" title={err.rawData}>{err.rawData}</span>
                        ) : (
                          <span className="text-slate-700 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] text-slate-500 font-semibold">
                Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} errors
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchErrors(page - 1)}
                  disabled={page <= 1}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => fetchErrors(page + 1)}
                  disabled={page >= (data?.totalPages ?? 1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <p className="text-[9px] text-slate-700 font-medium border-t border-slate-800 pt-3">
            Import ID: {item.id} · Row errors are stored securely and never expose system internals.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminImportHistoryPage() {
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ImportHistoryItem | null>(null);
  const [errorItem, setErrorItem] = useState<ImportHistoryItem | null>(null);
  const LIMIT = 20;

  const fetchHistory = async (p = page) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/import/history?page=${p}&limit=${LIMIT}`);
      if (res.data.success) {
        setHistory(res.data.data.items);
        setTotalPages(res.data.data.totalPages);
        setTotal(res.data.data.total);
        setPage(p);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-royal selection:text-white">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <AdminHeader />

        <main className="flex-1 p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <History className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Import History</h1>
              </div>
              <p className="text-xs text-slate-400 font-medium ml-10 mt-0.5">
                Full audit trail of all bank/NBFC company list imports — read-only
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">{total.toLocaleString()} total imports</span>
              <button
                onClick={() => fetchHistory(page)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <a
                href="/import"
                className="px-4 py-2 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                New Import
              </a>
            </div>
          </div>

          {/* Summary stats */}
          {!loading && history.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Imports",
                  value: total,
                  icon: <History className="w-4 h-4 text-purple-400" />,
                },
                {
                  label: "Completed",
                  value: history.filter((h) => h.status === "COMPLETED").length,
                  icon: <BadgeCheck className="w-4 h-4 text-emerald-400" />,
                },
                {
                  label: "Processing",
                  value: history.filter((h) => h.status === "PROCESSING").length,
                  icon: <Loader2 className="w-4 h-4 text-amber-400" />,
                },
                {
                  label: "Failed",
                  value: history.filter((h) => h.status === "FAILED").length,
                  icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{stat.value}</p>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-xs font-bold">Loading import history…</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                <History className="w-12 h-12 text-slate-700" />
                <p className="text-sm font-black">No imports recorded yet</p>
                <p className="text-xs font-medium text-slate-600">
                  Complete your first import to see it here
                </p>
                <a
                  href="/import"
                  className="mt-2 px-4 py-2 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black transition-colors"
                >
                  Start First Import
                </a>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse enterprise-table">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800">
                        {[
                          "Date & Time",
                          "File",
                          "Bank / NBFC",
                          "Admin",
                          "Mode",
                          "Total",
                          "Imported",
                          "Skipped",
                          "Failed",
                          "Status",
                          "Report",
                        ].map((col) => (
                          <th
                            key={col}
                            className="py-3.5 px-4 text-[9px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {history.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-300">
                                  {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                                <p className="text-[9px] text-slate-600 font-mono">
                                  {new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* File */}
                          <td className="py-3.5 px-4 max-w-[180px]">
                            <div className="flex items-center gap-1.5">
                              <FileSpreadsheet className="w-3 h-3 text-blue-500 shrink-0" />
                              <span
                                className="text-[10px] font-bold text-slate-200 truncate"
                                title={item.fileName}
                              >
                                {item.fileName}
                              </span>
                            </div>
                          </td>

                          {/* Bank */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-200">{item.bankName}</p>
                                <p className="text-[9px] text-slate-600 font-semibold">{item.bankCode} · {item.bankType}</p>
                              </div>
                            </div>
                          </td>

                          {/* Admin */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-600 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-300">{item.createdByName}</p>
                                <p className="text-[9px] text-slate-600 font-medium truncate max-w-[120px]">{item.createdByEmail}</p>
                              </div>
                            </div>
                          </td>

                          {/* Mode */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <ModeBadge mode={item.importType} />
                          </td>

                          {/* Stats */}
                          <td className="py-3.5 px-4 text-[10px] font-bold text-white whitespace-nowrap">
                            {item.totalRecords?.toLocaleString() ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-[10px] font-bold text-emerald-400 whitespace-nowrap">
                            {item.processedRecords?.toLocaleString() ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-[10px] font-bold text-amber-400 whitespace-nowrap">
                            {item.skippedRecords?.toLocaleString() ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-[10px] font-bold text-rose-400 whitespace-nowrap">
                            {item.failedRecords?.toLocaleString() ?? 0}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>

                          {/* Report */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                              {item.failedRecords > 0 && (
                                <button
                                  onClick={() => setErrorItem(item)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 text-[10px] font-bold border border-rose-800/40 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {item.failedRecords.toLocaleString()} Errors
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/40">
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Page {page} of {totalPages} · {total} records
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchHistory(page - 1)}
                        disabled={page <= 1}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                        return (
                          <button
                            key={p}
                            onClick={() => fetchHistory(p)}
                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${
                              p === page
                                ? "bg-royal text-white"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => fetchHistory(page + 1)}
                        disabled={page >= totalPages}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Report Modal */}
      {selectedItem && (
        <ReportModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Import Errors Modal */}
      {errorItem && (
        <ImportErrorsModal item={errorItem} onClose={() => setErrorItem(null)} />
      )}
    </div>
  );
}
