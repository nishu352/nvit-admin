"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { useExecutivesQuery } from "@/hooks/useAdminQueries";
import {
  UserSquare2,
  Plus,
  Shield,
  Activity,
  Award,
  CheckCircle,
  Clock,
  Briefcase,
  Mail,
  UserPlus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Executive } from "@/types";

export default function AdminExecutivesPage() {
  const { data: usersData = [], isLoading: loading, refetch: fetchUsers } = useExecutivesQuery();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const users = usersData as Executive[];

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EXECUTIVE");

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      showToast({ title: "Executive operator onboarded successfully", type: "success" });
      setShowModal(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed";
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
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <UserSquare2 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Field Executives &amp; SLA Performance
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Loan officer team, lead response speeds, conversion telemetry, and RBAC permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchUsers()}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Team</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary h-10 px-4 text-xs">
            <UserPlus className="w-4 h-4" />
            <span>Onboard Executive</span>
          </button>
        </div>
      </div>

      {/* ── Executive Cards Grid ──────────────────────────────── */}
      {loading ? (
        <AdminCardGridSkeleton count={3} />
      ) : users.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <UserSquare2 className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No field executives onboarded
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Onboard staff members and loan officers to assign CRM pipeline leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-md shadow-indigo-500/20 shrink-0">
                      {u.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                        {u.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">{u.email}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border badge-blue uppercase">
                    {u.role.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-white/[0.06] pt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-2">
                    <span className="text-slate-400">Operator Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-2">
                    <span className="text-slate-400">SLA Response Speed:</span>
                    <span className="text-slate-900 dark:text-white font-mono font-bold">
                      14 Mins Avg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Onboarded Since:</span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {formatDate(u.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Onboard Modal ────────────────────────────────────── */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Onboard Field Executive"
          description="Register a new team member and assign platform operational credentials."
        >
          <form onSubmit={handleRegisterUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Corporate Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@nvit.space"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Account Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Role &amp; Permissions *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
              >
                <option value="EXECUTIVE">Field Executive (CRM Inquiries Only)</option>
                <option value="MANAGER">Operations Manager (Master + CRM + Data)</option>
                <option value="VIEWER">Read-Only Auditor</option>
              </select>
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
                {isSubmitting ? "Onboarding..." : "Authorize Operator"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
