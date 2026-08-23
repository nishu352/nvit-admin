"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import {
  Megaphone,
  Save,
  CheckCircle2,
  Code,
  Search,
  Tag,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Globe,
  Share2,
} from "lucide-react";
import { AdminFormSkeleton } from "@/components/AdminSkeleton";
import { useToast } from "@/components/ui/Toast";

export default function AdminMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Marketing Tracking Fields
  const [googleAdsId, setGoogleAdsId] = useState("");
  const [googleAdsConversionLabel, setGoogleAdsConversionLabel] = useState("");
  const [ga4PropertyId, setGa4PropertyId] = useState("");
  const [gtmContainerId, setGtmContainerId] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [headScript, setHeadScript] = useState("");

  // SEO Fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  const fetchMarketing = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/marketing");
      if (res.data.success) {
        const data = res.data.data;
        if (data.googleAds) {
          setGoogleAdsId(data.googleAds.adsId || "");
          setGoogleAdsConversionLabel(data.googleAds.label || "");
        }
        if (data.analytics) {
          setGa4PropertyId(data.analytics.ga4Id || "");
          setGtmContainerId(data.analytics.gtmId || "");
        }
        if (data.meta) {
          setMetaPixelId(data.meta.pixelId || "");
        }
        if (data.seo) {
          setMetaTitle(data.seo.title || "");
          setMetaDescription(data.seo.description || "");
          setMetaKeywords(data.seo.keywords || "");
        }
        if (data.customScripts) {
          setHeadScript(data.customScripts.head || "");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketing();
  }, []);

  const handleSaveMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      googleAds: { adsId: googleAdsId.trim(), label: googleAdsConversionLabel.trim() },
      analytics: { ga4Id: ga4PropertyId.trim(), gtmId: gtmContainerId.trim() },
      meta: { pixelId: metaPixelId.trim() },
      seo: {
        title: metaTitle.trim(),
        description: metaDescription.trim(),
        keywords: metaKeywords.trim(),
      },
      customScripts: { head: headScript.trim() },
    };

    try {
      const res = await apiClient.put("/admin/marketing", payload);
      if (res.data.success) {
        showToast({ title: "Marketing and SEO telemetry updated!", type: "success" });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Save failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Marketing, Ads &amp; SEO Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Configure Google Ads conversions, GA4 / GTM telemetry, Meta Pixel events, and global SEO metatags.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleSaveMarketing}
            disabled={saving}
            className="btn-primary h-10 px-5 text-xs font-bold"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving Config..." : "Save Marketing Telemetry"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <AdminFormSkeleton />
      ) : (
        <form onSubmit={handleSaveMarketing} className="space-y-6">
          {/* ── Section 1: Ad Conversions & Analytics ─────────────── */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Ad Conversion Tracking &amp; Analytics
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Google Ads Conversion ID
                </label>
                <input
                  type="text"
                  value={googleAdsId}
                  onChange={(e) => setGoogleAdsId(e.target.value)}
                  placeholder="e.g. AW-1234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Google Ads Conversion Label
                </label>
                <input
                  type="text"
                  value={googleAdsConversionLabel}
                  onChange={(e) => setGoogleAdsConversionLabel(e.target.value)}
                  placeholder="e.g. AbCdEfGhIjKlMnOp"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  GA4 Measurement ID
                </label>
                <input
                  type="text"
                  value={ga4PropertyId}
                  onChange={(e) => setGa4PropertyId(e.target.value)}
                  placeholder="e.g. G-XXXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  GTM Container ID
                </label>
                <input
                  type="text"
                  value={gtmContainerId}
                  onChange={(e) => setGtmContainerId(e.target.value)}
                  placeholder="e.g. GTM-XXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Meta Pixel ID
                </label>
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="e.g. 1234567890123456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Global SEO Metatags ────────────────────── */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <Search className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Global SEO &amp; Social Graph Metadata
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Global Meta Title
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="NVIT.SPACE | Check Loan Eligibility Across 50+ Banks Instantly"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Global Meta Description
                </label>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Instant multi-lender credit underwriting, company category checks, and low-ROI personal loans in India."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-medium focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  SEO Keywords (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder="personal loans, company category list, bank policies, credit underwriting, cibil check"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── Section 3: Custom Head Scripts ────────────────────── */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <Code className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Custom Header HTML &amp; JavaScript Injection
              </h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Header Raw Snippet</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  Injected into &lt;head&gt; across all public pages
                </span>
              </label>
              <textarea
                rows={5}
                value={headScript}
                onChange={(e) => setHeadScript(e.target.value)}
                placeholder="<!-- Paste your custom tracking tag, Chatbot script, or verification code here -->"
                className="w-full p-4 bg-slate-950 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs font-mono text-emerald-400 focus:outline-none resize-none"
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
