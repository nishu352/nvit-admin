"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon, Laptop } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-24 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 animate-pulse" />;
  }

  return (
    <div
      className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
      role="group"
      aria-label="Theme Switcher"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
          theme === "light"
            ? "bg-white text-blue-600 shadow-sm border border-slate-200/80 font-bold"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="Light Theme"
        aria-pressed={theme === "light"}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="sr-only sm:not-sr-only text-[10px]">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-slate-800 text-blue-400 shadow-sm border border-slate-700/80 font-bold"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="Dark Theme"
        aria-pressed={theme === "dark"}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="sr-only sm:not-sr-only text-[10px]">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
          theme === "system"
            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80 font-bold"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="Follow System Theme"
        aria-pressed={theme === "system"}
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="sr-only sm:not-sr-only text-[10px]">Auto</span>
      </button>
    </div>
  );
}
