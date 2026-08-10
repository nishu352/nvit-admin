"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { apiClient } from "@/services/apiClient";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function AdminLoanProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form Fields
  const [bankId, setBankId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [roiRange, setRoiRange] = useState("10.5% - 15%");
  const [maxTenure, setMaxTenure] = useState(60);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/products${selectedBankId ? `?bankId=${selectedBankId}` : ""}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await apiClient.get("/admin/banks");
      if (res.data.success) {
        setBanks(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedBankId]);

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      bankId,
      name,
      code,
      roiRange,
      maxTenure: Number(maxTenure),
      description: description || null,
      isActive,
    };

    try {
      if (editingProduct) {
        await apiClient.put(`/admin/products/${editingProduct.id}`, payload);
      } else {
        await apiClient.post("/admin/products", payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this loan product?")) return;
    try {
      await apiClient.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setBankId(banks[0]?.id || "");
    setName("");
    setCode("PL");
    setRoiRange("10.5% - 15%");
    setMaxTenure(60);
    setDescription("");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setBankId(p.bankId);
    setName(p.name);
    setCode(p.code);
    setRoiRange(p.roiRange || "");
    setMaxTenure(p.maxTenure || 60);
    setDescription(p.description || "");
    setIsActive(p.isActive);
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
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Loan Products Registry</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage available product catalogs, custom interest rate tags, and terms</p>
            </div>
            <button
              onClick={openAddModal}
              className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Define Product</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Filter Bank:</span>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">All Banks & NBFCs</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading products catalog...</p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-350 text-[10px] uppercase font-black tracking-wider border-b border-slate-800">
                      <th className="py-4 px-6">Product Name</th>
                      <th className="py-4 px-6">Short Code</th>
                      <th className="py-4 px-6">Lender Bank</th>
                      <th className="py-4 px-6">ROI Range</th>
                      <th className="py-4 px-6">Max Tenure</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-200">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                          No loan products registered.
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-4.5 px-6 font-black text-white">{p.name}</td>
                          <td className="py-4.5 px-6 font-mono text-[10px] text-indigo-400 uppercase tracking-wider">{p.code}</td>
                          <td className="py-4.5 px-6 font-mono text-[10px] text-slate-400">{p.bank.name} ({p.bank.code})</td>
                          <td className="py-4.5 px-6 text-slate-300 font-extrabold">{p.roiRange || "N/A"}</td>
                          <td className="py-4.5 px-6 text-slate-300 font-extrabold">{p.maxTenure ? `${p.maxTenure} mo` : "N/A"}</td>
                          <td className="py-4.5 px-6">
                            <div className="flex items-center space-x-1.5">
                              {p.isActive ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">ACTIVE</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-slate-650" />
                                  <span className="text-slate-500">INACTIVE</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4.5 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(p)}
                                className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 hover:border-rose-900 hover:bg-rose-950/20 flex items-center justify-center text-slate-400 hover:text-rose-450 cursor-pointer"
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
                  <h2 className="text-lg font-black text-white">{editingProduct ? "Modify Product Details" : "Register Loan Product"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Bank */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Bank *</label>
                      <select
                        disabled={!!editingProduct}
                        value={bankId}
                        onChange={(e) => setBankId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        {banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Premium Home Loan"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Code */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Short Code *</label>
                        <select
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="PL">PL (Personal Loan)</option>
                          <option value="HL">HL (Home Loan)</option>
                          <option value="BL">BL (Business Loan)</option>
                          <option value="LAP">LAP (Loan Against Property)</option>
                          <option value="VL">VL (Vehicle Loan)</option>
                          <option value="CC">CC (Credit Card)</option>
                        </select>
                      </div>

                      {/* Max Tenure */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Max Tenure (Mo)</label>
                        <input
                          type="number"
                          required
                          value={maxTenure}
                          onChange={(e) => setMaxTenure(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* ROI Range */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Interest Rate (ROI Range Text) *</label>
                      <input
                        type="text"
                        required
                        value={roiRange}
                        onChange={(e) => setRoiRange(e.target.value)}
                        placeholder="e.g. 10.5% - 14.5% p.a."
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Product Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Specify target segments, exclusive benefits, key features..."
                        className="w-full h-16 px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 accent-royal"
                      />
                      <label htmlFor="isActive" className="text-xs font-bold text-slate-350 cursor-pointer">
                        Mark Product Active
                      </label>
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
                        Save Product
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
