"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Search,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Bank } from "@/types";

export default function AdminBanksPage() {
  const { data: banks = [], isLoading: loading, refetch: fetchBanks } = useBanksQuery();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BANK" | "NBFC">("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  // Clear Companies / Pincodes State
  const [clearModalTarget, setClearModalTarget] = useState<Bank | null>(null);
  const [clearType, setClearType] = useState<"COMPANIES" | "PINCODES">("COMPANIES");
  const [cleanOrphans, setCleanOrphans] = useState(true);
  const [confirmInput, setConfirmInput] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setProcessingFee(1.0);
    setShowModal(true);
  };

  const openEditModal = (bank: Bank) => {
    setEditingBank(bank);
    setName(bank.name);
    setCode(bank.code);
    setType((bank.type as "BANK" | "NBFC") || "BANK");
    setLogoUrl(bank.logoUrl || "");
    setLogoMode(bank.logoUrl && bank.logoUrl.startsWith("http") ? "URL" : "UPLOAD");
    setLogoUploadError(null);
    setApplyEnabled(Boolean(bank.applyEnabled));
    setApplyUrl(bank.applyUrl || "");
    setApplyUrlError(null);
    setPriority(bank.priority || 1);
    setPartnerStatus(bank.partnerStatus || "ACTIVE");
    setDisplayOrder(bank.displayOrder || 1);
    setProcessingFee(bank.processingFee || 1.0);
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoUploadError(null);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await apiClient.post("/admin/banks/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success && res.data.data?.url) {
        setLogoUrl(res.data.data.url);
        showToast({ title: "Logo uploaded successfully", type: "success" });
      }
    } catch {
      setLogoUploadError("Logo upload failed. Please use valid JPG/PNG/SVG.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (applyEnabled && !applyUrl.trim()) {
      setApplyUrlError("Apply URL is required when Direct Apply is enabled");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        logoUrl: logoUrl.trim() || undefined,
        applyEnabled,
        applyUrl: applyUrl.trim() || undefined,
        priority: Number(priority),
        partnerStatus,
        displayOrder: Number(displayOrder),
        processingFee: Number(processingFee),
      };

      if (editingBank) {
        await apiClient.put(`/admin/banks/${editingBank.id}`, payload);
        showToast({ title: "Lender partner updated successfully", type: "success" });
      } else {
        await apiClient.post("/admin/banks", payload);
        showToast({ title: "Lender partner created successfully", type: "success" });
      }
      setShowModal(false);
      fetchBanks();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Operation failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (bank: Bank) => {
    try {
      const nextStatus = bank.isActive ? false : true;
      await apiClient.patch(`/admin/banks/${bank.id}/status`, { isActive: nextStatus });
      showToast({
        title: `Lender ${bank.name} ${nextStatus ? "activated" : "deactivated"}`,
        type: "info",
      });
      fetchBanks();
    } catch {
      showToast({ title: "Failed to toggle status", type: "error" });
    }
  };

  const handleDeleteBank = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/admin/banks/${deleteTarget.id}`);
      showToast({ title: `${deleteTarget.name} deleted successfully`, type: "success" });
      setDeleteTarget(null);
      fetchBanks();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Delete failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearBankData = async () => {
    if (!clearModalTarget || confirmInput !== clearModalTarget.code) return;
    setIsClearing(true);
    try {
      const endpoint =
        clearType === "COMPANIES"
          ? `/admin/banks/${clearModalTarget.id}/clear-companies`
          : `/admin/banks/${clearModalTarget.id}/clear-pincodes`;

      const res = await apiClient.post(endpoint, { cleanOrphans });
      if (res.data?.success) {
        showToast({
          title: `Cleared ${clearType.toLowerCase()} data for ${clearModalTarget.name}`,
          type: "success",
        });
        setClearModalTarget(null);
        setConfirmInput("");
        fetchBanks();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Clear operation failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsClearing(false);
    }
  };

  // Filtered Banks
  const filteredBanks = useMemo(() => {
    return banks.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "ALL" || b.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [banks, searchQuery, typeFilter]);

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Partner Lenders &amp; NBFCs
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Manage institutional partners, priority ordering, direct apply links, and underwriting matrix bindings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchBanks()}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Lenders</span>
          </button>
          <button onClick={openAddModal} className="btn-primary h-10 px-4 text-xs">
            <Plus className="w-4 h-4" />
            <span>Add Lender Partner</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by bank name or code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(["ALL", "BANK", "NBFC"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === t
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t === "ALL" ? `All (${banks.length})` : t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lenders Grid ─────────────────────────────────────── */}
      {loading ? (
        <AdminCardGridSkeleton count={6} />
      ) : filteredBanks.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No lender partners found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? "No banks match your search criteria." : "Get started by registering your first banking partner."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBanks.map((bank) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                      {bank.logoUrl ? (
                        <img
                          src={bank.logoUrl}
                          alt={bank.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                        {bank.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {bank.code}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {bank.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      bank.isActive !== false ? "badge-emerald" : "badge-rose"
                    }`}
                  >
                    {bank.isActive !== false ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                {/* Card Details Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Priority Rank</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
                      #{bank.priority || 1}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Proc. Fee</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
                      {bank.processingFee || 1.0}%
                    </span>
                  </div>
                </div>

                {bank.applyEnabled && bank.applyUrl && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold truncate bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Direct Apply Active</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleStatus(bank)}
                  className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title={bank.isActive !== false ? "Deactivate" : "Activate"}
                >
                  {bank.isActive !== false ? (
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setClearModalTarget(bank);
                      setClearType("COMPANIES");
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Clear Company Mappings"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setClearModalTarget(bank);
                      setClearType("PINCODES");
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Clear Pincode Mappings"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(bank)}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                    title="Edit Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(bank)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Lender"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingBank ? `Edit Partner: ${editingBank.name}` : "Register New Lender Partner"}
        description="Configure institutional partner details, logo, underwriting priority, and apply redirects."
      >
        <form onSubmit={handleSaveBank} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Lender Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Bank Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Institution Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "BANK" | "NBFC")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="BANK">Commercial Bank</option>
                <option value="NBFC">NBFC Partner</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Priority Score</label>
              <input
                type="number"
                min={1}
                max={100}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Processing Fee (%)</label>
              <input
                type="number"
                step="0.01"
                value={processingFee}
                onChange={(e) => setProcessingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Logo Field */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Lender Logo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLogoMode("UPLOAD")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    logoMode === "UPLOAD" ? "bg-blue-600 text-white" : "text-slate-400"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode("URL")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    logoMode === "URL" ? "bg-blue-600 text-white" : "text-slate-400"
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {logoMode === "UPLOAD" ? (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer"
              />
            ) : (
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            )}
            {logoUploadError && <p className="text-[11px] text-rose-400">{logoUploadError}</p>}
          </div>

          {/* Direct Apply URL Config */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Direct Application Link</span>
                <span className="text-[11px] text-slate-400">Route eligible borrowers directly to bank portal</span>
              </div>
              <input
                type="checkbox"
                checked={applyEnabled}
                onChange={(e) => setApplyEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>

            {applyEnabled && (
              <input
                type="url"
                required={applyEnabled}
                value={applyUrl}
                onChange={(e) => {
                  setApplyUrl(e.target.value);
                  setApplyUrlError(null);
                }}
                placeholder="https://partnerbank.com/apply-link"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            )}
            {applyUrlError && <p className="text-[11px] text-rose-400">{applyUrlError}</p>}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary h-10 px-4 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingLogo}
              className="btn-primary h-10 px-5 text-xs font-bold"
            >
              {isSubmitting ? "Saving Partner..." : editingBank ? "Update Partner" : "Create Partner"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Clear Companies / Pincodes Action Modal ──────────── */}
      {clearModalTarget && (
        <Modal
          open={Boolean(clearModalTarget)}
          onClose={() => {
            setClearModalTarget(null);
            setConfirmInput("");
          }}
          title={`Purge ${clearType} for ${clearModalTarget.name}`}
          description={`High-risk action: This will detach all associated ${clearType.toLowerCase()} records from ${clearModalTarget.name}.`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Type <strong className="font-mono text-white font-bold">{clearModalTarget.code}</strong> below to confirm detachment.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cleanOrphans"
                checked={cleanOrphans}
                onChange={(e) => setCleanOrphans(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <label htmlFor="cleanOrphans" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Also purge unlinked orphan master records
              </label>
            </div>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={`Enter "${clearModalTarget.code}" to proceed`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setClearModalTarget(null);
                  setConfirmInput("");
                }}
                className="btn-secondary h-10 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmInput !== clearModalTarget.code || isClearing}
                onClick={handleClearBankData}
                className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                {isClearing ? "Purging Records..." : `Purge ${clearType}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Dialog ───────────────────────── */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteBank}
          title={`Delete ${deleteTarget.name}?`}
          description={`Are you sure you want to permanently remove ${deleteTarget.name} (${deleteTarget.code})? All associated policy bindings will be unlinked.`}
          confirmLabel="Permanently Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
