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
  ChevronRight,
  Brain,
  ShieldCheck,
  Eye,
  TriangleAlert,
  RefreshCw,
  Info,
  ChevronDown,
  ArrowRight,
  X,
  Database,
  BadgeCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  company_name: string;
  category: string;
  status: string;
  cin: string;
  remarks: string;
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

// ─── Target field display metadata ───────────────────────────────────────────

const TARGET_FIELDS: { key: keyof ConfirmedMapping; label: string; required: boolean; icon: string }[] = [
  { key: "company_name", label: "Company Name", required: true, icon: "🏢" },
  { key: "category", label: "Category / Tier", required: false, icon: "🏷️" },
  { key: "status", label: "Approval Status", required: false, icon: "✅" },
  { key: "cin", label: "CIN / Reg. No.", required: false, icon: "🪪" },
  { key: "remarks", label: "Remarks / Notes", required: false, icon: "📝" },
];

// ─── Confidence helper ────────────────────────────────────────────────────────

function confidenceColor(conf: number): string {
  if (conf >= 85) return "text-emerald-400";
  if (conf >= 60) return "text-amber-400";
  return "text-rose-400";
}

function confidenceBg(conf: number): string {
  if (conf >= 85) return "bg-emerald-400";
  if (conf >= 60) return "bg-amber-400";
  return "bg-rose-400";
}

function confidenceBorder(conf: number): string {
  if (conf >= 85) return "border-emerald-500/30";
  if (conf >= 60) return "border-amber-500/30";
  return "border-rose-500/30";
}

// ─── Step Progress Indicator ──────────────────────────────────────────────────

const STEPS = [
  { id: "upload", label: "Upload" },
  { id: "analyzing", label: "Analyze" },
  { id: "mapping", label: "Review" },
  { id: "importing", label: "Import" },
  { id: "result", label: "Report" },
];

function StepIndicator({ current }: { current: WizardStep }) {
  const stepIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isCompleted = i < stepIndex;
        const isCurrent = i === stepIndex;
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 ${
                isCompleted
                  ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                  : isCurrent
                  ? "bg-blue-50 dark:bg-royal/20 text-royal border border-blue-200 dark:border-royal/40"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-600 border border-slate-200 dark:border-slate-800"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black ${isCurrent ? "bg-royal text-white" : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-500"}`}>
                  {i + 1}
                </span>
              )}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px mx-1 ${i < stepIndex ? "bg-emerald-400 dark:bg-emerald-500/40" : "bg-slate-200 dark:bg-slate-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminImportPage() {
  // ── Core state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>("upload");
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [importType, setImportType] = useState<"MERGE" | "REPLACE">("MERGE");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── Analyze phase state ───────────────────────────────────────────────────
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // ── Mapping override state ────────────────────────────────────────────────
  const [confirmedMapping, setConfirmedMapping] = useState<ConfirmedMapping>({
    company_name: "",
    category: "",
    status: "",
    cin: "",
    remarks: "",
  });

  // ── Import phase state ────────────────────────────────────────────────────
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Final result ──────────────────────────────────────────────────────────
  const [importError, setImportError] = useState<string | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load banks ────────────────────────────────────────────────────────────
  const fetchBanks = async () => {
    try {
      const res = await apiClient.get("/admin/banks");
      if (res.data.success) {
        setBanks(res.data.data);
        if (res.data.data.length > 0 && !selectedBankId) {
          setSelectedBankId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch banks:", err);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // ── File drag & drop handlers ─────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelected(dropped);
  }, []);

  const handleFileSelected = (f: File) => {
    setFile(f);
    setAnalyzeError(null);
    setAnalyzeResult(null);
  };

  // ── Phase 1: Analyze ──────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file || !selectedBankId) return;
    setStep("analyzing");
    setAnalyzeError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bankId", selectedBankId);

    try {
      const res = await importApiClient.post("/import/analyze", formData);

      if (res.data.success) {
        const result: AnalyzeResponse = res.data.data;
        setAnalyzeResult(result);

        // Initialize confirmed mapping from AI suggestion
        setConfirmedMapping({
          company_name: result.aiMapping.mapping.company_name || "",
          category: result.aiMapping.mapping.category || "",
          status: result.aiMapping.mapping.status || "",
          cin: result.aiMapping.mapping.cin || "",
          remarks: result.aiMapping.mapping.remarks || "",
        });

        setStep("mapping");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "File analysis failed";
      setAnalyzeError(msg);
      setStep("upload");
    }
  };

  // ── Phase 2: Start import ─────────────────────────────────────────────────
  const handleConfirmImport = async () => {
    if (!analyzeResult) return;
    setShowConfirmModal(false);
    setStep("importing");
    setImportError(null);

    try {
      const res = await apiClient.post("/import/confirm", {
        sessionId: analyzeResult.sessionId,
        bankId: selectedBankId,
        importType,
        confirmedMapping,
      });

      if (res.data.success) {
        const hId = res.data.data.historyId;
        setHistoryId(hId);

        // Start polling for progress (every 1 second for fast UI response)
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await apiClient.get(`/import/status/${hId}`);
            if (statusRes.data.success) {
              const s: ImportStatus = statusRes.data.data;
              setImportStatus(s);
              if (s.status === "COMPLETED" || s.status === "FAILED") {
                if (pollRef.current) clearInterval(pollRef.current);
                setStep("result");
                if (s.status === "FAILED") {
                  setImportError(s.errorMessage || "Import failed unexpectedly.");
                }
              }
            }
          } catch (e) {
            // Polling errors are non-fatal — keep trying
          }
        }, 1000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to start import";
      setImportError(msg);
      setStep("result");
    }
  };

  // ── Cleanup polling on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setAnalyzeResult(null);
    setAnalyzeError(null);
    setImportStatus(null);
    setHistoryId(null);
    setImportError(null);
    setShowConfirmModal(false);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedBank = banks.find((b) => b.id === selectedBankId);
  const isMappingReady = !!confirmedMapping.company_name;
  const schema = analyzeResult?.schema;
  const aiMapping = analyzeResult?.aiMapping;
  const allColumns = schema?.columns.map((c) => c.header) || [];

  // Preview rows: apply confirmed mapping to sample rows
  const previewRows = (schema?.sampleRows || []).map((row) => ({
    company_name: confirmedMapping.company_name ? row[confirmedMapping.company_name] || "" : "",
    category: confirmedMapping.category ? row[confirmedMapping.category] || "" : "",
    status: confirmedMapping.status ? row[confirmedMapping.status] || "" : "",
    cin: confirmedMapping.cin ? row[confirmedMapping.cin] || "" : "",
    remarks: confirmedMapping.remarks ? row[confirmedMapping.remarks] || "" : "",
  }));

  const validMapped = TARGET_FIELDS.filter((f) => confirmedMapping[f.key]).length;
  const overallStatus = !isMappingReady ? "ERROR" : (aiMapping?.warnings?.length || 0) > 0 ? "WARNING" : "READY";

  const importProgress =
    importStatus && importStatus.totalRecords > 0
      ? Math.round((importStatus.processedRecords / importStatus.totalRecords) * 100)
      : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Structured Data Import</h1>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wider">
              Admin Verification
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium ml-10">
            Automated Excel / CSV import with column mapping verification before committing records to database
          </p>
        </div>
        <StepIndicator current={step} />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          STEP: UPLOAD
      ════════════════════════════════════════════════════════════════ */}
      {step === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Upload form */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <Upload className="w-4 h-4 text-royal" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Upload Spreadsheet</h2>
              </div>

              {analyzeError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-rose-600 dark:text-rose-400 mb-1">Analysis Failed</p>
                    <p>{analyzeError}</p>
                  </div>
                </div>
              )}

              {/* Bank selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" />
                    Target Bank / NBFC *
                  </div>
                  <button type="button" onClick={fetchBanks} className="text-royal hover:text-royal-hover flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${banks.length === 0 ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-royal transition-colors"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) — {b.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Import mode */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Import Mode *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(["MERGE", "REPLACE"] as const).map((mode) => (
                    <div
                      key={mode}
                      onClick={() => setImportType(mode)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                        importType === mode
                          ? mode === "MERGE"
                            ? "border-royal bg-blue-50 dark:bg-royal/10"
                            : "border-rose-600 bg-rose-50 dark:bg-rose-950/20"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span className={`font-extrabold text-xs ${importType === mode ? (mode === "MERGE" ? "text-royal" : "text-rose-600 dark:text-rose-400") : "text-slate-900 dark:text-white"}`}>
                        {mode === "MERGE" ? "MERGE" : "⚠ REPLACE"} Mode
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {mode === "MERGE"
                          ? "Safely upserts records. Existing data is preserved."
                          : "Deletes ALL existing records for this bank before importing."}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* File dropzone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Select Spreadsheet File *
                </label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-royal bg-royal/10 scale-[1.01]"
                      : file
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelected(f);
                    }}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${file ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-blue-50 dark:bg-royal/20 text-royal"}`}>
                      {file ? <CheckCircle2 className="w-6 h-6" /> : <FileSpreadsheet className="w-6 h-6" />}
                    </div>
                    {file ? (
                      <>
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{file.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB — Click to change
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-300">Drop file here or click to browse</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          .xlsx · .xls · .csv · Up to 50MB · 200,000 rows
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!file || !selectedBankId}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Parse &amp; Analyze Schema
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Info panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Security notice */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Security Guarantees</h3>
              </div>
              <div className="space-y-2">
                {[
                  { icon: "🤖", text: "AI sees only column headers and 5 sample rows — not the full file" },
                  { icon: "🔒", text: "AI cannot access the database or execute any commands" },
                  { icon: "👁️", text: "Preview is read-only — no editing before import" },
                  { icon: "✋", text: "Admin must explicitly confirm before any data is written" },
                  { icon: "📋", text: "Every import creates a permanent audit log entry" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    <span className="text-xs mt-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported formats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Supported Formats</h3>
              </div>
              <div className="space-y-2">
                {[
                  { bank: "ICICI", cols: "Company Name, Category (Superprime/Elite/Preferred)" },
                  { bank: "ABFL", cols: "Company Name, A/B/C category" },
                  { bank: "HDFC", cols: "Corporate Name, Policy Tier" },
                  { bank: "Generic CSV", cols: "Any company list with headers" },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-royal mt-1.5 shrink-0" />
                    <div className="text-[10px]">
                      <span className="font-black text-slate-800 dark:text-slate-300">{f.bank}:</span>{" "}
                      <span className="text-slate-500">{f.cols}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">How It Works</h3>
              </div>
              {["Upload your file", "AI maps column headers", "You review & adjust mapping", "Confirm to import to production"].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-black text-slate-600 dark:text-slate-400 shrink-0">{i + 1}</div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

          {/* ════════════════════════════════════════════════════════════════
              STEP: ANALYZING
          ════════════════════════════════════════════════════════════════ */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-bold text-slate-900 dark:text-white">Analyzing Spreadsheet Structure</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Parsing column headers, validating schema rules, and building field mapping preview.
                </p>
                {file && (
                  <p className="text-xs text-slate-500 font-mono">
                    {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                Validating dataset rows...
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP: MAPPING
          ════════════════════════════════════════════════════════════════ */}
          {step === "mapping" && analyzeResult && schema && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── LEFT: Mapping panel ─────────────────────────────────── */}
                <div className="lg:col-span-5 space-y-4">
                  {/* File info card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-md space-y-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">File Analysis</h3>
                      {aiMapping?.usedFallback && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                          Rule-Based
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "File", value: schema.fileName.length > 24 ? schema.fileName.substring(0, 24) + "…" : schema.fileName },
                        { label: "Sheet", value: schema.sheetName },
                        { label: "Total Rows", value: analyzeResult.rowCount.toLocaleString() },
                        { label: "Columns", value: schema.columnCount },
                        { label: "Valid Rows", value: analyzeResult.validRows.toLocaleString(), color: "text-emerald-600 dark:text-emerald-400" },
                        { label: "Duplicates (file)", value: analyzeResult.fileDuplicates.toLocaleString(), color: "text-amber-600 dark:text-amber-400" },
                      ].map((item) => (
                        <div key={item.label} className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-2.5 border border-slate-100 dark:border-slate-900">
                          <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{item.label}</p>
                          <p className={`text-xs font-extrabold mt-0.5 truncate ${(item as any).color || "text-slate-900 dark:text-white"}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Mapping */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-md space-y-4">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Column Mapping</h3>
                    </div>

                    {aiMapping?.usedFallback && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2">
                        <TriangleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold">
                          AI unavailable — rule-based mapping applied. Please verify each column below.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {TARGET_FIELDS.map((field) => {
                        const suggestedCol = confirmedMapping[field.key];
                        const conf = aiMapping?.confidence?.[field.key] ?? 0;
                        const needsReview = conf < 75 && conf > 0;
                        const notMapped = !suggestedCol;

                        return (
                          <div
                            key={field.key}
                            className={`p-3 rounded-xl border space-y-2 transition-all ${
                              notMapped && field.required
                                ? "border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/20"
                                : notMapped
                                ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60"
                                : needsReview
                                ? "border-amber-300 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/10"
                                : "border-emerald-300 dark:border-emerald-700/30 bg-emerald-50 dark:bg-emerald-950/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">{field.icon}</span>
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <span className="text-rose-500 text-[10px] font-black">*</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {needsReview && suggestedCol && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                    NEEDS REVIEW
                                  </span>
                                )}
                                {notMapped && field.required && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                                    REQUIRED
                                  </span>
                                )}
                                {suggestedCol && conf > 0 && (
                                  <span className={`text-[9px] font-black ${confidenceColor(conf)}`}>
                                    {conf}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Confidence bar */}
                            {suggestedCol && conf > 0 && (
                              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-0.5">
                                <div
                                  className={`h-full rounded-full transition-all ${confidenceBg(conf)}`}
                                  style={{ width: `${conf}%` }}
                                />
                              </div>
                            )}

                            {/* Column selector dropdown */}
                            <select
                              value={confirmedMapping[field.key]}
                              onChange={(e) =>
                                setConfirmedMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                              }
                              className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] font-semibold focus:outline-none focus:border-royal transition-colors"
                            >
                              <option value="">— Not mapped —</option>
                              {allColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Warnings */}
                  {(aiMapping?.warnings?.length || 0) > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40 space-y-2">
                      <div className="flex items-center gap-2">
                        <TriangleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <h4 className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Warnings</h4>
                      </div>
                      <ul className="space-y-1">
                        {aiMapping!.warnings.map((w, i) => (
                          <li key={i} className="text-[10px] text-amber-900/80 dark:text-amber-300/80 font-medium flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Start Over
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!isMappingReady}
                      className="flex-1 h-10 rounded-xl bg-royal hover:bg-royal-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs shadow-lg shadow-royal/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Review &amp; Import
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── RIGHT: Read-only Preview ───────────────────────────── */}
                <div className="lg:col-span-7">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md overflow-hidden h-full flex flex-col">
                    {/* Preview header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Import Preview
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          READ-ONLY
                        </span>
                      </div>
                      {/* Status badge */}
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                          overallStatus === "READY"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : overallStatus === "WARNING"
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                        }`}
                      >
                        {overallStatus === "READY" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : overallStatus === "WARNING" ? (
                          <TriangleAlert className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {overallStatus}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                      {[
                        { label: "Total Rows", value: analyzeResult.rowCount.toLocaleString(), color: "text-slate-900 dark:text-white" },
                        { label: "Valid", value: analyzeResult.validRows.toLocaleString(), color: "text-emerald-600 dark:text-emerald-400" },
                        { label: "Invalid", value: analyzeResult.invalidRows.toLocaleString(), color: "text-rose-600 dark:text-rose-400" },
                        { label: "Duplicates", value: analyzeResult.fileDuplicates.toLocaleString(), color: "text-amber-600 dark:text-amber-400" },
                      ].map((stat) => (
                        <div key={stat.label} className="px-4 py-3 text-center">
                          <p className={`text-base font-black ${stat.color}`}>{stat.value}</p>
                          <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Mapped columns summary */}
                    <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                        Mapped:
                      </span>
                      {TARGET_FIELDS.map((field) => (
                        <span
                          key={field.key}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            confirmedMapping[field.key]
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-transparent"
                              : field.required
                              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-transparent"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500"
                          }`}
                        >
                          {field.label} {confirmedMapping[field.key] ? "✓" : "—"}
                        </span>
                      ))}
                    </div>

                    {/* Sample data table — read-only */}
                    {!isMappingReady ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-6">
                        <AlertCircle className="w-10 h-10 text-rose-500/40 mb-3" />
                        <p className="text-sm font-bold text-slate-500">Company Name column not mapped</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                          Select the correct column for Company Name to see the preview
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-[10px] border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                              <th className="px-4 py-2.5 text-slate-500 font-black uppercase tracking-wider whitespace-nowrap">#</th>
                              {TARGET_FIELDS.filter((f) => confirmedMapping[f.key]).map((f) => (
                                <th
                                  key={f.key}
                                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-black uppercase tracking-wider whitespace-nowrap"
                                >
                                  <div className="flex items-center gap-1">
                                    <span>{f.icon}</span>
                                    {f.label}
                                  </div>
                                  <div className="text-[8px] text-slate-400 dark:text-slate-600 font-semibold normal-case tracking-normal mt-0.5">
                                    ← {confirmedMapping[f.key]}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-900/80">
                            {previewRows.length === 0 ? (
                              <tr>
                                <td colSpan={99} className="text-center py-8 text-slate-400 font-semibold">
                                  No sample rows available
                                </td>
                              </tr>
                            ) : (
                              previewRows.map((row, i) => (
                                <tr
                                  key={i}
                                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <td className="px-4 py-2.5 text-slate-400 font-mono">{i + 1}</td>
                                  {TARGET_FIELDS.filter((f) => confirmedMapping[f.key]).map((f) => (
                                    <td key={f.key} className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-300 max-w-[200px] truncate" title={row[f.key]}>
                                      {row[f.key] || <span className="text-slate-400 dark:text-slate-700 italic">—</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                          <p className="text-[9px] text-slate-500 font-medium">
                            Showing {Math.min(previewRows.length, 10)} sample rows of {analyzeResult.rowCount.toLocaleString()} total · Read-only preview
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Confirm Import Modal ──────────────────────────────────── */}
              {showConfirmModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md space-y-6 p-6 sm:p-8 animate-slow-fade">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Import Summary</h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Review before writing to production database</p>
                      </div>
                      <button
                        onClick={() => setShowConfirmModal(false)}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Summary stats */}
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-800">
                      {[
                        { label: "File", value: schema.fileName },
                        { label: "Bank", value: selectedBank?.name || "—" },
                        { label: "Mode", value: importType, highlight: importType === "REPLACE" ? "rose" : "blue" },
                        { label: "Total Rows", value: analyzeResult.rowCount.toLocaleString() },
                        { label: "Valid Rows", value: analyzeResult.validRows.toLocaleString(), color: "text-emerald-600 dark:text-emerald-400" },
                        { label: "Invalid / Skip", value: (analyzeResult.invalidRows + analyzeResult.fileDuplicates).toLocaleString(), color: "text-amber-600 dark:text-amber-400" },
                        { label: "Mapped Columns", value: `${validMapped} / ${TARGET_FIELDS.length}` },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-semibold">{item.label}</span>
                          <span className={`text-[10px] font-black ${(item as any).color || "text-slate-900 dark:text-white"} max-w-[200px] truncate text-right`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Warning */}
                    <div className={`p-4 rounded-xl border flex items-start gap-2 ${importType === "REPLACE" ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-700" : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700/50"}`}>
                      <TriangleAlert className={`w-4 h-4 shrink-0 mt-0.5 ${importType === "REPLACE" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`} />
                      <div>
                        <p className={`text-xs font-black mb-1 ${importType === "REPLACE" ? "text-rose-600 dark:text-rose-400" : "text-amber-800 dark:text-amber-400"}`}>
                          {importType === "REPLACE" ? "⚠ REPLACE MODE — All existing records will be deleted" : "This will modify PRODUCTION data"}
                        </p>
                        <p className={`text-[10px] font-medium ${importType === "REPLACE" ? "text-rose-800/80 dark:text-rose-300/70" : "text-amber-900/80 dark:text-amber-300/70"}`}>
                          {importType === "REPLACE"
                            ? `All existing ${selectedBank?.name} company mappings will be permanently deleted before importing.`
                            : "Valid records will be upserted. Existing records that match will be updated."}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowConfirmModal(false)}
                        className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmImport}
                        className="flex-1 h-11 rounded-xl bg-royal hover:bg-royal-hover text-white font-black text-xs shadow-lg shadow-royal/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5" />
                        Import Valid Records
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP: IMPORTING (Progress)
          ════════════════════════════════════════════════════════════════ */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-20 space-y-10">
              {/* Stage indicators */}
              <div className="flex items-center gap-2">
                {["Validating", "Normalizing", "Importing", "Completing"].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-royal/20 border border-blue-200 dark:border-royal/30 text-[10px] font-black text-royal">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {stage}
                    </div>
                    {i < 3 && <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-700" />}
                  </div>
                ))}
              </div>

              {/* Progress card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 w-full max-w-lg space-y-6 text-center shadow-sm dark:shadow-2xl">
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                    {importStatus ? `${importProgress}%` : "Starting…"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {selectedBank?.name} · {file?.name}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-royal to-blue-400 rounded-full transition-all duration-700"
                      style={{ width: `${importStatus ? importProgress : 5}%` }}
                    />
                  </div>
                  {importStatus && (
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {importStatus.processedRecords.toLocaleString()} / {importStatus.totalRecords.toLocaleString()} rows
                    </p>
                  )}
                </div>

                {importStatus && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Imported", value: importStatus.processedRecords, color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Skipped", value: importStatus.skippedRecords ?? 0, color: "text-amber-600 dark:text-amber-400" },
                      { label: "Failed", value: importStatus.failedRecords, color: "text-rose-600 dark:text-rose-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-850">
                        <p className={`text-lg font-black ${s.color}`}>{s.value.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-500 font-medium">
                  Do not close this tab. Large files may take several minutes.
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP: RESULT
          ════════════════════════════════════════════════════════════════ */}
          {step === "result" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6 max-w-2xl mx-auto w-full">
              {/* Success / Failure header */}
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                  importError || importStatus?.status === "FAILED"
                    ? "bg-rose-50 dark:bg-rose-500/20"
                    : "bg-emerald-50 dark:bg-emerald-500/20"
                }`}
              >
                {importError || importStatus?.status === "FAILED" ? (
                  <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                ) : (
                  <BadgeCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                  {importError || importStatus?.status === "FAILED" ? "Import Failed" : "Import Complete"}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {importError || importStatus?.errorMessage
                    ? importError || importStatus?.errorMessage
                    : `Successfully processed ${importStatus?.totalRecords?.toLocaleString() || 0} rows for ${selectedBank?.name}`}
                </p>
              </div>

              {/* Result stats */}
              {importStatus && (
                <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md overflow-hidden">
                  <div className="grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800">
                    {[
                      { label: "Total", value: importStatus.totalRecords, color: "text-slate-900 dark:text-white" },
                      { label: "Imported", value: importStatus.processedRecords, color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Skipped", value: importStatus.skippedRecords ?? 0, color: "text-amber-600 dark:text-amber-400" },
                      { label: "Failed", value: importStatus.failedRecords, color: "text-rose-600 dark:text-rose-400" },
                    ].map((s) => (
                      <div key={s.label} className="px-4 py-5 text-center">
                        <p className={`text-xl font-black ${s.color}`}>{s.value?.toLocaleString() ?? 0}</p>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit notice */}
              {!importError && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500/60" />
                  Audit log recorded · Import ID: {historyId?.substring(0, 16)}…
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New Import
                </button>
                <a
                  href="/import-history"
                  className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-colors flex items-center gap-2"
                >
                  View Import History
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </main>
  );
}
