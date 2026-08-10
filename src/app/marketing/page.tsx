"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { apiClient } from "@/services/apiClient";
import {
  TrendingUp,
  Save,
  CheckCircle2,
  Code,
  Search,
  Tag,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function AdminMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

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
    setSuccessMsg(false);

    const payload = {
      googleAds: { adsId: googleAdsId, label: googleAdsConversionLabel },
      analytics: { ga4Id: ga4PropertyId, gtmId: gtmContainerId },
      meta: { pixelId: metaPixelId },
      seo: { title: metaTitle, description: metaDescription, keywords: metaKeywords },
      customScripts: { head: headScript },
    };

    try {
      const res = await apiClient.put("/admin/marketing", payload);
      if (res.data.success) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-royal selection:text-white">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <AdminHeader />

        <main className="flex-1 p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">SEO & Marketing Tracker Control</h1>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Configure Google Ads conversion tags, GA4 properties, Meta Pixel tracking, and SEO meta headers</p>
            </div>
            <button
              onClick={handleSaveMarketing}
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Configurations..." : "Save Tracking Config"}</span>
            </button>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Marketing tracking tags and SEO meta headers updated successfully!</span>
            </div>
          )}

          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading tracking configurations...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveMarketing} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Analytics & Ad Pixels */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-4">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Analytics & Tag Containers</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Google Analytics 4 ID</label>
                      <input
                        type="text"
                        value={ga4PropertyId}
                        onChange={(e) => setGa4PropertyId(e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold uppercase focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Google Tag Manager Container</label>
                      <input
                        type="text"
                        value={gtmContainerId}
                        onChange={(e) => setGtmContainerId(e.target.value)}
                        placeholder="GTM-XXXXXXX"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Google Ads ID</label>
                      <input
                        type="text"
                        value={googleAdsId}
                        onChange={(e) => setGoogleAdsId(e.target.value)}
                        placeholder="AW-XXXXXXXXX"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold uppercase focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Conversion Event Label</label>
                      <input
                        type="text"
                        value={googleAdsConversionLabel}
                        onChange={(e) => setGoogleAdsConversionLabel(e.target.value)}
                        placeholder="e.g. AbC_dEfGhIjKlMnOp"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meta (Facebook) Pixel ID</label>
                    <input
                      type="text"
                      value={metaPixelId}
                      onChange={(e) => setMetaPixelId(e.target.value)}
                      placeholder="123456789012345"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Meta Headers */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-4">
                  <Search className="w-5 h-5 text-purple-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Page-Level SEO Meta Tags</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meta Page Title *</label>
                    <input
                      type="text"
                      required
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="NVIT Solution | Institutional Bank Policy Comparison Platform"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meta Description *</label>
                    <textarea
                      required
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Compare commercial bank policies, FOIR multipliers, and pincode coverage."
                      className="w-full h-20 px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meta Keywords</label>
                    <input
                      type="text"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                      placeholder="bank policy, loan eligibility, foir calculator, personal loan"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Script Injector */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 lg:col-span-2">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-4">
                  <Code className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Custom Header Script Injector</h2>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Head Injector HTML Snippet (&lt;head&gt;)</label>
                  <textarea
                    value={headScript}
                    onChange={(e) => setHeadScript(e.target.value)}
                    placeholder="<!-- Inject custom script tags here -->"
                    className="w-full h-24 px-4 py-2.5 bg-slate-950 border border-slate-850 text-emerald-400 font-mono rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

