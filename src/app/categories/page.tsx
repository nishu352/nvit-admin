"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { useCategoriesQuery, useBanksQuery } from "@/hooks/useAdminQueries";
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building,
  CheckCircle,
  XCircle,
  HelpCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { getCategoryStatus } from "@/utils/categoryStatus";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface CategoryMapping {
  id: string;
  companyId: string;
  bankId: string;
  category: string;
  status: string;
  remarks?: string | null;
  company: {
    id: string;
    name: string;
    cin?: string | null;
  };
  bank: {
    id: string;
    name: string;
    code: string;
  };
}

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const { data: categoriesData, isLoading: loading, refetch: fetchMappings } = useCategoriesQuery(
    page,
    search
  );
  const { data: banks = [] } = useBanksQuery();

  const mappings = (categoriesData?.items || []) as unknown as CategoryMapping[];
  const totalPages = categoriesData?.totalPages || 1;

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CategoryMapping | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryMapping | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [companyId, setCompanyId] = useState("");
  const [bankId, setBankId] = useState("");
  const [category, setCategory] = useState("CAT A");
  const [status, setStatus] = useState("APPROVED");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      companyId,
      bankId,
      category,
      status,
      remarks: remarks.trim() || undefined,
    };

    try {
      if (editingMapping) {
        await apiClient.put(`/admin/categories/${editingMapping.id}`, { category, status, remarks });
        showToast({ title: "Classification updated", type: "success" });
      } else {
        await apiClient.post("/admin/categories", payload);
        showToast({ title: "Classification created", type: "success" });
      }
      setShowModal(false);
      fetchMappings();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save classification";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/admin/categories/${deleteTarget.id}`);
      showToast({ title: "Classification removed", type: "success" });
      setDeleteTarget(null);
      fetchMappings();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete classification";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (m: CategoryMapping) => {
    setEditingMapping(m);
    setCompanyId(m.companyId);
    setBankId(m.bankId);
    setCategory(m.category);
    setStatus(m.status);
    setRemarks(m.remarks || "");
    setShowModal(true);
  };

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Institutional Category Mappings
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Cross-reference bank-specific employer category tiers for eligibility and multiplier underwriting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchMappings()}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by company name or category tier..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Table Container ──────────────────────────────────── */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={5} />
      ) : mappings.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <Tag className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No category mappings found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? "No classifications match your search query."
              : "Category records will populate when employers are classified across partner banks."}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employer Entity</th>
                  <th>Partner Lender</th>
                  <th>Classification Tier</th>
                  <th>Approval Status</th>
                  <th>Underwriting Remarks</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => {
                  const visual = getCategoryStatus(m.category);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                            {m.company?.name || "Company"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {m.company?.cin || "UNLISTED"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block">
                            {m.bank?.name || "Bank"}
                          </span>
                          <span className="text-[10px] font-mono text-blue-400 font-bold">
                            {m.bank?.code || "CODE"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-black border font-mono ${visual.badgeClass}`}
                        >
                          {m.category}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-1.5">
                          {m.status === "APPROVED" ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : m.status === "BLOCKED" || m.status === "REJECTED" ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span
                            className={`text-xs font-bold ${
                              m.status === "APPROVED"
                                ? "text-emerald-400"
                                : m.status === "BLOCKED" || m.status === "REJECTED"
                                ? "text-rose-400"
                                : "text-amber-400"
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                      </td>
                      <td className="text-slate-400 text-xs font-medium max-w-xs truncate" title={m.remarks || ""}>
                        {m.remarks || "—"}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            title="Edit Tier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(m)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Classification"
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

      {/* ── Edit Modal ────────────────────────────────────────── */}
      {showModal && editingMapping && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={`Edit Tier: ${editingMapping.company.name}`}
          description={`Lender: ${editingMapping.bank.name} (${editingMapping.bank.code})`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Category Tier *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
                >
                  <option value="SUPER A">SUPER A (Tier 1)</option>
                  <option value="CAT A">CAT A (Prime)</option>
                  <option value="CAT B">CAT B</option>
                  <option value="CAT C">CAT C</option>
                  <option value="CAT D">CAT D (Subprime)</option>
                  <option value="UNLISTED">UNLISTED</option>
                  <option value="NEGATIVE">NEGATIVE / REJECT</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Underwriting Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="CONDITIONAL">CONDITIONAL</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Underwriting Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Approved with minimum 3.5L salary multiplier"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
              />
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
                disabled={isSubmitting}
                className="btn-primary h-10 px-5 text-xs font-bold"
              >
                {isSubmitting ? "Saving..." : "Save Classification"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Dialog ───────────────────────── */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Category Mapping?"
          description={`Are you sure you want to remove the ${deleteTarget.category} tier classification for ${deleteTarget.company?.name} under ${deleteTarget.bank?.name}?`}
          confirmLabel="Delete Classification"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
