"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { apiClient } from "@/services/apiClient";
import { RefreshCw } from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/loan/applications");
      if (res.data.success) {
        setApplications(res.data.data.items);
      }
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-royal selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Loan Lead Inquiries</h1>
            <p className="text-xs text-slate-400 font-medium font-semibold">Review and process submitted loan application leads</p>
          </div>
          <button
            onClick={fetchApplications}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Leads</span>
          </button>
        </div>

        {loading ? (
          <AdminTableSkeleton rows={6} columns={6} />
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-300 text-[11px] uppercase font-black tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Applicant</th>
                    <th className="py-4 px-6">Contact</th>
                    <th className="py-4 px-6">Company & Income</th>
                    <th className="py-4 px-6">Loan Type & Amount</th>
                    <th className="py-4 px-6">Location</th>
                    <th className="py-4 px-6">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-200">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-450 font-semibold">
                        No loan lead applications found.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-850/60 bg-slate-900/40 transition-colors">
                        <td className="py-4.5 px-6 font-extrabold text-white">{app.name}</td>
                        <td className="py-4.5 px-6 space-y-1">
                          <span className="text-white block">{app.mobile}</span>
                          <span className="text-slate-400 block text-[10px] font-semibold">{app.email}</span>
                        </td>
                        <td className="py-4.5 px-6 space-y-1">
                          <span className="text-white block">{app.company}</span>
                          <span className="text-slate-400 block text-[10px] font-semibold">Salary: {formatCurrency(app.monthlyIncome)}/pm</span>
                        </td>
                        <td className="py-4.5 px-6 space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-royal/20 text-blue-400 border border-blue-500/20">
                            {app.loanType}
                          </span>
                          <span className="font-black text-emerald-400 block mt-1">
                            {formatCurrency(app.loanAmount)}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-slate-300 font-medium">
                          {app.city}, {app.state}
                        </td>
                        <td className="py-4.5 px-6 text-slate-400 font-mono font-semibold">
                          {formatDate(app.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
