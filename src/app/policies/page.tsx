"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/apiClient";
import { usePoliciesQuery, useBanksQuery, ADMIN_QUERY_KEYS } from "@/hooks/useAdminQueries";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileCheck,
  Plus,
  Edit2,
  Trash2,
  History,
  RotateCcw,
  Search,
  CheckCircle,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatCurrency } from "@/lib/utils";

export default function AdminPoliciesPage() {
  const queryClient = useQueryClient();
  const [selectedBankId, setSelectedBankId] = useState("");
  const [page, setPage] = useState(1);

  const { data: policiesData, isLoading: loading, refetch: fetchPolicies } = usePoliciesQuery(selectedBankId || undefined, page);
  const { data: banks = [] } = useBanksQuery();

  const policies: any[] = Array.isArray(policiesData) ? policiesData : policiesData?.items || [];
  const totalPages: number = Array.isArray(policiesData) ? 1 : policiesData?.totalPages || 1;

  // Modals & History Drawer
  const [showModal, setShowModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [activePolicyForHistory, setActivePolicyForHistory] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form Fields
  const [bankId, setBankId] = useState("");
  const [companyCategory, setCompanyCategory] = useState("CAT A");
  const [minSalary, setMinSalary] = useState(25000);
  const [maxSalary, setMaxSalary] = useState(99999999);
  const [minAge, setMinAge] = useState(21);
  const [maxAge, setMaxAge] = useState(60);
  const [foir, setFoir] = useState(60.0);
  const [minCibil, setMinCibil] = useState(700);
  const [roi, setRoi] = useState(10.5);
  const [processingFee, setProcessingFee] = useState(1.0);
  const [minLoanAmount, setMinLoanAmount] = useState(100000);
  const [maxLoanAmount, setMaxLoanAmount] = useState(1500000);
  const [minTenure, setMinTenure] = useState(12);
  const [maxTenure, setMaxTenure] = useState(60);
  const [employmentType, setEmploymentType] = useState("SALARIED");
  const [requiredDocuments, setRequiredDocuments] = useState("PAN, Aadhaar, 3 Months Payslip");
  const [notes, setNotes] = useState("");

  const openAddModal = () => {
    setEditingPolicy(null);
    setBankId(banks[0]?.id || "");
    setCompanyCategory("CAT A");
    setMinSalary(25000);
    setMaxSalary(99999999);
    setMinAge(21);
    setMaxAge(60);
    setFoir(60.0);
    setMinCibil(700);
    setRoi(10.5);
    setProcessingFee(1.0);
    setMinLoanAmount(100000);
    setMaxLoanAmount(1500000);
    setMinTenure(12);
    setMaxTenure(60);
    setEmploymentType("SALARIED");
    setRequiredDocuments("PAN, Aadhaar, 3 Months Payslip");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingPolicy(p);
    setBankId(p.bankId);
    setCompanyCategory(p.companyCategory);
    setMinSalary(p.minSalary);
    setMaxSalary(p.maxSalary);
    setMinAge(p.minAge);
    setMaxAge(p.maxAge);
    setFoir(p.foir);
    setMinCibil(p.minCibil);
    setRoi(p.roi);
    setProcessingFee(p.processingFee);
    setMinLoanAmount(p.minLoanAmount);
    setMaxLoanAmount(p.maxLoanAmount);
    setMinTenure(p.minTenure);
    setMaxTenure(p.maxTenure);
    setEmploymentType(p.employmentType);
    setRequiredDocuments(p.requiredDocuments || "");
    setNotes(p.notes || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      bankId,
      companyCategory,
      minSalary: Number(minSalary),
      maxSalary: Number(maxSalary),
      minAge: Number(minAge),
      maxAge: Number(maxAge),
      foir: Number(foir),
      minCibil: Number(minCibil),
      roi: Number(roi),
      processingFee: Number(processingFee),
      minLoanAmount: Number(minLoanAmount),
      maxLoanAmount: Number(maxLoanAmount),
      minTenure: Number(minTenure),
      maxTenure: Number(maxTenure),
      employmentType,
      requiredDocuments,
      notes: notes || null,
    };

    try {
      if (editingPolicy) {
        await apiClient.put(`/admin/policies/${editingPolicy.id}`, payload);
      } else {
        await apiClient.post("/admin/policies", payload);
      }
      setShowModal(false);
      fetchPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credit policy?")) return;
    try {
      await apiClient.delete(`/admin/policies/${id}`);
      fetchPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  const viewHistory = async (policy: any) => {
    setActivePolicyForHistory(policy);
    setLoadingHistory(true);
    setShowHistoryDrawer(true);
    try {
      const res = await apiClient.get(`/admin/policies/${policy.id}/history`);
      if (res.data.success) {
        setHistoryList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRollback = async (historyId: string) => {
    if (!confirm("Are you sure you want to roll back this credit policy to the selected version?")) return;
    try {
      await apiClient.post(`/admin/policies/${activePolicyForHistory.id}/rollback`, { historyId });
      setShowHistoryDrawer(false);
      fetchPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Credit Policy Matrix</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Configure lending formulas, salary bands, CIBIL bounds, and interest rates</p>
            </div>
            <button
              onClick={openAddModal}
              className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Define Policy Rule</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Filter Bank:</span>
            <select
              value={selectedBankId}
              onChange={(e) => {
                setSelectedBankId(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">All Banks & NBFCs</option>
              {banks.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <AdminTableSkeleton rows={6} columns={5} />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {policies.map((p: any) => (
                <div key={p.id} className="glass-card rounded-2xl p-6 border border-slate-900 flex flex-col justify-between space-y-6">
                  {/* Title Bar */}
                  <div className="flex items-start justify-between border-b border-slate-900 pb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono font-extrabold text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                          {p.bank.code}
                        </span>
                        <h3 className="font-extrabold text-white text-sm">{p.bank.name} credit rules</h3>
                      </div>
                      <p className="text-[10px] text-slate-500 font-extrabold mt-1">
                        Category classification: {p.companyCategory} • Employment: {p.employmentType}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded text-[9px] font-black border bg-slate-950 text-slate-450 border-slate-850">
                        Version {p.version}
                      </span>
                      <button
                        onClick={() => viewHistory(p)}
                        className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        title="Version History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        title="Edit Policy"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 hover:border-rose-900 hover:bg-rose-950/20 flex items-center justify-center text-slate-400 hover:text-rose-450 cursor-pointer"
                        title="Delete Policy"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Detail Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6 text-[11px] font-semibold text-slate-450">
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-550 mb-1">Salary Range</div>
                      <div className="text-white font-extrabold">
                        {p.minSalary ? `Min: ₹${(p.minSalary/1000)}k` : "No limit"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-550 mb-1">Age Limits</div>
                      <div className="text-white font-extrabold">{p.minAge || 21} - {p.maxAge || 60} Years</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-550 mb-1">FOIR Limit</div>
                      <div className="text-white font-extrabold">{p.foir}% max</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-550 mb-1">Min CIBIL</div>
                      <div className="text-white font-extrabold">{p.minCibil || 700} score</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-550 mb-1">ROI Rate</div>
                      <div className="text-white font-extrabold">{p.roi}% p.a.</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-550 mb-1">Processing Fee</div>
                      <div className="text-white font-extrabold">{p.processingFee || 1.0}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-900/60 text-[11px] font-semibold text-slate-450">
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-550 mb-1">Loan Range</div>
                      <div className="text-white font-extrabold">
                        ₹{(p.minLoanAmount/100000)}L - ₹{(p.maxLoanAmount/100000)}L (Tenure: {p.minTenure}-{p.maxTenure} mo)
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-550 mb-1">Required Documents</div>
                      <div className="text-slate-300 font-extrabold truncate" title={p.requiredDocuments}>
                        {p.requiredDocuments || "None listed"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-4 text-xs font-bold text-slate-450">
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
                  className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-800 overflow-y-auto max-h-[90vh] space-y-6 text-slate-100"
                >
                  <h2 className="text-lg font-black text-white">{editingPolicy ? "Modify Credit Rule Set" : "Define Credit Rule Set"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Bank */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lender *</label>
                        <select
                          disabled={!!editingPolicy}
                          value={bankId}
                          onChange={(e) => setBankId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          {banks.map((b: any) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Company Category */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Company Category Classification *</label>
                        <select
                          value={companyCategory}
                          onChange={(e) => setCompanyCategory(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="CAT A">Category A</option>
                          <option value="CAT B">Category B</option>
                          <option value="CAT C">Category C</option>
                          <option value="CAT D">Category D</option>
                          <option value="UNLISTED">Unlisted</option>
                        </select>
                      </div>

                      {/* Salaries */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Min Salary Requirement (INR) *</label>
                        <input
                          type="number"
                          required
                          value={minSalary}
                          onChange={(e) => setMinSalary(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Max Salary Requirement (INR) *</label>
                        <input
                          type="number"
                          required
                          value={maxSalary}
                          onChange={(e) => setMaxSalary(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {/* Age limits */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Min Age Requirement *</label>
                        <input
                          type="number"
                          required
                          value={minAge}
                          onChange={(e) => setMinAge(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Max Age Requirement *</label>
                        <input
                          type="number"
                          required
                          value={maxAge}
                          onChange={(e) => setMaxAge(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {/* FOIR & CIBIL */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Max FOIR Threshold (%) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={foir}
                          onChange={(e) => setFoir(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Minimum CIBIL Score *</label>
                        <input
                          type="number"
                          required
                          value={minCibil}
                          onChange={(e) => setMinCibil(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {/* ROI & Fee */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Interest Rate (ROI % p.a.) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={roi}
                          onChange={(e) => setRoi(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Processing Fee (%) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={processingFee}
                          onChange={(e) => setProcessingFee(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {/* Loan limits */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Min Loan Amount (INR) *</label>
                        <input
                          type="number"
                          required
                          value={minLoanAmount}
                          onChange={(e) => setMinLoanAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Max Loan Amount (INR) *</label>
                        <input
                          type="number"
                          required
                          value={maxLoanAmount}
                          onChange={(e) => setMaxLoanAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {/* Tenure limits */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Min Tenure (Months) *</label>
                        <input
                          type="number"
                          required
                          value={minTenure}
                          onChange={(e) => setMinTenure(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Max Tenure (Months) *</label>
                        <input
                          type="number"
                          required
                          value={maxTenure}
                          onChange={(e) => setMaxTenure(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Employment Type */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Eligible Employment Type *</label>
                      <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        <option value="SALARIED">Salaried Employee</option>
                        <option value="SELF_EMPLOYED">Self-Employed Professional</option>
                        <option value="BUSINESS">Business Owners</option>
                      </select>
                    </div>

                    {/* Required Documents */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Document Checklist (Comma Separated) *</label>
                      <input
                        type="text"
                        required
                        value={requiredDocuments}
                        onChange={(e) => setRequiredDocuments(e.target.value)}
                        placeholder="e.g. PAN, Aadhaar, Payslip"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Internal Policy Notes / Cautions</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Multiplier is 10x for Category A"
                        className="w-full h-16 px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
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
                        Save Policy Rules
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* History Drawer */}
          <AnimatePresence>
            {showHistoryDrawer && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  className="bg-slate-900 border-l border-slate-850 w-full max-w-xl h-full p-8 overflow-y-auto space-y-6 text-slate-100 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                      <div>
                        <h2 className="text-base font-black text-white">Policy Version Control</h2>
                        <p className="text-[10px] text-slate-500 font-extrabold mt-0.5">
                          Lender: {activePolicyForHistory?.bank.name} ({activePolicyForHistory?.companyCategory})
                        </p>
                      </div>
                      <button
                        onClick={() => setShowHistoryDrawer(false)}
                        className="text-xs font-black text-slate-450 hover:text-white cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {loadingHistory ? (
                      <div className="py-20 text-center text-xs font-bold text-slate-400">Loading versions...</div>
                    ) : historyList.length === 0 ? (
                      <div className="py-20 text-center text-xs font-semibold text-slate-500">
                        No previous audit modifications recorded for this policy rule set.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {historyList.map((hist) => (
                          <div key={hist.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                              <span className="text-[10px] font-black text-white uppercase">Version {hist.version}</span>
                              <span className="text-[9px] font-mono text-slate-500">{new Date(hist.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400">
                              <div>ROI: <span className="text-white font-extrabold">{hist.roi}%</span></div>
                              <div>FOIR: <span className="text-white font-extrabold">{hist.foir}%</span></div>
                              <div>Min CIBIL: <span className="text-white font-extrabold">{hist.minCibil}</span></div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-450">
                              <span>Modified By: {hist.changedByEmail || "System"}</span>
                            </div>
                            <button
                              onClick={() => handleRollback(hist.id)}
                              className="px-3 py-1 bg-royal/10 border border-royal/20 hover:border-royal/40 hover:bg-royal text-royal hover:text-white text-[9px] font-black rounded-md flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Rollback to this version</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
  );
}
