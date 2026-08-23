"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { usePincodesQuery, useBanksQuery } from "@/hooks/useAdminQueries";
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Globe,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Pincode } from "@/types";

export default function AdminPincodesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const { data: pincodesData, isLoading: loading, refetch: fetchPincodes } = usePincodesQuery(
    page,
    search
  );
  const { data: banks = [] } = useBanksQuery();

  const pincodes = (pincodesData?.items || []) as Pincode[];
  const totalPages = pincodesData?.totalPages || 1;

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState<Pincode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pincode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [pincode, setPincode] = useState("");
  const [bankId, setBankId] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [isServiceable, setIsServiceable] = useState(true);
  const [isNegative, setIsNegative] = useState(false);
  const [category, setCategory] = useState("PREFERRED");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      pincode: pincode.trim(),
      bankId,
      state: state.trim() || undefined,
      city: city.trim() || undefined,
      area: area.trim() || undefined,
      isServiceable,
      isNegative,
      category,
    };

    try {
      if (editingPincode) {
        await apiClient.put(`/admin/pincodes/${editingPincode.id}`, payload);
        showToast({ title: "Pincode record updated", type: "success" });
      } else {
        await apiClient.post("/admin/pincodes", payload);
        showToast({ title: "Pincode record added", type: "success" });
      }
      setShowModal(false);
      fetchPincodes();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save pincode";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/admin/pincodes/${deleteTarget.id}`);
      showToast({ title: "Pincode record deleted", type: "success" });
      setDeleteTarget(null);
      fetchPincodes();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete pincode";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingPincode(null);
    setPincode("");
    setBankId(banks[0]?.id || "");
    setState("");
    setCity("");
    setArea("");
    setIsServiceable(true);
    setIsNegative(false);
    setCategory("PREFERRED");
    setShowModal(true);
  };

  const openEditModal = (p: Pincode) => {
    setEditingPincode(p);
    setPincode(p.pincode);
    setBankId(p.bankId || "");
    setState(p.state || "");
    setCity(p.city || "");
    setArea(p.area || "");
    setIsServiceable(p.isServiceable);
    setIsNegative(p.isNegative || false);
    setCategory(p.category || "PREFERRED");
    setShowModal(true);
  };

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Pan-India Pincode Registry
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Postal code serviceability maps, negative credit areas, and lender branch coverage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link href="/pincodes/import" className="btn-secondary h-10 px-4 text-xs font-bold">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Batch Excel Import</span>
          </Link>
          <button onClick={openAddModal} className="btn-primary h-10 px-4 text-xs">
            <Plus className="w-4 h-4" />
            <span>Add Single Pincode</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search 6-digit postal code, city, or state..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Table Container ──────────────────────────────────── */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={5} />
      ) : pincodes.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No postal code records found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? "No postal codes match your search query."
              : "Import your master postal code database or register individual records."}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Postal Code</th>
                  <th>City &amp; State</th>
                  <th>Lender Partner</th>
                  <th>Serviceability</th>
                  <th>Area Category</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pincodes.map((pin) => (
                  <tr key={pin.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-white/[0.06] px-2 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08]">
                          {pin.pincode}
                        </span>
                        {pin.isNegative && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black badge-rose">
                            NEGATIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          {pin.city || "—"}, {pin.state || "—"}
                        </span>
                        {pin.area && (
                          <span className="text-[10px] text-slate-400 font-medium truncate block max-w-xs">
                            {pin.area}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                          {pin.bank?.name || "Global / Unassigned"}
                        </span>
                        {pin.bank?.code && (
                          <span className="text-[10px] font-mono text-blue-400">
                            {pin.bank.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          pin.isServiceable ? "badge-emerald" : "badge-rose"
                        }`}
                      >
                        {pin.isServiceable ? "SERVICEABLE" : "UNSERVICEABLE"}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {pin.category || "PREFERRED"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(pin)}
                          className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          title="Edit Pincode"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(pin)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Pincode"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* ── Add/Edit Modal ────────────────────────────────────── */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingPincode ? `Edit Postal Code: ${editingPincode.pincode}` : "Register Postal Zone"}
          description="Configure postal code serviceability, city/state taxonomy, and bank coverage."
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Postal Code (6 Digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 110001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-bold rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Partner Bank Binding</label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
                >
                  <option value="">Global / All Lenders</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">City / District</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Locality / Area Name</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Connaught Place, Barakhamba Road"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isServiceable"
                  checked={isServiceable}
                  onChange={(e) => setIsServiceable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <label
                  htmlFor="isServiceable"
                  className="text-xs font-bold text-slate-200 cursor-pointer"
                >
                  Serviceable Zone
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isNegative"
                  checked={isNegative}
                  onChange={(e) => setIsNegative(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                />
                <label
                  htmlFor="isNegative"
                  className="text-xs font-bold text-rose-400 cursor-pointer"
                >
                  Negative / Risk Area
                </label>
              </div>
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
                {isSubmitting ? "Saving..." : "Save Postal Record"}
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
          title={`Delete Postal Code ${deleteTarget.pincode}?`}
          description={`Are you sure you want to remove ${deleteTarget.pincode} (${deleteTarget.city}, ${deleteTarget.state})? Serviceability checks for this zone will fall back to unlisted.`}
          confirmLabel="Delete Postal Record"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
