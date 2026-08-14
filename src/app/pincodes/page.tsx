"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/apiClient";
import { usePincodesQuery, useBanksQuery, ADMIN_QUERY_KEYS } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";

export default function AdminPincodesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: pincodesData, isLoading: loading, refetch: fetchPincodes } = usePincodesQuery(page, search);
  const { data: banks = [] } = useBanksQuery();

  const pincodes = pincodesData?.items || [];
  const totalPages = pincodesData?.totalPages || 1;

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState<any>(null);

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
    const payload = {
      pincode,
      bankId,
      state: state || null,
      city: city || null,
      area: area || null,
      isServiceable,
      isNegative,
      category,
    };

    try {
      if (editingPincode) {
        await apiClient.put(`/admin/pincodes/${editingPincode.id}`, payload);
      } else {
        await apiClient.post("/admin/pincodes", payload);
      }
      setShowModal(false);
      fetchPincodes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pincode mapping?")) return;
    try {
      await apiClient.delete(`/admin/pincodes/${id}`);
      fetchPincodes();
    } catch (err) {
      console.error(err);
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

  const openEditModal = (p: any) => {
    setEditingPincode(p);
    setPincode(p.pincode);
    setBankId(p.bankId);
    setState(p.state || "");
    setCity(p.city || "");
    setArea(p.area || "");
    setIsServiceable(p.isServiceable);
    setIsNegative(p.isNegative);
    setCategory(p.category || "PREFERRED");
    setShowModal(true);
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pincode Registry</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">Manage bank coverage grids, serviceable zones, and risk-restricted areas</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Map Pincode</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by pincode, city, state..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} columns={6} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-350 text-[10px] uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6">Pincode</th>
                  <th className="py-4 px-6">Location Details</th>
                  <th className="py-4 px-6">Mapped Bank</th>
                  <th className="py-4 px-6">Service Type</th>
                  <th className="py-4 px-6">Classification</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-bold text-slate-700 dark:text-slate-200">
                {pincodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No pincode serviceability records found.
                    </td>
                  </tr>
                ) : (
                  pincodes.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="py-4.5 px-6 font-black text-slate-900 dark:text-white text-sm tracking-wider font-mono">
                        {p.pincode}
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="font-extrabold text-slate-800 dark:text-slate-300">{p.area || "—"}</div>
                        <div className="text-[9px] font-mono text-slate-500 font-extrabold uppercase">
                          {p.city || "—"}, {p.state || "—"}
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="text-[10px] font-mono font-extrabold text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-850">
                          {p.bank.name} ({p.bank.code})
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex flex-col space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black border w-max ${
                            p.isServiceable
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                              : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                          }`}>
                            {p.isServiceable ? "SERVICEABLE" : "NON-SERVICEABLE"}
                          </span>
                          {p.isNegative && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 w-max flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>NEGATIVE AREA</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                          p.category === "PREFERRED"
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                            : p.category === "RESTRICTED"
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                            : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-850"
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-850 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-900 dark:text-slate-100"
            >
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingPincode ? "Modify Pincode Serviceability" : "Map Pincode Serviceability"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pincode */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 560001"
                      maxLength={6}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Bank */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Mapped Bank *</label>
                    <select
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      {banks.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Karnataka"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Area */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Area / Circle</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. MG Road"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isServiceable"
                      checked={isServiceable}
                      onChange={(e) => setIsServiceable(e.target.checked)}
                      className="w-4 h-4 accent-royal"
                    />
                    <label htmlFor="isServiceable" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                      Serviceable Area
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isNegative"
                      checked={isNegative}
                      onChange={(e) => setIsNegative(e.target.checked)}
                      className="w-4 h-4 accent-rose-600"
                    />
                    <label htmlFor="isNegative" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer text-rose-600 dark:text-rose-400">
                      Negative List Area
                    </label>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Pincode Category Classification</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="PREFERRED">PREFERRED ZONE (No checks)</option>
                    <option value="ACCEPTABLE">ACCEPTABLE (Verifier check)</option>
                    <option value="RESTRICTED">RESTRICTED / SLOW PIN</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-bold cursor-pointer"
                  >
                    Save Pincode
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
