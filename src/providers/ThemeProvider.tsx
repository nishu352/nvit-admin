"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { safeStorage } from "@/lib/storage";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

// Reads the resolved dark/light state without causing re-renders
function getResolvedTheme(t: Theme): "light" | "dark" {
  if (t === "dark") return "dark";
  if (t === "light") return "light";
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

// Lazily read theme from safeStorage for the initial state
function getInitialTheme(): Theme {
  return (safeStorage.getItem("admin_theme") as Theme) || "system";
}

// Apply dark/light class to <html> imperatively
function applyThemeToDOM(t: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark =
    t === "dark" ||
    (t === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "dark",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    getResolvedTheme(getInitialTheme())
  );

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setResolvedTheme(getResolvedTheme(newTheme));
    safeStorage.setItem("admin_theme", newTheme);
    applyThemeToDOM(newTheme);
  }, []);

  // Apply theme on first mount (DOM sync)
  useEffect(() => {
    applyThemeToDOM(theme);
    setResolvedTheme(getResolvedTheme(theme));
  }, [theme]);

  // Listen for system preference changes when theme is "system"
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyThemeToDOM("system");
      setResolvedTheme(getResolvedTheme("system"));
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
