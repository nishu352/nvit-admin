"use client";

import { useApplicationsQuery } from "@/hooks/useAdminQueries";
import { RefreshCw } from "lucide-react";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AdminApplicationsPage() {
  const { data: applications = [], isLoading: loading, refetch: fetchApplications } = useApplicationsQuery();

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Loan Lead Inquiries</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">Review and process submitted loan application leads</p>
        </div>
        <button
          onClick={() => fetchApplications()}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={6} columns={6} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-350 text-[10px] uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6">Applicant</th>
                  <th className="py-4 px-6">Contact</th>
                  <th className="py-4 px-6">Company &amp; Income</th>
                  <th className="py-4 px-6">Loan Type &amp; Amount</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-bold text-slate-700 dark:text-slate-200">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No loan lead applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((app: any) => (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors">
                      <td className="py-4.5 px-6 font-extrabold text-slate-900 dark:text-white">{app.name}</td>
                      <td className="py-4.5 px-6 space-y-1">
                        <span className="text-slate-900 dark:text-white block font-mono">{app.mobile}</span>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">{app.email}</span>
                      </td>
                      <td className="py-4.5 px-6 space-y-1">
                        <span className="text-slate-900 dark:text-white block">{app.company}</span>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">Salary: {formatCurrency(app.monthlyIncome)}/pm</span>
                      </td>
                      <td className="py-4.5 px-6 space-y-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-royal/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                          {app.loanType}
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 block mt-1 font-mono">
                          {formatCurrency(app.loanAmount)}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-slate-600 dark:text-slate-300 font-medium">
                        {app.city}, {app.state}
                      </td>
                      <td className="py-4.5 px-6 text-slate-500 dark:text-slate-400 font-mono font-semibold text-[11px]">
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
  );
}
