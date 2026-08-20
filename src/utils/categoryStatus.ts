/**
 * Centralized Category Status & Visual Classification System
 * 
 * Rules:
 * 🟢 LISTED / AVAILABLE   — Valid active/listed categories
 * 🟠 CAUTION / REVIEW     — CAT CAUTION, CSC CAUTION, DNS and clearly caution/ambiguous categories
 * 🔴 NEGATIVE / UNLISTED  — DELIST, UNLISTED and explicit reject/not-eligible categories
 * ⚪ UNKNOWN              — Genuinely unclear/unmapped categories
 * 
 * IMPORTANT:
 * - Keeps raw category name exactly as stored in the database.
 * - Does not assume or compute universal hierarchical ranking between tiers.
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
      status: "NEGATIVE",
      label: "Negative / Unlisted",
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      dotClass: "bg-rose-500",
      icon: "🔴",
    };
  }

  const upper = cat.toUpperCase();

  // 1. Explicit Negative / Delisted / Unlisted / Rejected
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
      label: "Negative / Unlisted",
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      dotClass: "bg-rose-500",
      icon: "🔴",
    };
  }

  // 2. Explicit Caution / Ambiguous / Restricted Tiers (NEVER classified as green)
  if (
    upper.includes("CAUTION") || // CAT CAUTION, CSC CAUTION
    upper === "DNS" || // "Do Not Solicit" / "Does Not Support"
    upper === "POL" || // Police / Policy code
    upper === "ACE" || // Ambiguous code
    upper === "DŸ" || // Data artifact
    upper.startsWith("OTH-") || // OTH-A, OTH-B, OTH-C, OTH-D, OTH-E
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

  // 3. Known Valid Active / Listed Banking Categories
  const isStandardTier =
    /^(CAT|CSC|SCAT|UPC|LPC|HDC|UNC|SCH|GOV|GDF|LPS|RIN|REG|NAF|CATG)[ -]?[A-Z0-9\+]+$/i.test(upper) ||
    /^[A-E](\+)?$/i.test(upper) ||
    upper === "SUPER CAT A" ||
    upper === "SUPER A" ||
    upper === "SUPERPRIME" ||
    upper === "PREFERRED" ||
    upper === "ELITE" ||
    upper === "OPEN MARKET" ||
    upper === "GOVERNMENT" ||
    upper === "GOVERNMENT SECTOR" ||
    upper === "GOVT" ||
    upper === "DEF" ||
    upper === "PMF" ||
    upper === "ACE PLUS" ||
    upper === "STF" ||
    upper.includes("TATA GROUP") ||
    upper === "CAT C1000" ||
    upper === "CAT GB" ||
    upper === "CAT SA" ||
    upper === "CAT AA";

  if (isStandardTier) {
    return {
      status: "LISTED",
      label: "Listed / Available",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      dotClass: "bg-emerald-500",
      icon: "🟢",
    };
  }

  // 4. Truly Unknown / Unmapped
  return {
    status: "UNKNOWN",
    label: "Unknown",
    badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
    dotClass: "bg-slate-400",
    icon: "⚪",
  };
}
