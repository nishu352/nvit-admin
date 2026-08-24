/**
 * Centralized Category Status & Visual Classification System
 * 
 * Rules according to Phase 3 & Phase 4:
 * 🟢 LISTED / AVAILABLE   — Any valid bank-company association/category (Standard or Custom e.g. "Preferred", "Priority Partner", "A+", "CAT A", "Tier 1", etc.)
 * 🟠 CAUTION / REVIEW     — Explicit caution codes (e.g. CAT CAUTION, CSC CAUTION, DNS)
 * 🔴 NEGATIVE / REJECTED  — Explicit reject / blacklist / delist codes (DELIST, REJECT, BLACKLIST, NEGATIVE)
 * ⚪ UNMAPPED             — No bank-company mapping attached
 * 
 * IMPORTANT:
 * - Keeps raw category name exactly as stored in the database.
 * - Any custom category entered by an admin is treated as LISTED for that bank.
 * - A company is only Unlisted for a bank when no mapping exists.
 */

export type CategoryStatusType = "LISTED" | "CAUTION" | "NEGATIVE" | "UNKNOWN";

export interface CategoryVisualConfig {
  status: CategoryStatusType;
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: string;
}

export function getCategoryStatus(rawCategory?: string | null): CategoryVisualConfig {
  const cat = String(rawCategory || "").trim();
  if (!cat) {
    return {
      status: "UNKNOWN",
      label: "Unmapped",
      badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      dotClass: "bg-slate-400",
      icon: "⚪",
    };
  }

  const upper = cat.toUpperCase();

  // 1. Explicit Negative / Delisted / Rejected / Blocked
  if (
    upper === "DELIST" ||
    upper === "UNLISTED" ||
    upper === "REJECT" ||
    upper === "REJECTED" ||
    upper === "NEGATIVE" ||
    upper.includes("BLACKLIST") ||
    upper.includes("DEFAULTER") ||
    upper.includes("BLOCKED")
  ) {
    return {
      status: "NEGATIVE",
      label: "Negative / Rejected",
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      dotClass: "bg-rose-500",
      icon: "🔴",
    };
  }

  // 2. Explicit Caution / Review / Restricted Tiers
  if (
    upper.includes("CAUTION") || // CAT CAUTION, CSC CAUTION
    upper === "DNS" || // "Do Not Solicit"
    upper === "POL" || // Police / Policy code
    upper === "ACE" ||
    upper === "DŸ" ||
    upper.startsWith("OTH-") ||
    upper === "UPC-T" ||
    upper === "CATDU"
  ) {
    return {
      status: "CAUTION",
      label: "Caution / Review",
      badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      dotClass: "bg-amber-500",
      icon: "🟠",
    };
  }

  // 3. Valid Active / Listed Bank Category (Standard or Custom)
  return {
    status: "LISTED",
    label: "Listed / Available",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
    icon: "🟢",
  };
}
