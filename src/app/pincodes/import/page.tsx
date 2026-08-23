"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiClient, importApiClient } from "@/services/apiClient";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Brain,
  Eye,
  ArrowRight,
  X,
  Database,
  FileCheck,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import type { Bank } from "@/types";

type WizardStep = "upload" | "analyzing" | "mapping" | "importing" | "result";

interface ColumnInfo {
  index: number;
  header: string;
  dataType: string;
  sampleValues: string[];
  nullCount: number;
  fillRate: number;
}

interface FileSchema {
  fileName: string;
  sheetName: string;
  sheetCount: number;
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  sampleRows: Record<string, string>[];
}

interface AiMappingResult {
  mapping: Record<string, string>;
  confidence: Record<string, number>;
  warnings: string[];
  usedFallback: boolean;
}

interface AnalyzeResponse {
  sessionId: string;
  schema: FileSchema;
  aiMapping: AiMappingResult;
  rowCount: number;
  validRows: number;
  invalidRows: number;
  fileDuplicates: number;
}

interface ConfirmedMapping {
  pincode: string;
  state?: string;
  city?: string;
  area?: string;
  serviceable?: string;
  negative?: string;
  category?: string;
}

interface ImportStatus {
  id: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  errorMessage?: string;
}

const TARGET_FIELDS: { key: keyof ConfirmedMapping; label: string; required: boolean; icon: string }[] = [
  { key: "pincode", label: "Postal Pincode", required: true, icon: "📍" },
  { key: "state", label: "State / UT", required: false, icon: "🗺️" },
  { key: "city", label: "City / District", required: false, icon: "🏙️" },
  { key: "area", label: "Locality / Branch Zone", required: false, icon: "🏘️" },
  { key: "serviceable", label: "Serviceable Flag", required: false, icon: "✅" },
  { key: "negative", label: "Negative / Risk Flag", required: false, icon: "🚫" },
  { key: "category", label: "Zone Category", required: false, icon: "🏷️" },
];

function confidenceColor(conf: number): string {
  if (conf >= 85) return "text-emerald-400";
  if (conf >= 60) return "text-amber-400";
  return "text-rose-400";
}

export default function PincodeImportPage() {
  const { showToast } = useToast();
  const [step, setStep] = useState<WizardStep>("upload");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis State
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Confirmed Column Mappings
  const [confirmedMapping, setConfirmedMapping] = useState<ConfirmedMapping>({
    pincode: "",
    state: "",
    city: "",
    area: "",
    serviceable: "",
    negative: "",
    category: "",
  });

  // Ingestion State
  const [importType, setImportType] = useState<"MERGE" | "REPLACE">("MERGE");
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Banks
  useEffect(() => {
    apiClient
      .get("/admin/banks")
      .then((res) => {
        const list = (res.data?.data || []) as Bank[];
        setBanks(list);
      })
      .catch((err) => console.error("Could not fetch banks", err));
  }, []);

  const handleFileSelected = useCallback((file: File) => {
    const validExts = [".xlsx", ".xls", ".csv"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      setError("Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File exceeds maximum 25 MB limit.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please choose an Excel file.");
      return;
    }
    setError(null);
    setStep("analyzing");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (selectedBankId) formData.append("bankId", selectedBankId);
      formData.append("entityType", "PINCODE");

      const res = await importApiClient.post<{ success: boolean; data: AnalyzeResponse }>(
        "/import/analyze?entityType=PINCODE",
        formData
      );

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setAnalysis(d);

        const initMap: ConfirmedMapping = {
          pincode: d.aiMapping?.mapping?.pincode || "",
          state: d.aiMapping?.mapping?.state || "",
          city: d.aiMapping?.mapping?.city || "",
          area: d.aiMapping?.mapping?.area || "",
          serviceable: d.aiMapping?.mapping?.serviceable || "",
          negative: d.aiMapping?.mapping?.negative || "",
          category: d.aiMapping?.mapping?.category || "",
        };
        setConfirmedMapping(initMap);
        setStep("mapping");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Analysis failed. Ensure file structure is valid.";
      setError(msg);
      setStep("upload");
    }
  };

  const handleExecuteImport = async () => {
    if (!analysis) return;
    if (!confirmedMapping.pincode) {
      setError("You must map the Postal Pincode column before importing.");
      return;
    }
    setError(null);
    setStep("importing");

    try {
      const res = await importApiClient.post<{
        success: boolean;
        data: { historyId?: string; importJobId?: string; status?: string; totalRecords?: number };
      }>("/import/confirm", {
        sessionId: analysis.sessionId,
        bankId: selectedBankId || (banks[0]?.id ?? ""),
        importType,
        entityType: "PINCODE",
        confirmedMapping,
      });

      if (res.data?.success && res.data.data) {
        const jId = res.data.data.historyId || res.data.data.importJobId || "";
        setImportSessionId(jId);
        setImportStatus({
          id: jId,
          status: res.data.data.status || "PROCESSING",
          totalRecords: res.data.data.totalRecords || analysis.validRows,
          processedRecords: 0,
          skippedRecords: 0,
          failedRecords: 0,
        });
        setPollingActive(true);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to initiate ingestion";
      setError(msg);
      setStep("mapping");
    }
  };

  // Poll Ingestion Status
  useEffect(() => {
    if (!pollingActive || !importSessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await importApiClient.get<{ success: boolean; data: ImportStatus }>(
          `/admin/import/status/${importSessionId}`
        );
        if (res.data?.success && res.data.data) {
          const s = res.data.data;
          setImportStatus(s);
          if (["COMPLETED", "FAILED", "PARTIALLY_COMPLETED"].includes(s.status)) {
            setPollingActive(false);
            setStep("result");
            showToast({
              title: s.status === "COMPLETED" ? "Pincode Master Ingested!" : "Finished with Warnings",
              type: s.status === "COMPLETED" ? "success" : "warning",
            });
          }
        }
      } catch (pollErr) {
        console.error("Polling error", pollErr);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [pollingActive, importSessionId, showToast]);

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setAnalysis(null);
    setConfirmedMapping({ pincode: "", state: "", city: "", area: "", serviceable: "", negative: "", category: "" });
    setImportSessionId(null);
    setImportStatus(null);
    setError(null);
  };

  const selectedBank = banks.find((b) => b.id === selectedBankId);

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Pincode Excel Batch Ingestion
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Bulk ingest pan-India postal codes, serviceability flags, negative zones, and branch mappings.
          </p>
        </div>

        <Link href="/pincodes" className="btn-secondary h-10 px-4 text-xs font-bold self-start sm:self-auto">
          <span>Pincode Registry</span>
        </Link>
      </div>

      {/* ── Step Indicator ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "upload", label: "1. Select Pincode File", active: step === "upload" || step === "analyzing" },
          { key: "mapping", label: "2. Postal Schema Mapping", active: step === "mapping" },
          { key: "result", label: "3. Ingestion Progress", active: step === "importing" || step === "result" },
        ].map((s, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border text-center transition-all ${
              s.active
                ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 font-extrabold"
                : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] text-slate-400 font-semibold"
            }`}
          >
            <span className="text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Error Banner ─────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 1: Upload ─────────────────────────────────────── */}
      {step === "upload" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Optional Bank Binding */}
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              Associate with Specific Partner Bank (Optional)
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-[#091024] border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="" className="bg-white dark:bg-[#091024] text-slate-900 dark:text-white">
                Global / Pan-India Master (All Lenders)
              </option>
              {banks.map((b) => (
                <option key={b.id} value={b.id} className="bg-white dark:bg-[#091024] text-slate-900 dark:text-white">
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileSelected(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-card p-12 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all space-y-4 ${
              dragOver
                ? "border-emerald-500 bg-emerald-500/10"
                : selectedFile
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-slate-300 dark:border-white/[0.1] hover:border-emerald-500/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelected(f);
              }}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {selectedFile ? selectedFile.name : "Drag & Drop Pincode Master Sheet"}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {selectedFile
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB — Ready for Schema Detection`
                  : "Supports .xlsx, .xls, and .csv files up to 25 MB"}
              </p>
            </div>

            {selectedFile && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-emerald text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>File Loaded</span>
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              disabled={!selectedFile}
              onClick={handleAnalyze}
              className="btn-primary h-12 px-8 text-sm font-bold disabled:opacity-40"
            >
              <Brain className="w-4 h-4" />
              <span>Inspect Pincode Schema</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── STEP 1.5: Analyzing Loading ──────────────────────── */}
      {step === "analyzing" && (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Analyzing Pincode Layout...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Detecting 6-digit postal headers, state/city taxonomy, and serviceability indicators.
          </p>
        </div>
      )}

      {/* ── STEP 2: Mapping ───────────────────────────────────── */}
      {step === "mapping" && analysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="stat-kpi-card p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                {analysis.rowCount.toLocaleString()}
              </span>
            </div>
            <div className="stat-kpi-card p-4">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Valid Pincodes</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">
                {analysis.validRows.toLocaleString()}
              </span>
            </div>
            <div className="stat-kpi-card p-4">
              <span className="text-[10px] uppercase font-bold text-amber-400">Duplicates</span>
              <span className="text-xl font-black text-amber-400 mt-1 block">
                {analysis.fileDuplicates.toLocaleString()}
              </span>
            </div>
            <div className="stat-kpi-card p-4">
              <span className="text-[10px] uppercase font-bold text-blue-400">Columns</span>
              <span className="text-xl font-black text-blue-400 mt-1 block">
                {analysis.schema.columnCount}
              </span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Pincode Column Mappings
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Confirm target fields for postal database insertion
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="btn-secondary h-9 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPreview ? "Hide Sample Rows" : "View Sample Rows"}</span>
              </button>
            </div>

            {/* ── Sample Rows Preview Table ───────────────────────── */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span className="font-semibold">
                    Showing first {analysis.schema.sampleRows?.length || 0} sample rows from {analysis.rowCount.toLocaleString()} total rows:
                  </span>
                  <span className="text-[11px] font-mono">
                    {analysis.schema.columns.length} columns detected
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#050b18]/80 shadow-inner">
                  <table className="admin-table text-xs w-full">
                    <thead className="bg-slate-100 dark:bg-white/[0.06] sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="w-12 text-center text-slate-400 text-[10px] font-mono">#</th>
                        {analysis.schema.columns.map((c) => {
                          // Check if this column is mapped to any target field
                          const mappedTarget = TARGET_FIELDS.find(
                            (tf) => confirmedMapping[tf.key] === c.header
                          );
                          return (
                            <th key={c.index} className="whitespace-nowrap text-left px-3 py-2.5">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {c.header}
                              </div>
                              {mappedTarget ? (
                                <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                  Mapped: {mappedTarget.label}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {c.fillRate}% filled
                                </span>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {(!analysis.schema.sampleRows || analysis.schema.sampleRows.length === 0) ? (
                        <tr>
                          <td colSpan={analysis.schema.columns.length + 1} className="py-8 text-center text-xs text-slate-400">
                            No preview rows available in uploaded spreadsheet.
                          </td>
                        </tr>
                      ) : (
                        analysis.schema.sampleRows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-blue-500/[0.03] transition-colors">
                            <td className="text-center text-slate-400 font-mono text-[10px] py-2">
                              {i + 1}
                            </td>
                            {analysis.schema.columns.map((c) => {
                              const val = row[c.header];
                              const isMapped = Boolean(
                                Object.values(confirmedMapping).includes(c.header)
                              );
                              return (
                                <td
                                  key={c.index}
                                  className={`px-3 py-2 text-[11px] font-mono whitespace-nowrap ${
                                    isMapped
                                      ? "text-slate-900 dark:text-slate-100 font-bold"
                                      : "text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  {val !== undefined && val !== null && String(val).trim() !== ""
                                    ? String(val)
                                    : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Field Map Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TARGET_FIELDS.map((tf) => {
                const mappedCol = confirmedMapping[tf.key];
                const conf = analysis.aiMapping.confidence[tf.key] || 0;

                return (
                  <div
                    key={tf.key}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{tf.icon}</span>
                        <span>{tf.label}</span>
                        {tf.required && <strong className="text-rose-400 font-bold">*</strong>}
                      </span>
                      {mappedCol && conf > 0 && (
                        <span className={`text-[10px] font-black ${confidenceColor(conf)}`}>
                          {conf}% Match
                        </span>
                      )}
                    </div>

                    <select
                      value={mappedCol || ""}
                      onChange={(e) =>
                        setConfirmedMapping((prev) => ({ ...prev, [tf.key]: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-[#091024] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="" className="bg-white dark:bg-[#091024] text-slate-900 dark:text-white">
                        -- Skip Field --
                      </option>
                      {analysis.schema.columns.map((c) => (
                        <option
                          key={c.index}
                          value={c.header}
                          className="bg-white dark:bg-[#091024] text-slate-900 dark:text-white"
                        >
                          {c.header} ({c.fillRate}% filled)
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* ── Ingestion Strategy (MERGE vs REPLACE) ── */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Ingestion Strategy
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Choose how new postal records interact with existing pincode database tables.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportType("MERGE")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    importType === "MERGE"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                      : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.15]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      importType === "MERGE"
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-slate-400 dark:border-slate-600"
                    }`}
                  >
                    {importType === "MERGE" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Merge &amp; Update (Incremental)</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Default
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                      Upsert newly discovered pincodes and update serviceability flags without deleting existing records.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportType("REPLACE")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    importType === "REPLACE"
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/30"
                      : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.15]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      importType === "REPLACE"
                        ? "border-amber-500 bg-amber-500"
                        : "border-slate-400 dark:border-slate-600"
                    }`}
                  >
                    {importType === "REPLACE" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Full Replacement (Wipe &amp; Replace)</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Destructive
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                      Wipes existing serviceable pincodes for this bank and replaces with this fresh upload.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={handleReset} className="btn-secondary h-12 px-6 text-xs font-bold">
              Choose Another File
            </button>
            <button
              onClick={handleExecuteImport}
              className="btn-primary h-12 px-8 text-sm font-bold"
            >
              <FileCheck className="w-4 h-4" />
              <span>Start Ingesting Pincodes</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── STEP 3: Ingesting ─────────────────────────────────── */}
      {step === "importing" && (
        <div className="py-16 text-center glass-card rounded-3xl p-8 space-y-6">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Indexing Pan-India Postal Zones...
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Updating geospatial bounds and serviceability tables.
            </p>
          </div>

          {importStatus && (
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      importStatus.totalRecords
                        ? Math.min(
                            100,
                            Math.round((importStatus.processedRecords / importStatus.totalRecords) * 100)
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono font-bold text-slate-400">
                <span>{importStatus.processedRecords} Indexed</span>
                <span>{importStatus.totalRecords} Total Records</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 4: Result ────────────────────────────────────── */}
      {step === "result" && importStatus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Pincodes Ingested Successfully
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Serviceability and coverage matrix updated across the platform.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="text-[10px] font-extrabold uppercase block">Processed</span>
              <span className="text-2xl font-black mt-1 block">
                {importStatus.processedRecords.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <span className="text-[10px] font-extrabold uppercase block">Skipped</span>
              <span className="text-2xl font-black mt-1 block">
                {importStatus.skippedRecords.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <span className="text-[10px] font-extrabold uppercase block">Failed</span>
              <span className="text-2xl font-black mt-1 block">
                {importStatus.failedRecords.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
            <button onClick={handleReset} className="btn-secondary h-11 px-6 text-xs font-bold">
              Upload Another Pincode Sheet
            </button>
            <Link href="/pincodes" className="btn-primary h-11 px-6 text-xs font-bold">
              <span>View Pincode Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
