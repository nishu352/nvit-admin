"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/apiClient";
import { useBanksQuery } from "@/hooks/useAdminQueries";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Activity,
  Sliders,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Flame,
  CheckCircle2,
  X,
  FileSpreadsheet,
  MapPin,
  RefreshCw,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  Check,
  Globe,
  Sparkles,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";

export default function AdminBanksPage() {
  const { data: banks = [], isLoading: loading, refetch: fetchBanks } = useBanksQuery();
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);

  // Clear Companies / Pincodes Modal State
  const [clearModalTarget, setClearModalTarget] = useState<any | null>(null);
  const [clearType, setClearType] = useState<"COMPANIES" | "PINCODES">("COMPANIES");
  const [cleanOrphans, setCleanOrphans] = useState(true);
  const [confirmInput, setConfirmInput] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form Fields for Add/Edit
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"BANK" | "NBFC">("BANK");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMode, setLogoMode] = useState<"UPLOAD" | "URL">("UPLOAD");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  // Apply Configuration Fields
  const [applyEnabled, setApplyEnabled] = useState(false);
  const [applyUrl, setApplyUrl] = useState("");
  const [applyUrlError, setApplyUrlError] = useState<string | null>(null);

  const [priority, setPriority] = useState(1);
  const [partnerStatus, setPartnerStatus] = useState("ACTIVE");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [eligibility, setEligibility] = useState("");
  const [processingFee, setProcessingFee] = useState(1.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingBank(null);
    setName("");
    setCode("");
    setType("BANK");
    setLogoUrl("");
    setLogoMode("UPLOAD");
    setLogoUploadError(null);
    setApplyEnabled(false);
    setApplyUrl("");
    setApplyUrlError(null);
    setPriority(1);
    setPartnerStatus("ACTIVE");
    setDisplayOrder(1);
    setEligibility("");
    setProcessingFee(1.0);
    setShowModal(true);
  };

  const openEditModal = (bank: any) => {
    setEditingBank(bank);
    setName(bank.name);
    setCode(bank.code);
    setType(bank.type);
    setLogoUrl(bank.logoUrl || "");
    setLogoMode(bank.logoUrl && bank.logoUrl.startsWith("http") ? "URL" : "UPLOAD");
    setLogoUploadError(null);
    setApplyEnabled(Boolean(bank.applyEnabled));
    setApplyUrl(bank.applyUrl || "");
    setApplyUrlError(null);
    setPriority(bank.priority || 1);
    setPartnerStatus(bank.partnerStatus || "ACTIVE");
    setDisplayOrder(bank.displayOrder || 1);
    setEligibility(bank.eligibility || "");
    setProcessingFee(bank.processingFee || 1.0);
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadError(null);
    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post("/admin/banks/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.success && res.data.url) {
        setLogoUrl(res.data.url);
      } else {
        setLogoUploadError(res.data?.message || "Failed to upload logo");
      }
    } catch (err: any) {
      setLogoUploadError(err.response?.data?.message || err.message || "Failed to upload file");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const validateUrlFormat = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    return trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyUrlError(null);

    // Validate Apply URL when Apply is ON
    if (applyEnabled) {
      if (!applyUrl.trim()) {
        setApplyUrlError("Redirect URL is required when 'Apply for Loan' is enabled.");
        return;
      }
      if (!validateUrlFormat(applyUrl)) {
        setApplyUrlError("Invalid format! Redirect URL must start with https://, http://, or / (e.g. /loan-apply?bank=...)");
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      name,
      code,
      type,
      logoUrl: logoUrl.trim() || null,
      applyEnabled: Boolean(applyEnabled),
      applyUrl: applyEnabled ? applyUrl.trim() : (applyUrl.trim() || null),
      priority: Number(priority),
      partnerStatus,
      displayOrder: Number(displayOrder),
      eligibility,
      processingFee: Number(processingFee),
    };

    try {
      if (editingBank) {
        await apiClient.put(`/admin/banks/${editingBank.id}`, payload);
      } else {
        await apiClient.post("/admin/banks", payload);
      }
      setShowModal(false);
      fetchBanks();
    } catch (err: any) {
      setApplyUrlError(err.response?.data?.message || err.message || "Failed to save bank configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lender? This will purge all associated company classifications and pincodes!")) return;
    try {
      await apiClient.delete(`/admin/banks/${id}`);
      fetchBanks();
    } catch (err) {
      console.error("Failed to delete bank", err);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await apiClient.patch(`/admin/banks/${id}/toggle`);
      fetchBanks();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleToggleApply = async (id: string) => {
    try {
      await apiClient.patch(`/admin/banks/${id}/toggle-apply`);
      fetchBanks();
    } catch (err) {
      console.error("Failed to toggle apply status", err);
    }
  };

  const openClearModal = (bank: any, type: "COMPANIES" | "PINCODES") => {
    setClearModalTarget(bank);
    setClearType(type);
    setConfirmInput("");
    setCleanOrphans(true);
    setActionFeedback(null);
  };

  const handleExecuteWipe = async () => {
    if (!clearModalTarget) return;
    if (confirmInput.trim().toUpperCase() !== clearModalTarget.code.toUpperCase()) {
      alert(`Please type "${clearModalTarget.code}" exactly to confirm deletion.`);
      return;
    }

    setIsClearing(true);
    setActionFeedback(null);

    try {
      if (clearType === "COMPANIES") {
        const res = await apiClient.delete(`/admin/banks/${clearModalTarget.id}/data/companies?cleanOrphans=${cleanOrphans}`);
        setActionFeedback({
          success: true,
          message: `Successfully deleted ${res.data.data.deletedMappings.toLocaleString()} company mappings${
            cleanOrphans ? ` and purged ${res.data.data.deletedOrphans.toLocaleString()} orphaned companies` : ""
          }.`,
        });
      } else {
        const res = await apiClient.delete(`/admin/banks/${clearModalTarget.id}/data/pincodes`);
        setActionFeedback({
          success: true,
          message: `Successfully purged ${res.data.data.deletedPincodes.toLocaleString()} pincode serviceability records.`,
        });
      }
      fetchBanks();
    } catch (err: any) {
      setActionFeedback({
        success: false,
        message: err.response?.data?.message || err.message || "Operation failed",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Partner Banking Institutions</h1>
          <p className="text-xs text-slate-500 font-medium">Manage lender metadata, Apply for Loan buttons, redirect destinations, and master datasets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchBanks()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            title="Refresh Bank Matrix"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Lender</span>
          </button>
        </div>
      </div>

      {loading ? (
        <AdminCardGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank: any) => (
            <div key={bank.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              {/* Card Top */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shrink-0 overflow-hidden">
                      {bank.logoUrl ? (
                        <img src={bank.logoUrl} alt={bank.code} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-xs font-black uppercase font-mono">{bank.code?.slice(0, 3)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight mb-0.5 truncate">{bank.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">CODE: {bank.code} • Priority: {bank.priority || 1}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black border shrink-0 ${
                    bank.type === "BANK"
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                      : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20"
                  }`}>
                    {bank.type}
                  </span>
                </div>

                {/* Apply for Loan Configuration Highlight */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Apply for Loan</span>
                    </div>
                    <button
                      onClick={() => handleToggleApply(bank.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                        bank.applyEnabled
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-750"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${bank.applyEnabled ? "bg-emerald-500" : "bg-slate-400"}`} />
                      <span>{bank.applyEnabled ? "ON" : "OFF"}</span>
                    </button>
                  </div>

                  {bank.applyEnabled && bank.applyUrl && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      <LinkIcon className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">{bank.applyUrl}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                    <span>Partner Status:</span>
                    <span className={`font-black ${
                      bank.partnerStatus === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
                    }`}>{bank.partnerStatus || "ACTIVE"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                    <span>Processing Fee:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{bank.processingFee || 1.0}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5 items-center">
                    <span className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Mapped Companies:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                      {(bank._count?.companyCategories ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Pincode Coverage:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                      {(bank._count?.pincodeServices ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Bottom / Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(bank.id)}
                    className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {bank.isActive ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(bank)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Edit Lender Configuration"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bank.id)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Lender"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specialized Wipe Company & Pincode Data Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => openClearModal(bank, "COMPANIES")}
                    className="h-8 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center text-rose-700 dark:text-rose-300 transition-colors cursor-pointer text-[10px] font-bold gap-1"
                    title="Purge all company categorization mappings for this specific bank"
                  >
                    <Flame className="w-3 h-3 text-rose-500" />
                    <span>Wipe Companies</span>
                  </button>
                  <button
                    onClick={() => openClearModal(bank, "PINCODES")}
                    className="h-8 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 transition-colors cursor-pointer text-[10px] font-bold gap-1"
                    title="Purge all pincode serviceability records for this specific bank"
                  >
                    <Trash2 className="w-3 h-3 text-amber-500" />
                    <span>Wipe Pincodes</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wipe Confirmation Modal */}
      <AnimatePresence>
        {clearModalTarget && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-5 text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h2 className="text-base font-black">
                    Purge {clearType === "COMPANIES" ? "Company Master Data" : "Pincode Master Data"}
                  </h2>
                </div>
                <button
                  onClick={() => setClearModalTarget(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-black text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <span>Target Lender: {clearModalTarget.name}</span>
                  <span className="px-2 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 rounded text-[10px] font-mono">
                    {clearModalTarget.code}
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                  {clearType === "COMPANIES" ? (
                    <>
                      This will delete all <strong>{(clearModalTarget._count?.companyCategories ?? 0).toLocaleString()}</strong> company category mappings for <strong>{clearModalTarget.name}</strong> from the database. Other banks will NOT be affected.
                    </>
                  ) : (
                    <>
                      This will delete all <strong>{(clearModalTarget._count?.pincodeServices ?? 0).toLocaleString()}</strong> pincode serviceability records for <strong>{clearModalTarget.name}</strong>.
                    </>
                  )}
                </p>
              </div>

              {clearType === "COMPANIES" && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cleanOrphans}
                    onChange={(e) => setCleanOrphans(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Clean Orphaned Companies</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Also delete company records that have 0 remaining bank classifications across all lenders.
                    </span>
                  </div>
                </label>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  Type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">{clearModalTarget.code}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={`Type ${clearModalTarget.code} here`}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono uppercase font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {actionFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  actionFeedback.success
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                }`}>
                  {actionFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClearModalTarget(null)}
                  disabled={isClearing}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteWipe}
                  disabled={isClearing || confirmInput.trim().toUpperCase() !== clearModalTarget.code.toUpperCase()}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  {isClearing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Purging...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Wipe Data</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Lender Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-900 dark:text-slate-100 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingBank ? `Configure Lender: ${editingBank.name}` : "Register New Lender"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Basic Lender Identification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Institution Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. HDFC Bank Ltd"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Unique Code *</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. HDFC"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Institution Type</label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="BANK">BANK (Commercial)</option>
                      <option value="NBFC">NBFC (Financial Institution)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Processing Fee (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={processingFee}
                      onChange={(e) => setProcessingFee(Number(e.target.value))}
                      placeholder="1.0"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 2. Logo Upload & URL Configuration */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Lender Logo / Icon</span>
                    </label>

                    {/* Mode Toggle: Upload vs Image URL */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setLogoMode("UPLOAD")}
                        className={`px-2.5 py-0.5 rounded-md transition-all ${
                          logoMode === "UPLOAD"
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Upload Logo
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoMode("URL")}
                        className={`px-2.5 py-0.5 rounded-md transition-all ${
                          logoMode === "URL"
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Image URL
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Preview Box */}
                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Preview" className="w-10 h-10 object-contain" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      {logoMode === "UPLOAD" ? (
                        <div className="space-y-1">
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer shadow-sm transition-all">
                            {isUploadingLogo ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            ) : (
                              <Upload className="w-4 h-4 text-blue-600" />
                            )}
                            <span>{isUploadingLogo ? "Uploading to Storage..." : "Choose Image File (PNG, JPG, SVG)"}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                              onChange={handleFileUpload}
                              disabled={isUploadingLogo}
                              className="hidden"
                            />
                          </label>
                          {logoUrl && (
                            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                              ✓ Attached: {logoUrl}
                            </p>
                          )}
                        </div>
                      ) : (
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                        />
                      )}

                      {logoUploadError && (
                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          {logoUploadError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Apply for Loan Configuration Box */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Apply for Loan Button</span>
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Enable or disable the customer loan application button for this specific lender across the frontend.
                      </p>
                    </div>

                    {/* ON / OFF Switch */}
                    <button
                      type="button"
                      onClick={() => setApplyEnabled(!applyEnabled)}
                      className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        applyEnabled
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${applyEnabled ? "bg-white animate-pulse" : "bg-slate-400"}`} />
                      <span>{applyEnabled ? "ON" : "OFF"}</span>
                    </button>
                  </div>

                  {/* Redirect URL Input */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <span>Redirect URL</span>
                      {applyEnabled && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={applyUrl}
                        onChange={(e) => {
                          setApplyUrl(e.target.value);
                          setApplyUrlError(null);
                        }}
                        placeholder="https://example.com/apply or /loan-apply?bank=HDFC"
                        className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono focus:outline-none ${
                          applyUrlError
                            ? "border-rose-500 text-rose-900 dark:text-rose-200"
                            : "border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-blue-500"
                        }`}
                      />
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Supports external websites (e.g. <code>https://partner.com/apply</code>) or internal portal paths (e.g. <code>/loan-apply?bank={code || "CODE"}</code>).
                    </p>
                    {applyUrlError && (
                      <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{applyUrlError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingLogo}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Configuration...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Configuration</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
