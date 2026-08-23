"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ShowToastOptions {
  title?: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  showToast: (options: ShowToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// ── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType>({
  toast: {
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {},
  },
  showToast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

// ── Toast Item Component ──────────────────────────────────────────────────────
const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success:
    "bg-white dark:bg-[#091024] border-emerald-200 dark:border-emerald-500/20 text-slate-900 dark:text-white",
  error:
    "bg-white dark:bg-[#091024] border-rose-200 dark:border-rose-500/20 text-slate-900 dark:text-white",
  warning:
    "bg-white dark:bg-[#091024] border-amber-200 dark:border-amber-500/20 text-slate-900 dark:text-white",
  info:
    "bg-white dark:bg-[#091024] border-blue-200 dark:border-blue-500/20 text-slate-900 dark:text-white",
};

const TOAST_ICON_STYLES: Record<ToastType, string> = {
  success: "text-emerald-500 dark:text-emerald-400",
  error: "text-rose-500 dark:text-rose-400",
  warning: "text-amber-500 dark:text-amber-400",
  info: "text-blue-500 dark:text-blue-400",
};

const TOAST_PROGRESS_STYLES: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

function ToastItemComponent({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = TOAST_ICONS[item.type];
  const duration = item.duration ?? (item.type === "error" ? 5000 : 3500);

  // Auto-dismiss timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl overflow-hidden max-w-sm w-full ${TOAST_STYLES[item.type]}`}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${TOAST_ICON_STYLES[item.type]}`} />

      {/* Message */}
      <p className="flex-1 text-xs font-bold leading-snug">{item.message}</p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 p-0.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${TOAST_PROGRESS_STYLES[item.type]}`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

// ── Provider Component ────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);
    },
    []
  );

  const showToast = useCallback(
    (options: ShowToastOptions) => {
      const msg = options.title || options.message || "Notification";
      addToast(options.type || "info", msg, options.duration);
    },
    [addToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => addToast("success", message, duration),
    [addToast]
  );
  const error = useCallback(
    (message: string, duration?: number) => addToast("error", message, duration),
    [addToast]
  );
  const warning = useCallback(
    (message: string, duration?: number) => addToast("warning", message, duration),
    [addToast]
  );
  const info = useCallback(
    (message: string, duration?: number) => addToast("info", message, duration),
    [addToast]
  );

  const contextValue: ToastContextType = {
    toast: { success, error, warning, info },
    showToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none items-end max-w-sm w-full"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence mode="sync">
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto w-full">
              <ToastItemComponent item={item} onDismiss={dismissToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
