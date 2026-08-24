"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { useCompaniesQuery, useBanksQuery } from "@/hooks/useAdminQueries";
import { useDebounce } from "@/hooks/useDebounce";
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
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";
import { getCategoryStatus } from "@/utils/categoryStatus";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Company, Bank } from "@/types";

const STATUS_OPTIONS = ["APPROVED", "REJECTED", "REFERRAL", "EXCLUDED"];
const SUGGESTED_CATEGORIES = [
  "Preferred",
  "Prime",
  "Super Prime",
  "Priority Partner",
  "Strategic Partner",
  "CAT A",
  "CAT B",
  "CAT C",
  "CAT D",
  "Tier 1",
  "Tier 2",
  "A+",
  "Regular",
  "Negative",
  "Unlisted",
];

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 450);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();

  const { data: companiesData, isLoading: loading, isFetching, refetch: fetchCompanies } = useCompaniesQuery(
    page,
    debouncedSearch
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

  // Multi-Company Merge State
  const [mergeCandidates, setMergeCandidates] = useState<Company[]>([]);
  const [canonicalTargetId, setCanonicalTargetId] = useState<string>("");
  const [extraMergeSearch, setExtraMergeSearch] = useState("");
  const [extraMergeResults, setExtraMergeResults] = useState<Company[]>([]);
  const [isSearchingExtra, setIsSearchingExtra] = useState(false);

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
        const categoriesList = cData.bankCategories || cData.companyCategories || [];
        const mapped = categoriesList.map((cc: any) => ({
          bankId: cc.bankId,
          bankName: cc.bank?.name || "Unknown Bank",
          bankCode: cc.bank?.code || "CODE",
          category: cc.category || "CAT A",
          status: cc.status || "APPROVED",
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
    if (!name.trim()) {
      showToast({ title: "Company name is required", type: "error" });
      return;
    }
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
            category: c.category.trim() || "CAT A",
            status: c.status || "APPROVED",
            remarks: c.remarks?.trim() || undefined,
          })),
      };

      if (editingCompany) {
        await apiClient.put(`/admin/companies/${editingCompany.id}`, payload);
        showToast({ title: "Company and bank categories updated successfully", type: "success" });
        setShowEditModal(false);
      } else {
        await apiClient.post("/admin/companies", payload);
        showToast({ title: "Company and bank categories registered successfully", type: "success" });
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
        category: bulkCategory.trim(),
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

  // Open Multi-Company Merge Modal
  const openMergeModal = () => {
    const selected = companies.filter((c) => selectedIds.includes(c.id));
    setMergeCandidates(selected);
    setCanonicalTargetId(selected[0]?.id || "");
    setExtraMergeSearch("");
    setExtraMergeResults([]);
    setShowMergeModal(true);
  };

  // Search extra company to add to merge candidate list
  const handleSearchExtraMerge = async (q: string) => {
    setExtraMergeSearch(q);
    if (!q.trim() || q.trim().length < 2) {
      setExtraMergeResults([]);
      return;
    }
    setIsSearchingExtra(true);
    try {
      const res = await apiClient.get(`/admin/companies?limit=8&query=${encodeURIComponent(q.trim())}`);
      const items = (res.data?.data?.items || []) as Company[];
      setExtraMergeResults(items.filter((item) => !mergeCandidates.some((m) => m.id === item.id)));
    } catch {
      setExtraMergeResults([]);
    } finally {
      setIsSearchingExtra(false);
    }
  };

  const addCandidateToMerge = (comp: Company) => {
    if (!mergeCandidates.some((c) => c.id === comp.id)) {
      const updated = [...mergeCandidates, comp];
      setMergeCandidates(updated);
      if (!canonicalTargetId) {
        setCanonicalTargetId(comp.id);
      }
    }
    setExtraMergeResults([]);
    setExtraMergeSearch("");
  };

  const removeCandidateFromMerge = (id: string) => {
    const updated = mergeCandidates.filter((c) => c.id !== id);
    setMergeCandidates(updated);
    if (canonicalTargetId === id) {
      setCanonicalTargetId(updated[0]?.id || "");
    }
  };

  // Multi-Company Merge Execution
  const handleExecuteMerge = async () => {
    if (mergeCandidates.length < 2) {
      showToast({ title: "Please select at least 2 company records to merge", type: "warning" });
      return;
    }
    if (!canonicalTargetId) {
      showToast({ title: "Please select the canonical master company to keep", type: "warning" });
      return;
    }

    const sourceIds = mergeCandidates.map((c) => c.id).filter((id) => id !== canonicalTargetId);
    const targetComp = mergeCandidates.find((c) => c.id === canonicalTargetId);

    setIsSubmitting(true);
    try {
      await apiClient.post("/admin/companies/merge", {
        sourceCompanyIds: sourceIds,
        targetCompanyId: canonicalTargetId,
      });
      showToast({
        title: `Merged ${sourceIds.length} duplicate records into "${targetComp?.name || "Canonical Record"}"`,
        type: "success",
      });
      setShowMergeModal(false);
      setSelectedIds([]);
      setMergeCandidates([]);
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

  // Add Bank Category Row in Company Edit/Create
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
      {/* ── Global Category Datalist for Custom Category Entry ── */}
      <datalist id="category-suggestions">
        {SUGGESTED_CATEGORIES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

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
            onClick={openMergeModal}
            className="btn-secondary h-10 px-4 text-xs font-bold flex items-center gap-2"
          >
            <Merge className="w-3.5 h-3.5 text-purple-400" />
            <span>Merge Entities {selectedIds.length > 1 ? `(${selectedIds.length})` : ""}</span>
          </button>
          <button onClick={openCreateModal} className="btn-primary h-10 px-4 text-xs">
            <Plus className="w-4 h-4" />
            <span>Register Employer</span>
          </button>
        </div>
      </div>

      {/* ── Search & Bulk Controls ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by company name, CIN, or city..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {(isFetching || search.trim() !== debouncedSearch) && (
                <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              )}
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="p-0.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {debouncedSearch && !loading && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-mono font-bold text-[11px]">
                {companiesData?.total ?? companies.length} results
              </span>
            </div>
          )}
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
            {selectedIds.length >= 2 && (
              <button
                onClick={openMergeModal}
                className="btn-primary h-9 px-3.5 text-xs font-bold"
              >
                <Merge className="w-3.5 h-3.5" />
                <span>Merge Selected</span>
              </button>
            )}
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
            {debouncedSearch
              ? `No companies match "${debouncedSearch}".`
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
                      {selectedIds.length === companies.length && companies.length > 0 ? (
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
                  const cats = comp.companyCategories || comp.bankCategories || [];

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
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {cats.length === 0 ? (
                            <span className="text-[10px] text-slate-500 font-medium bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded">
                              Unmapped
                            </span>
                          ) : (
                            cats.map((cc, idx) => {
                              const visual = getCategoryStatus(cc.category);
                              return (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${visual.badgeClass}`}
                                  title={`${cc.bank?.name || "Bank"}: ${cc.category} (${visual.label})`}
                                >
                                  <span>{cc.bank?.code || "BANK"}:</span>
                                  <span className="underline decoration-dotted">{cc.category}</span>
                                </span>
                              );
                            })
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
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {companyBankCategories.filter((c) => !c.delete).length === 0 ? (
                    <p className="text-slate-500 py-6 text-center text-xs">
                      No partner bank classifications attached yet. Choose a bank above to add.
                    </p>
                  ) : (
                    companyBankCategories
                      .filter((c) => !c.delete)
                      .map((cat) => (
                        <div
                          key={cat.bankId}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-[120px]">
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {cat.bankName}
                            </h4>
                            <span className="text-[10px] font-mono text-blue-400 font-bold">
                              {cat.bankCode}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-1 justify-end">
                            {/* Custom Category Input with Datalist Suggestions */}
                            <div className="relative flex-1 max-w-[180px]">
                              <input
                                type="text"
                                list="category-suggestions"
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
                                placeholder="Category (e.g. Preferred)"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200 dark:border-white/[0.08]"
                              />
                            </div>

                            {/* Status Selector */}
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
                              className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            {/* Remove Button */}
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
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remove bank mapping"
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
                className="btn-secondary h-10 px-4 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-10 px-5 text-xs font-bold cursor-pointer"
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
                <label className="text-xs font-bold text-slate-300">Category (Custom or Standard)</label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  placeholder="e.g. Preferred, CAT A"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
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
                className="btn-secondary h-10 px-4 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!bulkBankId || isSubmitting}
                onClick={handleBulkAssign}
                className="btn-primary h-10 px-5 text-xs font-bold cursor-pointer"
              >
                {isSubmitting ? "Assigning..." : "Apply Category to Selection"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Multi-Company Merge Review Modal (Phase 1) ─────────── */}
      {showMergeModal && (
        <Modal
          open={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          title="Consolidate Duplicate Company Records (Merge Entities)"
          description="Merge multiple duplicate employer entries into one canonical record. All bank listings, location data, and aliases will be preserved."
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Informative Safety Notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <strong className="font-bold text-emerald-300 block mb-0.5">Zero Business Data Loss Guaranteed</strong>
                <span>
                  All bank categorizations, location fields, and variant names will be consolidated under the chosen canonical record. Source variants become search aliases automatically.
                </span>
              </div>
            </div>

            {/* Candidate List & Canonical Master Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Select Canonical Entity to Keep ({mergeCandidates.length} Entities Selected)
                </label>
                <span className="text-[11px] text-slate-500">Choose one master company identity</span>
              </div>

              {mergeCandidates.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-dashed border-slate-300 dark:border-white/[0.1] text-center space-y-2">
                  <p className="text-xs text-slate-400 font-medium">
                    No duplicate companies selected yet. Search and add variant companies below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {mergeCandidates.map((comp) => {
                    const isCanonical = canonicalTargetId === comp.id;
                    const cats = comp.companyCategories || comp.bankCategories || [];

                    return (
                      <div
                        key={comp.id}
                        onClick={() => setCanonicalTargetId(comp.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isCanonical
                            ? "bg-purple-500/10 border-purple-500/50 shadow-sm"
                            : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isCanonical
                                ? "border-purple-500 bg-purple-500 text-white"
                                : "border-slate-400 dark:border-white/30"
                            }`}
                          >
                            {isCanonical && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                {comp.name}
                              </span>
                              {isCanonical && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  MASTER RECORD
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span>CIN: <strong className="text-slate-300">{comp.cin || "None"}</strong></span>
                              <span>•</span>
                              <span>{comp.city || "—"}, {comp.state || "—"}</span>
                              <span>•</span>
                              <span>{cats.length} Bank Mapping{cats.length === 1 ? "" : "s"}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCandidateFromMerge(comp.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove from merge list"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search & Add More Duplicate Companies to Merge */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <label className="text-xs font-bold text-slate-300">Add other variant records to this merge:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={extraMergeSearch}
                  onChange={(e) => handleSearchExtraMerge(e.target.value)}
                  placeholder="Type company name or CIN to find and add..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {isSearchingExtra && (
                  <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {extraMergeResults.length > 0 && (
                <div className="p-2 rounded-xl bg-slate-900 border border-white/[0.1] max-h-40 overflow-y-auto space-y-1 shadow-lg">
                  {extraMergeResults.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => addCandidateToMerge(r)}
                      className="p-2 rounded-lg hover:bg-white/[0.08] cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white truncate">{r.name}</span>
                      <span className="text-[10px] text-purple-400 font-bold shrink-0">+ Add to merge</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Merge Direction Summary */}
            {mergeCandidates.length >= 2 && canonicalTargetId && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 space-y-1">
                <strong className="font-bold block text-purple-200">Confirmation Summary:</strong>
                <p>
                  You are merging{" "}
                  <strong>{mergeCandidates.length - 1} duplicate company records</strong> into{" "}
                  <strong className="text-white">
                    "{mergeCandidates.find((c) => c.id === canonicalTargetId)?.name}"
                  </strong>.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="btn-secondary h-10 px-4 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={mergeCandidates.length < 2 || !canonicalTargetId || isSubmitting}
                onClick={handleExecuteMerge}
                className="btn-primary h-10 px-5 text-xs font-bold cursor-pointer"
              >
                {isSubmitting
                  ? "Consolidating Entities..."
                  : `Execute Merge (${mergeCandidates.length} into 1)`}
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
