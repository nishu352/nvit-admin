"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import { useExecutivesQuery } from "@/hooks/useAdminQueries";
import { useAuthStore } from "@/store/useAuthStore";
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
  Edit2,
  Trash2,
  Key,
  Power,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Executive } from "@/types";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin (Full Root Access)" },
  { value: "ADMIN", label: "System Admin (Management & Data Operations)" },
  { value: "MANAGER", label: "Operations Manager (Master + CRM + Data)" },
  { value: "EXECUTIVE", label: "Field Executive (CRM Leads & Inquiries)" },
  { value: "VIEWER", label: "Read-Only Auditor" },
];

function getRoleBadge(role: string) {
  const r = (role || "").toUpperCase();
  if (r === "SUPER_ADMIN") {
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }
  if (r === "ADMIN") {
    return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  }
  if (r === "MANAGER") {
    return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }
  if (r === "EXECUTIVE") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  }
  return "bg-slate-500/10 text-slate-400 border-slate-500/30";
}

export default function AdminExecutivesPage() {
  const { data: usersData = [], isLoading: loading, refetch: fetchUsers } = useExecutivesQuery();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  const users = usersData as Executive[];

  // Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Executive | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<Executive | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Executive | null>(null);

  // Form Fields for Onboard
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EXECUTIVE");
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Form Fields for Edit
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("EXECUTIVE");
  const [editIsActive, setEditIsActive] = useState(true);

  // Form Fields for Reset Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetPasswordText, setShowResetPasswordText] = useState(false);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if current user has Super/Admin privileges
  const isSuperOrAdmin =
    !currentUser ||
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "ADMIN";

  // Open Onboard Modal
  const openOnboardModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("EXECUTIVE");
    setShowPasswordText(false);
    setShowOnboardModal(true);
  };

  // Open Edit Modal
  const openEditModal = (u: Executive) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role || "EXECUTIVE");
    setEditIsActive(u.isActive !== false);
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (u: Executive) => {
    setPasswordResetUser(u);
    setNewPassword("");
    setConfirmPassword("");
    setShowResetPasswordText(false);
  };

  // Submit Onboard
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showToast({ title: "Please fill all required fields", type: "warning" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      showToast({ title: "User operator onboarded successfully", type: "success" });
      setShowOnboardModal(false);
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

  // Submit Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      showToast({ title: "Name and email are required", type: "warning" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.put(`/admin/users/${editingUser.id}`, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        isActive: editIsActive,
      });
      showToast({ title: `Operator "${editName}" updated successfully`, type: "success" });
      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update user";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    if (newPassword.length < 6) {
      showToast({ title: "Password must be at least 6 characters long", type: "warning" });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ title: "Passwords do not match", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/admin/users/${passwordResetUser.id}/reset-password`, {
        password: newPassword,
      });
      showToast({
        title: `Password reset successfully for ${passwordResetUser.name}`,
        type: "success",
      });
      setPasswordResetUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Password reset failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle User Active Status
  const handleToggleStatus = async (u: Executive) => {
    try {
      const res = await apiClient.patch(`/admin/users/${u.id}/toggle-status`);
      showToast({
        title: res.data?.message || `User status toggled successfully`,
        type: "success",
      });
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to toggle status";
      showToast({ title: msg, type: "error" });
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/admin/users/${deleteTarget.id}`);
      showToast({
        title: `User "${deleteTarget.name}" deleted permanently`,
        type: "success",
      });
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Delete failed";
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
            Loan officer team, RBAC user management, password controls, and operator permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchUsers()}
            className="btn-secondary h-10 px-4 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Team</span>
          </button>
          {isSuperOrAdmin && (
            <button
              onClick={openOnboardModal}
              className="btn-primary h-10 px-4 text-xs font-bold cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard Operator</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Executive Cards Grid ──────────────────────────────── */}
      {loading ? (
        <AdminCardGridSkeleton count={3} />
      ) : users.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <UserSquare2 className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No operators or field executives onboarded
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Onboard staff members and loan officers to assign CRM pipeline leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u) => {
            const isActive = u.isActive !== false;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between transition-all ${
                  !isActive ? "opacity-75 border-slate-800" : ""
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top header with name, avatar, and role */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-md shadow-indigo-500/20 shrink-0">
                        {u.name?.slice(0, 2) || "EX"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight truncate">
                          {u.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium truncate block">
                          {u.email}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase shrink-0 ${getRoleBadge(
                        u.role
                      )}`}
                    >
                      {u.role.replace("_", " ")}
                    </span>
                  </div>

                  {/* Telemetry info */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-white/[0.06] pt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between border-b border-slate-100 dark:border-white/[0.04] pb-2">
                      <span className="text-slate-400">Account Status:</span>
                      {isActive ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Deactivated</span>
                        </span>
                      )}
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

                {/* Admin Action Controls */}
                {isSuperOrAdmin && (
                  <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Edit user details & role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => openResetPasswordModal(u)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Reset operator password"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Password</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          isActive
                            ? "bg-slate-500/10 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border-slate-500/20"
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                        }`}
                        title={isActive ? "Deactivate operator" : "Activate operator"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
                        title="Delete operator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Onboard Modal ────────────────────────────────────── */}
      {showOnboardModal && (
        <Modal
          open={showOnboardModal}
          onClose={() => setShowOnboardModal(false)}
          title="Onboard Team Member / Executive"
          description="Register a new operator and assign platform role & security credentials."
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
              <div className="relative">
                <input
                  type={showPasswordText ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono rounded-xl focus:outline-none focus:border-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Role &amp; Permissions *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="btn-secondary h-10 px-4 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-10 px-5 text-xs font-bold cursor-pointer"
              >
                {isSubmitting ? "Onboarding..." : "Authorize Operator"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit User Modal ──────────────────────────────────── */}
      {editingUser && (
        <Modal
          open={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title={`Edit User: ${editingUser.name}`}
          description="Update operator details, corporate role, and platform active status."
        >
          <form onSubmit={handleSaveEditUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Full Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Corporate Email Address *</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="e.g. rahul@nvit.space"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Role &amp; Permissions *</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-bold rounded-xl focus:outline-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <label className="text-xs font-bold text-slate-300 block mb-1">Account Active Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                    editIsActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {editIsActive ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Active Operator</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      <span>Deactivated</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-400">
                  {editIsActive
                    ? "Operator can login and manage assigned leads."
                    : "Login access is blocked for this user."}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-secondary h-10 px-4 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-10 px-5 text-xs font-bold cursor-pointer"
              >
                {isSubmitting ? "Saving Changes..." : "Save User Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Reset Password Modal ─────────────────────────────── */}
      {passwordResetUser && (
        <Modal
          open={Boolean(passwordResetUser)}
          onClose={() => setPasswordResetUser(null)}
          title={`Reset Password: ${passwordResetUser.name}`}
          description="Assign a secure new password for this operator."
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <strong className="font-bold block text-amber-200">Security Override:</strong>
              <p>
                Setting a new password will immediately invalidate existing sessions for{" "}
                <strong>{passwordResetUser.email}</strong>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">New Password *</label>
              <div className="relative">
                <input
                  type={showResetPasswordText ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono rounded-xl focus:outline-none focus:border-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showResetPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setPasswordResetUser(null)}
                className="btn-secondary h-10 px-4 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-10 px-5 text-xs font-bold cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400"
              >
                {isSubmitting ? "Updating Password..." : "Update Password"}
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
          onConfirm={handleDeleteUser}
          title={`Delete Operator ${deleteTarget.name}?`}
          description={`Are you sure you want to permanently remove ${deleteTarget.name} (${deleteTarget.email})? This action cannot be undone.`}
          confirmLabel="Permanently Delete User"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
