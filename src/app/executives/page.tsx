"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { apiClient } from "@/services/apiClient";
import {
  UserCheck,
  Plus,
  Shield,
  Activity,
  Award,
  CheckCircle,
  Clock,
  Briefcase,
  Mail,
  UserPlus,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/AdminSkeleton";
import { formatDate } from "@/lib/utils";

export default function AdminExecutivesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EXECUTIVE");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/users");
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/auth/register", { name, email, password, role });
      setShowModal(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
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
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Executive Team & SLA Performance</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Onboard loan executives, track lead response speeds, and manage RBAC roles</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard Executive</span>
            </button>
          </div>

          {loading ? (
            <AdminCardGridSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((u) => (
                <div key={u.id} className="glass-card rounded-2xl p-6 border border-slate-900 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center font-black text-blue-400 uppercase">
                          {u.name.slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-xs leading-none mb-1">{u.name}</h3>
                          <span className="text-[10px] text-slate-400 font-semibold">{u.email}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[8px] font-black border bg-blue-500/10 border-blue-500/20 text-blue-400">
                        {u.role}
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-slate-900 pt-3 text-[11px] font-semibold text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Account Status:</span>
                        <span className="text-emerald-400 font-extrabold">Active Operator</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>SLA Response Avg:</span>
                        <span className="text-white font-extrabold">14 mins</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Joined On:</span>
                        <span className="text-slate-300 font-mono">{formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Executive Modal */}
          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800 space-y-6 text-slate-100"
                >
                  <h2 className="text-lg font-black text-white">Onboard Executive User</h2>
                  <form onSubmit={handleRegisterUser} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. alex@nvitsolution.com"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Temporary Password *</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Assigned Role *</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        <option value="EXECUTIVE">EXECUTIVE (Lead Operator)</option>
                        <option value="MANAGER">MANAGER (Team Supervisor)</option>
                        <option value="ADMIN">ADMIN (System Administrator)</option>
                      </select>
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
                        Create Account
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

