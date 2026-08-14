"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { apiClient } from "@/services/apiClient";
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
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";

export default function AdminCategoriesPage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<any>(null);

  // Form Fields
  const [companyId, setCompanyId] = useState("");
  const [bankId, setBankId] = useState("");
  const [category, setCategory] = useState("CAT A");
  const [status, setStatus] = useState("APPROVED");
  const [remarks, setRemarks] = useState("");

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/categories?page=${page}&limit=20&search=${search}`);
      if (res.data.success) {
        setMappings(res.data.data.items);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const [banksRes, cosRes] = await Promise.all([
        apiClient.get("/admin/banks"),
        apiClient.get("/admin/companies?limit=100"),
      ]);
      if (banksRes.data.success) setBanks(banksRes.data.data);
      if (cosRes.data.success) setCompanies(cosRes.data.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, [page, search]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      companyId,
      bankId,
      category,
      status,
      remarks: remarks || null,
    };

    try {
      if (editingMapping) {
        await apiClient.put(`/admin/categories/${editingMapping.id}`, { category, status, remarks });
      } else {
        await apiClient.post("/admin/categories", payload);
      }
      setShowModal(false);
      fetchMappings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category classification?")) return;
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      fetchMappings();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingMapping(null);
    setCompanyId(companies[0]?.id || "");
    setBankId(banks[0]?.id || "");
    setCategory("CAT A");
    setStatus("APPROVED");
    setRemarks("");
    setShowModal(true);
  };

  const openEditModal = (m: any) => {
    setEditingMapping(m);
    setCompanyId(m.companyId);
    setBankId(m.bankId);
    setCategory(m.category);
    setStatus(m.status);
    setRemarks(m.remarks || "");
    setShowModal(true);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-royal selection:text-white">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <AdminHeader />

        <main className="flex-1 p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Category Mappings</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage bank-specific category mapping tables for salaries and approvals</p>
            </div>
            <button
              onClick={openAddModal}
              className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Map Classification</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by company name or category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {loading ? (
            <AdminTableSkeleton rows={8} columns={5} />
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-350 text-[10px] uppercase font-black tracking-wider border-b border-slate-800">
                      <th className="py-4 px-6">Company</th>
                      <th className="py-4 px-6">Lender Bank</th>
                      <th className="py-4 px-6">Assigned Category</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Remarks</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-200">
                    {mappings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                          No category mapping records found.
                        </td>
                      </tr>
                    ) : (
                      mappings.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-4.5 px-6 font-black text-white">
                            <div>{m.company.name}</div>
                            <div className="text-[9px] font-mono text-slate-500 font-extrabold">{m.company.cin || "UNLISTED"}</div>
                          </td>
                          <td className="py-4.5 px-6">
                            <div className="font-extrabold text-slate-350">{m.bank.name}</div>
                            <div className="text-[9px] font-mono text-blue-400">{m.bank.code}</div>
                          </td>
                          <td className="py-4.5 px-6">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-blue-500/10 border border-blue-500/20 text-blue-400">
                              {m.category}
                            </span>
                          </td>
                          <td className="py-4.5 px-6">
                            <div className="flex items-center space-x-1.5">
                              {m.status === "APPROVED" ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              ) : m.status === "BLOCKED" ? (
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              ) : (
                                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span className={m.status === "APPROVED" ? "text-emerald-400" : m.status === "BLOCKED" ? "text-rose-400" : "text-amber-400"}>
                                {m.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4.5 px-6 font-semibold text-slate-400 max-w-xs truncate" title={m.remarks}>
                            {m.remarks || "—"}
                          </td>
                          <td className="py-4.5 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(m)}
                                className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 hover:border-rose-900 hover:bg-rose-950/20 flex items-center justify-center text-slate-400 hover:text-rose-450 cursor-pointer"
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
                <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-850 text-xs font-bold text-slate-400">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
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
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800 space-y-6 text-slate-100"
                >
                  <h2 className="text-lg font-black text-white">{editingMapping ? "Edit Classification Mapping" : "Map Institutional Classification"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Company */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Company *</label>
                      <select
                        disabled={!!editingMapping}
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white disabled:opacity-50 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bank */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lender Institution *</label>
                      <select
                        disabled={!!editingMapping}
                        value={bankId}
                        onChange={(e) => setBankId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white disabled:opacity-50 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        {banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category Category *</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="CAT A">Category A (Prime)</option>
                          <option value="CAT B">Category B</option>
                          <option value="CAT C">Category C</option>
                          <option value="CAT D">Category D (Subprime)</option>
                          <option value="UNLISTED">Unlisted</option>
                          <option value="REJECT">Reject / Blocked</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Approval Status *</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="APPROVED">APPROVED</option>
                          <option value="CONDITIONAL">CONDITIONAL</option>
                          <option value="BLOCKED">BLOCKED</option>
                        </select>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Classification Remarks</label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Multiplier code changed"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-royal text-white text-xs font-bold cursor-pointer"
                      >
                        Save Mapping
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
