"use client";

import React from "react";

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`}
      {...props}
    />
  );
}

export function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-20 h-7" />
            <Skeleton className="w-32 h-2.5" />
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
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {showHeader && (
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Skeleton className="w-48 h-4" />
          <Skeleton className="w-28 h-8 rounded-xl" />
        </div>
      )}
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center justify-between py-3 px-2 border-b border-slate-800/60 last:border-0 gap-4"
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 ${c === 0 ? "w-32" : c === columns - 1 ? "w-16" : "w-24"}`}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 min-h-56">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="w-24 h-3.5" />
                <Skeleton className="w-16 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-14 h-5 rounded" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-3/4 h-3" />
            <Skeleton className="w-1/2 h-3" />
          </div>
          <div className="pt-4 border-t border-slate-800/60 flex justify-between">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-12 h-6 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 space-y-6 max-w-4xl">
      <div className="space-y-2 border-b border-slate-800 pb-4">
        <Skeleton className="w-48 h-5" />
        <Skeleton className="w-72 h-3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-full h-10 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-full h-10 rounded-xl" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Skeleton className="w-32 h-3" />
          <Skeleton className="w-full h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
