"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/apiClient";
import { useBanksQuery, ADMIN_QUERY_KEYS } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Activity,
  Sliders,
  DollarSign,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { formatCurrency } from "@/lib/utils";

export default function AdminBanksPage() {
  const queryClient = useQueryClient();
  const { data: banks = [], isLoading: loading, refetch: fetchBanks } = useBanksQuery();
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"BANK" | "NBFC">("BANK");
  const [logoUrl, setLogoUrl] = useState("");
  const [priority, setPriority] = useState(1);
  const [partnerStatus, setPartnerStatus] = useState("ACTIVE");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [eligibility, setEligibility] = useState("");
  const [processingFee, setProcessingFee] = useState(1.0);



  const openAddModal = () => {
    setEditingBank(null);
    setName("");
    setCode("");
    setType("BANK");
    setLogoUrl("");
    setPriority(1);
    setPartnerStatus("ACTIVE");
    setDisplayOrder(1);
    setEligibility("");
    setProcessingFee(1.0);
    setShowModal(true);
  };

  const openEditModal = (bank: any) => {
    setEditingBank(bank);
    setName(bank.name);
    setCode(bank.code);
    setType(bank.type);
    setLogoUrl(bank.logoUrl || "");
    setPriority(bank.priority || 1);
    setPartnerStatus(bank.partnerStatus || "ACTIVE");
    setDisplayOrder(bank.displayOrder || 1);
    setEligibility(bank.eligibility || "");
    setProcessingFee(bank.processingFee || 1.0);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      code,
      type,
      logoUrl: logoUrl || null,
      priority: Number(priority),
      partnerStatus,
      displayOrder: Number(displayOrder),
      eligibility,
      processingFee: Number(processingFee),
    };

    try {
      if (editingBank) {
        await apiClient.put(`/admin/banks/${editingBank.id}`, payload);
      } else {
        await apiClient.post("/admin/banks", payload);
      }
      setShowModal(false);
      fetchBanks();
    } catch (err) {
      console.error("Failed to save bank", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lender? This will purge all associated company classifications and pincodes!")) return;
    try {
      await apiClient.delete(`/admin/banks/${id}`);
      fetchBanks();
    } catch (err) {
      console.error("Failed to delete bank", err);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await apiClient.patch(`/admin/banks/${id}/toggle`);
      fetchBanks();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleClearCompanies = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to clear all imported company data for ${name}? This action cannot be undone.`)) return;
    try {
      await apiClient.delete(`/admin/banks/${id}/data/companies`);
      fetchBanks();
    } catch (err) {
      console.error("Failed to clear company data", err);
    }
  };

  const handleClearPincodes = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to clear all imported pincode data for ${name}? This action cannot be undone.`)) return;
    try {
      await apiClient.delete(`/admin/banks/${id}/data/pincodes`);
      fetchBanks();
    } catch (err) {
      console.error("Failed to clear pincode data", err);
    }
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Institutional Lenders</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage partner banks, NBFC circular status, and verification levels</p>
            </div>
            <button
              onClick={openAddModal}
              className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black shadow-lg shadow-royal/20 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Lender</span>
            </button>
          </div>

          {loading ? (
            <AdminCardGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banks.map((bank: any) => (
                <div key={bank.id} className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-64">
                  {/* Card Top */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center font-bold text-blue-400">
                          {bank.logoUrl ? (
                            <img src={bank.logoUrl} alt={bank.code} className="w-6 h-6 object-contain" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-xs leading-none mb-1">{bank.name}</h3>
                          <span className="text-[9px] font-mono text-slate-500 font-extrabold uppercase">CODE: {bank.code} • Priority: {bank.priority || 1}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-black border ${
                        bank.type === "BANK"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}>
                        {bank.type}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-[11px] font-semibold text-slate-400 pt-2">
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Partner Status:</span>
                        <span className={`font-black ${
                          bank.partnerStatus === "ACTIVE" ? "text-emerald-400" : "text-amber-500"
                        }`}>{bank.partnerStatus || "ACTIVE"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Processing Fee:</span>
                        <span className="font-extrabold text-white">{bank.processingFee || 1.0}%</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Indexed Categories:</span>
                        <span className="font-extrabold text-white">{bank._count?.companyCategories || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pincode Coverage:</span>
                        <span className="font-extrabold text-white">{bank._count?.pincodeServices || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Actions */}
                  <div className="pt-5 mt-4 border-t border-slate-900/60 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleActive(bank.id)}
                      className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {bank.isActive ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                          <span className="text-emerald-400">Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-slate-650" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleClearCompanies(bank.id, bank.name)}
                        className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-amber-700 hover:bg-amber-950/20 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer text-[10px] font-bold"
                        title="Clear Company Data"
                      >
                        Clear Companies
                      </button>
                      <button
                        onClick={() => handleClearPincodes(bank.id, bank.name)}
                        className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-amber-700 hover:bg-amber-950/20 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer text-[10px] font-bold"
                        title="Clear Pincode Data"
                      >
                        Clear Pincodes
                      </button>
                      <button
                        onClick={() => openEditModal(bank)}
                        className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Lender Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bank.id)}
                        className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850 hover:border-rose-900 hover:bg-rose-950/20 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Lender"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                  className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-800 space-y-6 text-slate-100"
                >
                  <h2 className="text-lg font-black text-white">{editingBank ? "Modify Institutional Lender" : "Register New Lender"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lender Name *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. HDFC Bank Ltd"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-royal"
                        />
                      </div>

                      {/* Code */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Short Code *</label>
                        <input
                          type="text"
                          required
                          value={code}
                          disabled={!!editingBank}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="e.g. HDFC"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white disabled:opacity-50 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:border-royal"
                        />
                      </div>

                      {/* Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Institution Type *</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as any)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-royal"
                        >
                          <option value="BANK">Commercial Bank</option>
                          <option value="NBFC">NBFC / Lending Institution</option>
                        </select>
                      </div>

                      {/* Logo URL */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Logo URL Path</label>
                        <input
                          type="text"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="e.g. /logos/hdfc.png"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-royal"
                        />
                      </div>

                      {/* Priority */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Search Priority Weight</label>
                        <input
                          type="number"
                          value={priority}
                          onChange={(e) => setPriority(Number(e.target.value))}
                          placeholder="1-10"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-royal"
                        />
                      </div>

                      {/* Partner Status */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lending Relationship</label>
                        <select
                          value={partnerStatus}
                          onChange={(e) => setPartnerStatus(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-royal"
                        >
                          <option value="ACTIVE">Active Partner (Preferred)</option>
                          <option value="PROBATION">Probation / Secondary</option>
                          <option value="INACTIVE">Inactive / Disabled Relations</option>
                        </select>
                      </div>

                      {/* Display Order */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Portal Display Order</label>
                        <input
                          type="number"
                          value={displayOrder}
                          onChange={(e) => setDisplayOrder(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-royal"
                        />
                      </div>

                      {/* Processing Fee */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Default Processing Fee (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={processingFee}
                          onChange={(e) => setProcessingFee(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-royal"
                        />
                      </div>
                    </div>

                    {/* Eligibility Notes */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Eligibility Criteria Quick Reference</label>
                      <textarea
                        value={eligibility}
                        onChange={(e) => setEligibility(e.target.value)}
                        placeholder="Specify requirements, minimum salary criteria, negative industries..."
                        className="w-full h-20 px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-royal"
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
                        className="flex-1 py-3 rounded-xl bg-royal text-white text-xs font-bold cursor-pointer hover:bg-royal-hover transition-colors"
                      >
                        {editingBank ? "Update Details" : "Register Lender"}
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
