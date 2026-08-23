"use client";

import { useEffect, useState } from "react";
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
  Eye,
  Database,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDate } from "@/lib/utils";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { Modal } from "@/components/ui/Modal";

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

export default function ImportHistoryPage() {
  const [items, setItems] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Error Drawer State
  const [selectedJob, setSelectedJob] = useState<ImportHistoryItem | null>(null);
  const [errorData, setErrorData] = useState<ImportErrorsData | null>(null);
  const [errorPage, setErrorPage] = useState(1);
  const [loadingErrors, setLoadingErrors] = useState(false);

  const fetchHistory = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.append("status", statusFilter);

      const res = await apiClient.get(`/admin/import/history?${params.toString()}`);
      if (res.data?.success && res.data.data) {
        setItems(res.data.data.items || []);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalCount(res.data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load import history", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter]);

  const openErrorModal = async (job: ImportHistoryItem, ePage = 1) => {
    setSelectedJob(job);
    setErrorPage(ePage);
    setLoadingErrors(true);
    try {
      const res = await apiClient.get(
        `/admin/import/jobs/${job.id}/errors?page=${ePage}&limit=10`
      );
      if (res.data?.success && res.data.data) {
        setErrorData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load job errors", err);
    } finally {
      setLoadingErrors(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Data Ingestion Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Complete historical log of Excel &amp; CSV batch uploads, error forensics, and user actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchHistory}
            disabled={refreshing}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync History</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Filter Status:</span>
          {(["", "COMPLETED", "FAILED", "PROCESSING"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {st === "" ? "All Jobs" : st}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-slate-500">
          Total Ingestion Sessions: {totalCount}
        </span>
      </div>

      {/* ── Table Container ──────────────────────────────────── */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={6} />
      ) : items.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <History className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No batch ingestion records found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter
              ? "No jobs match the selected filter."
              : "Historical jobs will populate here when spreadsheets are ingested."}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job / File Name</th>
                  <th>Target Lender</th>
                  <th>Status</th>
                  <th>Metrics (Total / OK / Skip / Fail)</th>
                  <th>Operator</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block truncate max-w-xs">
                          {job.fileName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                          {job.bankName || "Master Ingestion"}
                        </span>
                        {job.bankCode && (
                          <span className="text-[10px] font-mono text-blue-400 font-bold">
                            {job.bankCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          job.status === "COMPLETED"
                            ? "badge-emerald"
                            : job.status === "PROCESSING"
                            ? "badge-amber"
                            : "badge-rose"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-xs font-mono font-bold">
                        <span className="text-slate-200">{job.totalRecords}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-emerald-400">{job.processedRecords}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-amber-400">{job.skippedRecords}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-rose-400">{job.failedRecords}</span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-300 block">
                          {job.createdByName || "Admin User"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {job.createdByEmail}
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      {job.failedRecords > 0 && (
                        <button
                          onClick={() => openErrorModal(job, 1)}
                          className="btn-secondary h-8 px-3 text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5 text-rose-400" />
                          <span>View Errors ({job.failedRecords})</span>
                        </button>
                      )}
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

      {/* ── Error Breakdown Modal ────────────────────────────── */}
      {selectedJob && (
        <Modal
          open={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          title={`Ingestion Errors: ${selectedJob.fileName}`}
          description={`Lender: ${selectedJob.bankName} • ${selectedJob.failedRecords} rows failed`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {loadingErrors ? (
              <p className="text-xs text-slate-400 text-center py-10">
                Loading error forensics...
              </p>
            ) : !errorData || errorData.items.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">
                No specific row-level error entries logged for this job.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {errorData.items.map((err) => (
                  <div
                    key={err.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-rose-400">
                        Row #{err.rowNumber} — {err.errorCode}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {err.columnName || "General Row Error"}
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium">{err.errorMessage}</p>
                    {err.rawData && (
                      <pre className="p-2 rounded bg-black/40 text-[10px] font-mono text-slate-400 overflow-x-auto">
                        {err.rawData}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                onClick={() => setSelectedJob(null)}
                className="btn-primary h-10 px-5 text-xs font-bold"
              >
                Close Forensics
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
