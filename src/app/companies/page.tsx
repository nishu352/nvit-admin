"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { apiClient } from "@/services/apiClient";
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
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [cin, setCin] = useState("");
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [bulkBankId, setBulkBankId] = useState("");
  const [bulkCategory, setBulkCategory] = useState("CAT A");
  const [bulkStatus, setBulkStatus] = useState("APPROVED");
  const [bulkRemarks, setBulkRemarks] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/companies?page=${page}&limit=20&query=${search}`);
      if (res.data.success) {
        setCompanies(res.data.data.items);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch companies", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await apiClient.get("/admin/banks");
      if (res.data.success) {
        setBanks(res.data.data);
        if (res.data.data.length > 0) {
          setBulkBankId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, search]);

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await apiClient.put(`/admin/companies/${editingCompany.id}`, { name, cin });
      } else {
        await apiClient.post("/admin/companies", { name, cin });
      }
      setShowAddModal(false);
      fetchCompanies();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company? All bank classifications will be permanently removed!")) return;
    try {
      await apiClient.delete(`/admin/companies/${id}`);
      fetchCompanies();
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
        remarks: bulkRemarks,
      });
      setShowBulkModal(false);
      setSelectedIds([]);
      setBulkRemarks("");
      fetchCompanies();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === companies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(companies.map((c) => c.id));
    }
  };

  const handleExportCSV = () => {
    const headers = "Company ID,Company Name,CIN,Bank Mappings\n";
    const rows = companies.map((c) => {
      const mappingsStr = c.bankCategories
        .map((bc: any) => `${bc.bank.code}: ${bc.category} (${bc.status})`)
        .join(" | ");
      return `"${c.id}","${c.name}","${c.cin || "N/A"}","${mappingsStr}"`;
    });
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NVIT_Companies_${Date.now()}.csv`;
    a.click();
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
                <Building className="w-5 h-5 text-indigo-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Company Management</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Maintain corporate classification indices, map categories, and merge duplicates</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMergeModal(true)}
                className="h-10 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Merge className="w-4 h-4 text-purple-400" />
                <span>Merge Duplicates</span>
              </button>
              <button
                onClick={() => {
                  setEditingCompany(null);
                  setName("");
                  setCin("");
                  setShowAddModal(true);
                }}
                className="h-10 px-4 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Company</span>
              </button>
            </div>
          </div>

          {/* Filters & Bulk Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by company name, cin..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="h-10 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>Bulk Re-Classify ({selectedIds.length})</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="h-10 px-4 rounded-xl bg-slate-900/60 border border-slate-850 hover:bg-slate-900 text-slate-300 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {loading ? (
            <AdminTableSkeleton rows={8} columns={5} />
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-350 text-[10px] uppercase font-black tracking-wider border-b border-slate-800">
                      <th className="py-4 px-6 w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white cursor-pointer">
                          {selectedIds.length === companies.length && companies.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-4 px-6">Company Name</th>
                      <th className="py-4 px-6">CIN Identifier</th>
                      <th className="py-4 px-6">Lender Classifications</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-200">
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                          No company records match the query.
                        </td>
                      </tr>
                    ) : (
                      companies.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-4.5 px-6">
                            <button onClick={() => toggleSelect(c.id)} className="text-slate-400 hover:text-white cursor-pointer">
                              {selectedIds.includes(c.id) ? (
                                <CheckSquare className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-4.5 px-6 font-black text-white">{c.name}</td>
                          <td className="py-4.5 px-6 font-mono text-[10px] text-slate-450">{c.cin || "UNLISTED"}</td>
                          <td className="py-4.5 px-6">
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {c.bankCategories.length === 0 ? (
                                <span className="text-[9px] font-bold text-slate-600">No Mappings</span>
                              ) : (
                                c.bankCategories.map((bc: any) => (
                                  <span
                                    key={bc.id}
                                    className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                                      bc.category === "CAT A"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : bc.category === "CAT B"
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-slate-950 text-slate-500 border-slate-850"
                                    }`}
                                    title={`${bc.bank.name}: ${bc.remarks || "No remarks"}`}
                                  >
                                    {bc.bank.code}: {bc.category}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-4.5 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCompany(c);
                                  setName(c.name);
                                  setCin(c.cin || "");
                                  setShowAddModal(true);
                                }}
                                className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
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

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-850 text-xs font-bold text-slate-400">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add / Edit Modal */}
          <AnimatePresence>
            {showAddModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800 space-y-6 text-slate-100"
                >
                  <h2 className="text-lg font-black text-white">{editingCompany ? "Modify Company Index" : "Register Company Index"}</h2>
                  <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. INFOSYS LTD"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold uppercase focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Corporate CIN (Optional)</label>
                      <input
                        type="text"
                        value={cin}
                        onChange={(e) => setCin(e.target.value)}
                        placeholder="e.g. L72200KA1981PLC013115"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold uppercase focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-royal text-white text-xs font-bold cursor-pointer"
                      >
                        Save Company
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Merge Duplicates Modal */}
          <AnimatePresence>
            {showMergeModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800 space-y-6 text-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <Merge className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-black text-white">Merge Duplicate Indexing</h2>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Merge category maps from a duplicate record into a master record, then purge the duplicate.</p>

                  <form onSubmit={handleMerge} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Duplicate (Source) Company ID *</label>
                      <input
                        type="text"
                        required
                        value={mergeSourceId}
                        onChange={(e) => setMergeSourceId(e.target.value)}
                        placeholder="Paste duplicate ID here"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 flex items-center justify-center text-slate-650 py-1">
                      <ArrowRight className="w-6 h-6 rotate-90 sm:rotate-0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Master (Target) Company ID *</label>
                      <input
                        type="text"
                        required
                        value={mergeTargetId}
                        onChange={(e) => setMergeTargetId(e.target.value)}
                        placeholder="Paste master ID here"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowMergeModal(false)}
                        className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Run Merge Execution
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
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800 space-y-6 text-slate-100"
                >
                  <h2 className="text-lg font-black text-white">Bulk Re-Classify Categories ({selectedIds.length})</h2>
                  <form onSubmit={handleBulkAssign} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Bank *</label>
                      <select
                        value={bulkBankId}
                        onChange={(e) => setBulkBankId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        {banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category *</label>
                        <select
                          value={bulkCategory}
                          onChange={(e) => setBulkCategory(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="CAT A">Category A</option>
                          <option value="CAT B">Category B</option>
                          <option value="CAT C">Category C</option>
                          <option value="UNLISTED">Unlisted</option>
                          <option value="REJECT">Reject / Block</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Classification Status *</label>
                        <select
                          value={bulkStatus}
                          onChange={(e) => setBulkStatus(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="APPROVED">APPROVED</option>
                          <option value="CONDITIONAL">CONDITIONAL</option>
                          <option value="BLOCKED">BLOCKED</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Internal Remarks</label>
                      <input
                        type="text"
                        value={bulkRemarks}
                        onChange={(e) => setBulkRemarks(e.target.value)}
                        placeholder="e.g. Revised circular change"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkModal(false)}
                        className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer hover:bg-amber-600 transition-colors"
                      >
                        Run Update Execution
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

