"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { usePoliciesQuery, useBanksQuery } from "@/hooks/useAdminQueries";
import {
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  History,
  RotateCcw,
  Search,
  CheckCircle,
  Building2,
  Percent,
  DollarSign,
  ShieldCheck,
  Calendar,
  X,
  FileCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Policy, Bank } from "@/types";

export default function AdminPoliciesPage() {
  const [selectedBankId, setSelectedBankId] = useState("");
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const { data: policiesData, isLoading: loading, refetch: fetchPolicies } = usePoliciesQuery(
    selectedBankId || undefined,
    page
  );
  const { data: banks = [] } = useBanksQuery();

  const policies = (policiesData || []) as Policy[];

  // Modals & History Drawer
  const [showModal, setShowModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);
  const [activePolicyForHistory, setActivePolicyForHistory] = useState<Policy | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const openEditModal = (p: Policy) => {
    setEditingPolicy(p);
    setBankId(p.bankId);
    setCompanyCategory(p.companyCategory);
    setMinSalary(p.minSalary ?? 25000);
    setMaxSalary(p.maxSalary ?? 99999999);
    setMinAge(p.minAge ?? 21);
    setMaxAge(p.maxAge ?? 60);
    setFoir(p.foir ?? 60.0);
    setMinCibil(p.minCibil ?? 700);
    setRoi(p.roi ?? 10.5);
    setProcessingFee(p.processingFee ?? 1.0);
    setMinLoanAmount(p.minLoanAmount ?? 100000);
    setMaxLoanAmount(p.maxLoanAmount ?? 1500000);
    setMinTenure(p.minTenure ?? 12);
    setMaxTenure(p.maxTenure ?? 60);
    setEmploymentType(p.employmentType ?? "SALARIED");
    setRequiredDocuments(p.requiredDocuments || "");
    setNotes(p.notes || "");
    setShowModal(true);
  };

  const openHistoryDrawer = async (p: Policy) => {
    setActivePolicyForHistory(p);
    setShowHistoryDrawer(true);
    setLoadingHistory(true);
    try {
      const res = await apiClient.get(`/admin/policies/${p.id}/history`);
      if (res.data?.success) {
        setHistoryList(res.data.data || []);
      }
    } catch {
      setHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRestoreVersion = async (historyId: string) => {
    if (!confirm("Are you sure you want to rollback to this policy revision?")) return;
    try {
      await apiClient.post(`/admin/policies/restore/${historyId}`);
      showToast({ title: "Policy restored to selected version", type: "success" });
      setShowHistoryDrawer(false);
      fetchPolicies();
    } catch {
      showToast({ title: "Failed to restore version", type: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
      requiredDocuments: requiredDocuments.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (editingPolicy) {
        await apiClient.put(`/admin/policies/${editingPolicy.id}`, payload);
        showToast({ title: "Underwriting policy updated", type: "success" });
      } else {
        await apiClient.post("/admin/policies", payload);
        showToast({ title: "Underwriting policy created", type: "success" });
      }
      setShowModal(false);
      fetchPolicies();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save policy";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/admin/policies/${deleteTarget.id}`);
      showToast({ title: "Policy removed", type: "success" });
      setDeleteTarget(null);
      fetchPolicies();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete policy";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Underwriting Policy Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Credit criteria, FOIR ratios, CIBIL thresholds, ROI bands, and historical audit revisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button onClick={openAddModal} className="btn-primary h-10 px-4 text-xs">
            <Plus className="w-4 h-4" />
            <span>Create Policy Rule</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Select Lender Partner:</span>
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
          Showing {policies.length} Active Rules
        </span>
      </div>

      {/* ── Table Container ──────────────────────────────────── */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={6} />
      ) : policies.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No underwriting policies configured
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {selectedBankId
              ? "No policies exist for this lender partner."
              : "Register your first credit policy rule."}
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Lender Partner</th>
                  <th>Category Tier</th>
                  <th>Rate (ROI) &amp; Fee</th>
                  <th>Min Net Salary</th>
                  <th>FOIR &amp; Min CIBIL</th>
                  <th>Loan Amount Limits</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                          {p.bank?.name || "Lender"}
                        </span>
                        <span className="text-[10px] font-mono text-blue-400 font-bold">
                          {p.bank?.code || "CODE"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded text-[10px] font-black border font-mono bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {p.companyCategory}
                      </span>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-black text-slate-900 dark:text-white text-xs font-mono">
                          {p.roi}% p.a.
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Fee: {p.processingFee ?? 1.0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-black text-slate-900 dark:text-white text-xs font-mono">
                        {formatCurrency(p.minSalary)}/mo
                      </span>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-400">
                          FOIR: {p.foir ?? 60}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold block">
                          CIBIL: {p.minCibil ?? 700}+
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs text-slate-300 font-bold block">
                          {formatCurrency(p.minLoanAmount ?? 100000)} - {formatCurrency(p.maxLoanAmount ?? 1500000)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {p.minTenure ?? 12} to {p.maxTenure ?? 60} Mos
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openHistoryDrawer(p)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                          title="Revision History & Audit"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                          title="Edit Policy"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Policy"
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
        </div>
      )}

      {/* ── Add / Edit Policy Modal ──────────────────────────── */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingPolicy ? "Edit Underwriting Rule" : "Create Credit Policy Rule"}
          description="Configure credit eligibility parameters, FOIR multipliers, and interest rates."
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="text-xs font-bold text-slate-300">Target Category Tier *</label>
                <select
                  value={companyCategory}
                  onChange={(e) => setCompanyCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
                >
                  <option value="SUPER A">SUPER A (Tier 1)</option>
                  <option value="CAT A">CAT A (Prime)</option>
                  <option value="CAT B">CAT B</option>
                  <option value="CAT C">CAT C</option>
                  <option value="CAT D">CAT D (Subprime)</option>
                  <option value="UNLISTED">UNLISTED</option>
                  <option value="GOVERNMENT">GOVERNMENT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ROI (% p.a.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={roi}
                  onChange={(e) => setRoi(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">FOIR Max Ratio (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={foir}
                  onChange={(e) => setFoir(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Min CIBIL Score *</label>
                <input
                  type="number"
                  min={300}
                  max={900}
                  required
                  value={minCibil}
                  onChange={(e) => setMinCibil(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Min Net Salary / Month (₹) *</label>
                <input
                  type="number"
                  required
                  value={minSalary}
                  onChange={(e) => setMinSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={processingFee}
                  onChange={(e) => setProcessingFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Min Loan Amount (₹)</label>
                <input
                  type="number"
                  value={minLoanAmount}
                  onChange={(e) => setMinLoanAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Max Loan Amount (₹)</label>
                <input
                  type="number"
                  value={maxLoanAmount}
                  onChange={(e) => setMaxLoanAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Min Tenure (Months)</label>
                <input
                  type="number"
                  value={minTenure}
                  onChange={(e) => setMinTenure(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Max Tenure (Months)</label>
                <input
                  type="number"
                  value={maxTenure}
                  onChange={(e) => setMaxTenure(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Required Documents List</label>
              <input
                type="text"
                value={requiredDocuments}
                onChange={(e) => setRequiredDocuments(e.target.value)}
                placeholder="e.g. PAN, Aadhaar, 3 Months Payslip, 6 Months Bank Statement"
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
                {isSubmitting ? "Saving Policy..." : editingPolicy ? "Update Policy" : "Create Policy"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Policy Revision History Drawer ───────────────────── */}
      <AnimatePresence>
        {showHistoryDrawer && activePolicyForHistory && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryDrawer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-[#060c1c] border-l border-slate-200 dark:border-white/[0.08] h-full shadow-2xl flex flex-col p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Policy Revision Trail
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {activePolicyForHistory.bank?.name} • {activePolicyForHistory.companyCategory}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingHistory ? (
                  <p className="text-xs text-slate-400 text-center py-10">
                    Loading historical revisions...
                  </p>
                ) : historyList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">
                    No historical revisions found for this policy rule.
                  </p>
                ) : (
                  historyList.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] text-slate-400">
                          {formatDate(hist.createdAt)}
                        </span>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                          v{hist.version || 1}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 font-medium space-y-1">
                        <p>ROI: <strong className="text-white">{hist.roi}%</strong> • FOIR: <strong className="text-white">{hist.foir}%</strong></p>
                        <p>Min Salary: <strong className="text-white">{formatCurrency(hist.minSalary)}</strong></p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex justify-end">
                        <button
                          onClick={() => handleRestoreVersion(hist.id)}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Rollback to this version</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ───────────────────────── */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Underwriting Policy?"
          description={`Are you sure you want to delete the ${deleteTarget.companyCategory} policy rule for ${deleteTarget.bank?.name}? Automated loan eligibility calculations will no longer apply this rule.`}
          confirmLabel="Delete Policy Rule"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
