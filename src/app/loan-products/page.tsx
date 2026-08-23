"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { useLoanProductsQuery, useBanksQuery } from "@/hooks/useAdminQueries";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  Building2,
  Clock,
  Percent,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { LoanProduct, Bank } from "@/types";

export default function AdminLoanProductsPage() {
  const [selectedBankId, setSelectedBankId] = useState("");
  const { showToast } = useToast();

  const { data: products = [], isLoading: loading, refetch: fetchProducts } = useLoanProductsQuery(
    selectedBankId || undefined
  );
  const { data: banks = [] } = useBanksQuery();

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [bankId, setBankId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [roiRange, setRoiRange] = useState("10.5% - 15%");
  const [maxTenure, setMaxTenure] = useState(60);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      bankId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      roiRange: roiRange.trim() || undefined,
      maxTenure: Number(maxTenure),
      description: description.trim() || undefined,
      isActive,
    };

    try {
      if (editingProduct) {
        await apiClient.put(`/admin/products/${editingProduct.id}`, payload);
        showToast({ title: "Loan product updated", type: "success" });
      } else {
        await apiClient.post("/admin/products", payload);
        showToast({ title: "Loan product created", type: "success" });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save product";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/admin/products/${deleteTarget.id}`);
      showToast({ title: "Loan product deleted", type: "success" });
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete product";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setBankId(banks[0]?.id || "");
    setName("");
    setCode("PL");
    setRoiRange("10.5% - 15.0%");
    setMaxTenure(60);
    setDescription("");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (p: LoanProduct) => {
    setEditingProduct(p);
    setBankId(p.bankId);
    setName(p.name);
    setCode(p.code || "PL");
    setRoiRange(p.roiRange || "");
    setMaxTenure(p.maxTenure || 60);
    setDescription(p.description || "");
    setIsActive(p.isActive);
    setShowModal(true);
  };

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Loan Product Catalog
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Financial product offerings, interest rate bands, tenure limits, and lender specifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button onClick={openAddModal} className="btn-primary h-10 px-4 text-xs">
            <Plus className="w-4 h-4" />
            <span>Create Loan Product</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Filter by Lender:</span>
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold focus:outline-none"
          >
            <option value="">All Partner Lenders</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing {products.length} Products
        </span>
      </div>

      {/* ── Products Grid ────────────────────────────────────── */}
      {loading ? (
        <AdminCardGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No loan products cataloged
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {selectedBankId
              ? "No products configured for this lender."
              : "Register your first loan product to begin underwriting."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((prod) => (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {prod.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                        {prod.code}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {prod.bank?.name || "Global Partner"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      prod.isActive ? "badge-emerald" : "badge-rose"
                    }`}
                  >
                    {prod.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <Percent className="w-3 h-3 text-sky-400" />
                      <span>Interest Band</span>
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono block">
                      {prod.roiRange || "10.5% - 15%"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Max Tenure</span>
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono block">
                      {prod.maxTenure || 60} Months
                    </span>
                  </div>
                </div>

                {prod.description && (
                  <p className="text-xs text-slate-400 font-medium line-clamp-2">
                    {prod.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-1">
                <button
                  onClick={() => openEditModal(prod)}
                  className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                  title="Edit Product"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(prod)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingProduct ? `Edit: ${editingProduct.name}` : "Create Loan Product"}
          description="Configure product specifications, tenure parameters, and lender bindings."
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Salaried Personal Loan Prime"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Product Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PL-PRIME"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-bold rounded-xl focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Partner Lender *</label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ROI Range Text</label>
                <input
                  type="text"
                  value={roiRange}
                  onChange={(e) => setRoiRange(e.target.value)}
                  placeholder="e.g. 10.5% - 15.0%"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Max Tenure (Months)</label>
                <input
                  type="number"
                  min={6}
                  max={360}
                  value={maxTenure}
                  onChange={(e) => setMaxTenure(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="prodActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600"
                />
                <label htmlFor="prodActive" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Product Active in Engine
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Product Overview Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product eligibility features, target borrower segment..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-medium rounded-xl focus:outline-none resize-none"
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
                {isSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
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
          title={`Delete ${deleteTarget.name}?`}
          description={`Are you sure you want to delete ${deleteTarget.name} (${deleteTarget.code})? Existing active policies using this product may be impacted.`}
          confirmLabel="Delete Loan Product"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
