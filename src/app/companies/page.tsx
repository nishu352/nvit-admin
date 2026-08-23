"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { useCompaniesQuery, useBanksQuery } from "@/hooks/useAdminQueries";
import {
  Building,
  Search,
  Plus,
  Edit2,
  Trash2,
  Merge,
  Layers,
  Download,
  CheckSquare,
  Square,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  PlusCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { getCategoryStatus } from "@/utils/categoryStatus";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Company, Bank } from "@/types";

const CATEGORY_TIERS = ["SUPER A", "CAT A", "CAT B", "CAT C", "CAT D", "NEGATIVE", "UNLISTED"];
const STATUS_OPTIONS = ["APPROVED", "REJECTED", "REFERRAL", "EXCLUDED"];

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();

  const { data: companiesData, isLoading: loading, refetch: fetchCompanies } = useCompaniesQuery(
    page,
    search
  );
  const { data: banks = [] } = useBanksQuery();

  const companies = (companiesData?.items || []) as Company[];
  const totalPages = companiesData?.totalPages || 1;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  // Active Company Edit State
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<"DETAILS" | "BANKS">("DETAILS");

  // Form Fields for Edit / Add
  const [name, setName] = useState("");
  const [cin, setCin] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // Bank Categories array for the company being edited
  const [companyBankCategories, setCompanyBankCategories] = useState<
    Array<{
      bankId: string;
      bankName: string;
      bankCode: string;
      category: string;
      status: string;
      remarks: string;
      isModified?: boolean;
      delete?: boolean;
    }>
  >([]);

  // Merge modal fields
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");

  // Bulk assign fields
  const [bulkBankId, setBulkBankId] = useState("");
  const [bulkCategory, setBulkCategory] = useState("CAT A");
  const [bulkStatus, setBulkStatus] = useState("APPROVED");
  const [bulkRemarks, setBulkRemarks] = useState("");

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCompany(null);
    setName("");
    setCin("");
    setPincode("");
    setCity("");
    setState("");
    setDistrict("");
    setStatus("ACTIVE");
    setCompanyBankCategories([]);
    setActiveTab("DETAILS");
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = async (company: Company) => {
    setEditingCompany(company);
    setName(company.name);
    setCin(company.cin || "");
    setPincode(company.pincode || "");
    setCity(company.city || "");
    setState(company.state || "");
    setDistrict(company.district || "");
    setStatus(company.status || "ACTIVE");
    setActiveTab("DETAILS");

    try {
      const res = await apiClient.get(`/admin/companies/${company.id}`);
      if (res.data?.success && res.data.data) {
        const cData = res.data.data;
        const mapped = (cData.companyCategories || []).map((cc: any) => ({
          bankId: cc.bankId,
          bankName: cc.bank?.name || "Unknown Bank",
          bankCode: cc.bank?.code || "CODE",
          category: cc.category,
          status: cc.status,
          remarks: cc.remarks || "",
        }));
        setCompanyBankCategories(mapped);
      }
    } catch {
      setCompanyBankCategories([]);
    }

    setShowEditModal(true);
  };

  // Save / Update Company
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        cin: cin.trim() || undefined,
        pincode: pincode.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        district: district.trim() || undefined,
        status,
        categories: companyBankCategories
          .filter((c) => !c.delete)
          .map((c) => ({
            bankId: c.bankId,
            category: c.category,
            status: c.status,
            remarks: c.remarks,
          })),
      };

      if (editingCompany) {
        await apiClient.put(`/admin/companies/${editingCompany.id}`, payload);
        showToast({ title: "Company updated successfully", type: "success" });
        setShowEditModal(false);
      } else {
        await apiClient.post("/admin/companies", payload);
        showToast({ title: "Company created successfully", type: "success" });
        setShowAddModal(false);
      }
      fetchCompanies();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save company";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Company
  const handleDeleteCompany = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/admin/companies/${deleteTarget.id}`);
      showToast({ title: "Company deleted successfully", type: "success" });
      setDeleteTarget(null);
      fetchCompanies();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Delete failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Assign Handler
  const handleBulkAssign = async () => {
    if (!bulkBankId || selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await apiClient.post("/admin/companies/bulk-assign-category", {
        companyIds: selectedIds,
        bankId: bulkBankId,
        category: bulkCategory,
        status: bulkStatus,
        remarks: bulkRemarks.trim() || undefined,
      });
      showToast({
        title: `Updated category for ${selectedIds.length} companies`,
        type: "success",
      });
      setShowBulkModal(false);
      setSelectedIds([]);
      fetchCompanies();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Bulk update failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Merge Handler
  const handleMergeCompanies = async () => {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      showToast({ title: "Select two different companies to merge", type: "warning" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post("/admin/companies/merge", {
        sourceCompanyId: mergeSourceId,
        targetCompanyId: mergeTargetId,
      });
      showToast({ title: "Companies merged successfully", type: "success" });
      setShowMergeModal(false);
      setMergeSourceId("");
      setMergeTargetId("");
      fetchCompanies();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Merge operation failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Bank Category Row in Company Edit
  const handleAddBankCategory = (bank: Bank) => {
    if (companyBankCategories.some((c) => c.bankId === bank.id && !c.delete)) return;
    setCompanyBankCategories((prev) => [
      ...prev,
      {
        bankId: bank.id,
        bankName: bank.name,
        bankCode: bank.code,
        category: "CAT A",
        status: "APPROVED",
        remarks: "",
        isModified: true,
      },
    ]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === companies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(companies.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Enterprise Company Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Employer records, multi-bank tier category matrices, deduplication, and CIN indexing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowMergeModal(true)}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <Merge className="w-3.5 h-3.5" />
            <span>Merge Entities</span>
          </button>
          <button onClick={openCreateModal} className="btn-primary h-10 px-4 text-xs">
            <Plus className="w-4 h-4" />
            <span>Register Employer</span>
          </button>
        </div>
      </div>

      {/* ── Search & Bulk Controls ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by company name, CIN, or city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
              {selectedIds.length} Selected
            </span>
            <button
              onClick={() => setShowBulkModal(true)}
              className="btn-secondary h-9 px-3.5 text-xs font-bold"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Bulk Assign Category</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Table Container ──────────────────────────────────── */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={5} />
      ) : companies.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <Building className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No corporate employers found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? "No companies match your search query."
              : "Register your first employer entity or upload via Excel."}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="cursor-pointer text-slate-400 hover:text-white"
                    >
                      {selectedIds.length === companies.length ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th>Company Details</th>
                  <th>CIN Identifier</th>
                  <th>Location</th>
                  <th>Bank Category Matrix</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((comp) => {
                  const isSelected = selectedIds.includes(comp.id);
                  const cats = comp.companyCategories || [];

                  return (
                    <tr
                      key={comp.id}
                      className={isSelected ? "bg-purple-500/5 dark:bg-purple-500/10" : ""}
                    >
                      <td>
                        <button
                          onClick={() => toggleSelectOne(comp.id)}
                          className="cursor-pointer text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                            {comp.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Indexed: {formatDate(comp.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-blue-400 font-bold">
                          {comp.cin || "NO CIN"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {comp.city || "—"}, {comp.state || "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {cats.length === 0 ? (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Unmapped
                            </span>
                          ) : (
                            cats.slice(0, 3).map((cc, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] text-slate-300"
                              >
                                {cc.bank?.code || "BANK"}:{" "}
                                <strong className="text-purple-400">{cc.category}</strong>
                              </span>
                            ))
                          )}
                          {cats.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500">
                              +{cats.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(comp)}
                            className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                            title="Edit Company & Category Matrix"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(comp)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Company"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
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
        </div>
      )}

      {/* ── Add / Edit Company Modal ──────────────────────────── */}
      {(showAddModal || showEditModal) && (
        <Modal
          open={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
          title={editingCompany ? `Edit: ${editingCompany.name}` : "Register Employer Entity"}
          description="Configure company legal identifiers and multi-bank underwriting categories."
          maxWidth="max-w-2xl"
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-white/[0.08] mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("DETAILS")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${
                activeTab === "DETAILS"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Entity Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("BANKS")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${
                activeTab === "BANKS"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Bank Tier Matrix ({companyBankCategories.filter((c) => !c.delete).length})
            </button>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            {activeTab === "DETAILS" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tata Consultancy Services Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">CIN Identifier</label>
                    <input
                      type="text"
                      value={cin}
                      onChange={(e) => setCin(e.target.value.toUpperCase())}
                      placeholder="e.g. L22210MH1995PLC084781"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Registered Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 400001"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Available Banks selector */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <span className="text-xs font-bold text-slate-300">Add Lender Mapping:</span>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        const b = banks.find((item) => item.id === e.target.value);
                        if (b) handleAddBankCategory(b);
                        e.target.value = "";
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none"
                    >
                      <option value="">+ Choose Partner Bank</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Categories List */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {companyBankCategories.filter((c) => !c.delete).length === 0 ? (
                    <p className="text-slate-500 py-6 text-center text-xs">
                      No partner bank classifications attached yet.
                    </p>
                  ) : (
                    companyBankCategories
                      .filter((c) => !c.delete)
                      .map((cat, idx) => (
                        <div
                          key={cat.bankId}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3"
                        >
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {cat.bankName}
                            </h4>
                            <span className="text-[10px] font-mono text-blue-400">
                              {cat.bankCode}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={cat.category}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCompanyBankCategories((prev) =>
                                  prev.map((item) =>
                                    item.bankId === cat.bankId
                                      ? { ...item, category: val, isModified: true }
                                      : item
                                  )
                                );
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-xs font-bold"
                            >
                              {CATEGORY_TIERS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>

                            <select
                              value={cat.status}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCompanyBankCategories((prev) =>
                                  prev.map((item) =>
                                    item.bankId === cat.bankId
                                      ? { ...item, status: val, isModified: true }
                                      : item
                                  )
                                );
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-xs font-bold"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setCompanyBankCategories((prev) =>
                                  prev.map((item) =>
                                    item.bankId === cat.bankId
                                      ? { ...item, delete: true }
                                      : item
                                  )
                                );
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="btn-secondary h-10 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-10 px-5 text-xs font-bold"
              >
                {isSubmitting
                  ? "Saving Company..."
                  : editingCompany
                  ? "Update Company"
                  : "Register Company"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Bulk Assign Modal ─────────────────────────────────── */}
      {showBulkModal && (
        <Modal
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title={`Bulk Assign Category (${selectedIds.length} Companies)`}
          description="Batch attach or override a specific bank category tier for selected companies."
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Target Partner Bank *</label>
              <select
                value={bulkBankId}
                onChange={(e) => setBulkBankId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none"
              >
                <option value="">Select Target Bank</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Category Tier</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none"
                >
                  {CATEGORY_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Underwriting Status</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn-secondary h-10 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!bulkBankId || isSubmitting}
                onClick={handleBulkAssign}
                className="btn-primary h-10 px-5 text-xs font-bold"
              >
                {isSubmitting ? "Assigning..." : "Apply Category to Selection"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Merge Companies Modal ─────────────────────────────── */}
      {showMergeModal && (
        <Modal
          open={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          title="Merge Duplicate Company Records"
          description="Consolidate duplicate employers into a single canonical record and rebind bank categories."
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                All category bindings from the source company will be merged into the target company,
                and the source company will be permanently purged.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Source Company (Duplicate to be deleted) *
              </label>
              <select
                value={mergeSourceId}
                onChange={(e) => setMergeSourceId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none"
              >
                <option value="">Select Source Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.cin ? `(${c.cin})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Target Company (Canonical master record to keep) *
              </label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none"
              >
                <option value="">Select Target Company</option>
                {companies
                  .filter((c) => c.id !== mergeSourceId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.cin ? `(${c.cin})` : ""}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="btn-secondary h-10 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!mergeSourceId || !mergeTargetId || isSubmitting}
                onClick={handleMergeCompanies}
                className="btn-primary h-10 px-5 text-xs font-bold"
              >
                {isSubmitting ? "Merging..." : "Execute Company Merge"}
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
          onConfirm={handleDeleteCompany}
          title={`Delete ${deleteTarget.name}?`}
          description={`Are you sure you want to permanently remove ${deleteTarget.name}? All associated bank category mappings will be unlinked.`}
          confirmLabel="Permanently Delete"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
