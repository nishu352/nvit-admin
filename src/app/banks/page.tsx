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
  const [priority, setPriority] = useState(1);
  const [partnerStatus, setPartnerStatus] = useState("ACTIVE");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [eligibility, setEligibility] = useState("");
  const [processingFee, setProcessingFee] = useState(1.0);

  const openAddModal = () => {
    setEditingBank(null);
    setName("");
    setCode("");
    setType("BANK");
    setLogoUrl("");
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
    setPriority(bank.priority || 1);
    setPartnerStatus(bank.partnerStatus || "ACTIVE");
    setDisplayOrder(bank.displayOrder || 1);
    setEligibility(bank.eligibility || "");
    setProcessingFee(bank.processingFee || 1.0);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      code,
      type,
      logoUrl: logoUrl || null,
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
    } catch (err) {
      console.error("Failed to save bank", err);
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
    try {
      if (clearType === "COMPANIES") {
        const res = await apiClient.delete(
          `/admin/banks/${clearModalTarget.id}/data/companies?cleanOrphans=${cleanOrphans}`
        );
        setActionFeedback({
          success: true,
          message: res.data?.message || `Successfully cleared company list for ${clearModalTarget.name}.`,
        });
      } else {
        const res = await apiClient.delete(`/admin/banks/${clearModalTarget.id}/data/pincodes`);
        setActionFeedback({
          success: true,
          message: res.data?.message || `Successfully cleared pincode list for ${clearModalTarget.name}.`,
        });
      }
      fetchBanks();
      setTimeout(() => {
        setClearModalTarget(null);
        setActionFeedback(null);
      }, 2500);
    } catch (err: any) {
      setActionFeedback({
        success: false,
        message: err.response?.data?.message || "Failed to execute wipe operation.",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Institutional Lenders</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
            Manage partner banks, NBFCs, company category mappings, and individual lender data purging
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchBanks()}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={openAddModal}
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/20 transition-colors flex items-center gap-2 cursor-pointer"
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
            <div key={bank.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-64 shadow-sm hover:shadow-md transition-shadow">
              {/* Card Top */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      {bank.logoUrl ? (
                        <img src={bank.logoUrl} alt={bank.code} className="w-6 h-6 object-contain" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight mb-1">{bank.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">CODE: {bank.code} • Priority: {bank.priority || 1}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black border ${
                    bank.type === "BANK"
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                      : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20"
                  }`}>
                    {bank.type}
                  </span>
                </div>

                <div className="space-y-2.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-2">
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
                      title="Edit Lender Details"
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
                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
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
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-900 dark:text-slate-100"
            >
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingBank ? "Modify Institutional Lender" : "Register New Lender"}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Institution Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. HDFC Bank Ltd"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
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
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold uppercase focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Institution Type</label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
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
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Save Lender
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
