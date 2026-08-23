"use client";

import React from "react";

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/[0.06] ${className}`}
      {...props}
    />
  );
}

export function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="stat-kpi-card p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-28 h-3.5" />
            <Skeleton className="w-9 h-9 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-24 h-8" />
            <Skeleton className="w-36 h-2.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({
  rows = 6,
  columns = 5,
  showHeader = true,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="admin-table-container rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
      {showHeader && (
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-48 h-5" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-36 h-9 rounded-xl" />
            <Skeleton className="w-24 h-9 rounded-xl" />
          </div>
        </div>
      )}
      <div className="p-4 space-y-3.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center justify-between py-3 px-3 border-b border-slate-100 dark:border-white/[0.04] last:border-0 gap-4"
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 ${c === 0 ? "w-36" : c === columns - 1 ? "w-20" : "w-24"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/[0.08] space-y-4 min-h-[220px]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-11 h-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="w-28 h-4" />
                <Skeleton className="w-16 h-3" />
              </div>
            </div>
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>
          <div className="space-y-2.5 pt-2">
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-4/5 h-3" />
            <Skeleton className="w-2/3 h-3" />
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-16 h-7 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 space-y-6 max-w-4xl shadow-xl">
      <div className="space-y-2 border-b border-slate-200 dark:border-white/[0.08] pb-4">
        <Skeleton className="w-56 h-6" />
        <Skeleton className="w-80 h-3.5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="w-28 h-3" />
          <Skeleton className="w-full h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-28 h-3" />
          <Skeleton className="w-full h-11 rounded-xl" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Skeleton className="w-36 h-3" />
          <Skeleton className="w-full h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
