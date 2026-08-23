"use client";

import React from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex items-center p-1 rounded-2xl bg-white/90 dark:bg-[#091024]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm backdrop-blur-md"
      role="group"
      aria-label="Theme Switcher"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
          theme === "light"
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="Light Theme"
        aria-pressed={theme === "light"}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="text-[10px]">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="Dark Theme"
        aria-pressed={theme === "dark"}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="text-[10px]">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
          theme === "system"
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="Follow System Theme"
        aria-pressed={theme === "system"}
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="text-[10px]">Auto</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
