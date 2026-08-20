"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { getCategoryStatus } from "@/utils/categoryStatus";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";

const CATEGORY_TIERS = ["SUPER A", "CAT A", "CAT B", "CAT C", "CAT D", "NEGATIVE", "UNLISTED"];
const STATUS_OPTIONS = ["APPROVED", "REJECTED", "REFERRAL", "EXCLUDED"];

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: companiesData, isLoading: loading, refetch: fetchCompanies } = useCompaniesQuery(page, search);
  const { data: banks = [] } = useBanksQuery();

  const companies = companiesData?.items || [];
  const totalPages = companiesData?.totalPages || 1;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Active Company Edit State
  const [editingCompany, setEditingCompany] = useState<any>(null);
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
    setShowAddModal(true);
  };

  // Open Comprehensive Edit Modal
  const openEditModal = (comp: any) => {
    setEditingCompany(comp);
    setName(comp.name || "");
    setCin(comp.cin || "");
    setPincode(comp.pincode || "");
    setCity(comp.city || "");
    setState(comp.state || "");
    setDistrict(comp.district || "");
    setStatus(comp.status || "ACTIVE");
    setActiveTab("DETAILS");

    // Map existing categories and prepare full bank list
    const existingMap = new Map<string, any>();
    (comp.bankCategories || []).forEach((bc: any) => {
      if (bc.bank?.id) {
        existingMap.set(bc.bank.id, {
          bankId: bc.bank.id,
          bankName: bc.bank.name,
          bankCode: bc.bank.code,
          category: bc.category || "CAT A",
          status: bc.status || "APPROVED",
          remarks: bc.remarks || "",
        });
      }
    });

    // Populate bank categories for all active partner banks
    const initialCategories: any[] = [];
    banks.forEach((b: any) => {
      const existing = existingMap.get(b.id);
      if (existing) {
        initialCategories.push(existing);
      } else {
        initialCategories.push({
          bankId: b.id,
          bankName: b.name,
          bankCode: b.code,
          category: "UNLISTED",
          status: "APPROVED",
          remarks: "",
        });
      }
    });

    setCompanyBankCategories(initialCategories);
    setShowEditModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/admin/companies", {
        name,
        cin: cin || undefined,
        pincode: pincode || undefined,
        city: city || undefined,
        state: state || undefined,
      });
      setShowAddModal(false);
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create company");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    try {
      await apiClient.put(`/admin/companies/${editingCompany.id}`, {
        name,
        cin: cin || null,
        pincode: pincode || null,
        city: city || null,
        state: state || null,
        district: district || null,
        status,
        bankCategories: companyBankCategories.map((c) => ({
          bankId: c.bankId,
          category: c.category,
          status: c.status,
          remarks: c.remarks || undefined,
          delete: c.delete || false,
        })),
      });
      setShowEditModal(false);
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update company");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company? All bank classifications will be permanently removed!")) return;
    try {
      await apiClient.delete(`/admin/companies/${id}`);
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete company");
    }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mergeSourceId === mergeTargetId) {
      alert("Source and target companies cannot be the same!");
      return;
    }
    try {
      await apiClient.post("/admin/companies/merge", { sourceId: mergeSourceId, targetId: mergeTargetId });
      setShowMergeModal(false);
      setMergeSourceId("");
      setMergeTargetId("");
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Merge execution failed");
    }
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/admin/companies/bulk-category", {
        companyIds: selectedIds,
        bankId: bulkBankId,
        category: bulkCategory,
        status: bulkStatus,
        remarks: bulkRemarks || null,
      });
      setShowBulkModal(false);
      setSelectedIds([]);
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Bulk category update failed");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === companies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(companies.map((c: any) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const updateCategoryItem = (bankId: string, field: string, value: any) => {
    setCompanyBankCategories((prev) =>
      prev.map((item) => (item.bankId === bankId ? { ...item, [field]: value, isModified: true } : item))
    );
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Company Management</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
            Search, edit employer profiles, manage multi-bank policy tiers, and deduplicate records
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Bulk Categorize ({selectedIds.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowMergeModal(true)}
            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Merge className="w-4 h-4" />
            <span>Merge Records</span>
          </button>
          <button
            onClick={openCreateModal}
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/20 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Company</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by company name, normalized query, or CIN..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
          />
        </div>
        <button
          onClick={() => fetchCompanies()}
          className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={5} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="p-4 w-10">
                    <button onClick={toggleSelectAll} className="cursor-pointer">
                      {selectedIds.length > 0 && selectedIds.length === companies.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Company Details</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Bank Classifications</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                      No companies found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  companies.map((company: any) => (
                    <tr key={company.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <button onClick={() => toggleSelectOne(company.id)} className="cursor-pointer">
                          {selectedIds.includes(company.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white leading-tight">{company.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 font-bold mt-0.5">
                          {company.cin ? `CIN: ${company.cin}` : `NORM: ${company.normalizedName || "—"}`}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                        {company.city || company.state ? `${company.city || ""} ${company.state ? `, ${company.state}` : ""}` : "—"}
                        {company.pincode && <span className="block text-[10px] font-mono text-slate-400 font-bold">PIN: {company.pincode}</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {(!company.bankCategories || company.bankCategories.length === 0) ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                              UNLISTED
                            </span>
                          ) : (
                            company.bankCategories.map((bc: any) => {
                              const visual = getCategoryStatus(bc.category);
                              return (
                                <span
                                  key={bc.id || `${company.id}-${bc.bank?.code}`}
                                  className={`px-2 py-0.5 rounded border text-[10px] font-extrabold flex items-center gap-1 ${visual.badgeClass}`}
                                >
                                  <span className="opacity-75">{bc.bank?.code}:</span>
                                  <span className="font-black">{bc.category}</span>
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(company)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                            title="Edit Company &amp; Bank Policies"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Edit Company Modal */}
      <AnimatePresence>
        {showEditModal && editingCompany && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Edit Company &amp; Bank Policies</h2>
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{editingCompany.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
                <button
                  onClick={() => setActiveTab("DETAILS")}
                  className={`py-3 px-4 text-xs font-black border-b-2 transition-colors cursor-pointer ${
                    activeTab === "DETAILS"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Company Attributes
                </button>
                <button
                  onClick={() => setActiveTab("BANKS")}
                  className={`py-3 px-4 text-xs font-black border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                    activeTab === "BANKS"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>Bank Categorizations</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                    {companyBankCategories.filter((c) => !c.delete && c.category !== "UNLISTED").length} Active
                  </span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleUpdate} className="overflow-y-auto p-6 space-y-5 flex-1">
                {activeTab === "DETAILS" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold uppercase text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">CIN (Corporate Identity Number)</label>
                      <input
                        type="text"
                        value={cin}
                        onChange={(e) => setCin(e.target.value)}
                        placeholder="e.g. L72200KA1981PLC013115"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Postal Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 110001"
                        maxLength={6}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Configure credit policy classification tier, approval state, and custom lending remarks for each partner bank.
                    </p>
                    <div className="space-y-3">
                      {companyBankCategories.map((cat) => (
                        <div
                          key={cat.bankId}
                          className={`p-4 rounded-2xl border transition-all ${
                            cat.delete
                              ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-60"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white">{cat.bankName}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px] font-bold uppercase text-slate-700 dark:text-slate-300">
                                {cat.bankCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {cat.delete ? (
                                <button
                                  type="button"
                                  onClick={() => updateCategoryItem(cat.bankId, "delete", false)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer"
                                >
                                  Undo Removal
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateCategoryItem(cat.bankId, "delete", true)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                  title="Unmap this bank"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {!cat.delete && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-500">Category Tier</label>
                                <select
                                  value={cat.category}
                                  onChange={(e) => updateCategoryItem(cat.bankId, "category", e.target.value)}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  {CATEGORY_TIERS.map((tier) => (
                                    <option key={tier} value={tier}>
                                      {tier}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-500">Approval Status</label>
                                <select
                                  value={cat.status}
                                  onChange={(e) => updateCategoryItem(cat.bankId, "status", e.target.value)}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  {STATUS_OPTIONS.map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-500">Policy Notes / Remarks</label>
                                <input
                                  type="text"
                                  value={cat.remarks || ""}
                                  onChange={(e) => updateCategoryItem(cat.bankId, "remarks", e.target.value)}
                                  placeholder="e.g. Standard Policy"
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    Save All Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Company Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-900 dark:text-slate-100"
            >
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Register Company Index</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. INFOSYS LTD"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold uppercase text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Corporate CIN (Optional)</label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    placeholder="e.g. L72200KA1981PLC013115"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Save Company
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Merge Modal */}
      <AnimatePresence>
        {showMergeModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center gap-2">
                <Merge className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-black">Merge Duplicate Records</h2>
              </div>
              <form onSubmit={handleMerge} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Duplicate (Source) ID *</label>
                  <input
                    type="text"
                    required
                    value={mergeSourceId}
                    onChange={(e) => setMergeSourceId(e.target.value)}
                    placeholder="Paste duplicate ID"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Master (Target) ID *</label>
                  <input
                    type="text"
                    required
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    placeholder="Paste master ID"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMergeModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    Run Merge
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Assign Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-900 dark:text-slate-100"
            >
              <h2 className="text-lg font-black">Bulk Categorize ({selectedIds.length} Companies)</h2>
              <form onSubmit={handleBulkAssign} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Target Lender *</label>
                  <select
                    required
                    value={bulkBankId}
                    onChange={(e) => setBulkBankId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  >
                    <option value="">Select Bank / NBFC</option>
                    {banks.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Category Tier</label>
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  >
                    {CATEGORY_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    Apply Bulk Tier
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
