"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { apiClient } from "@/services/apiClient";
import {
  Globe,
  Save,
  CheckCircle2,
  Layout,
  Type,
  Palette,
  Sparkles,
  Building2,
  Users,
  MapPin,
  Phone,
  Mail,
  FileText,
} from "lucide-react";

export default function AdminCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ── Hero Section ──────────────────────────────────────────
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");

  // ── Brand / Theme ─────────────────────────────────────────
  const [headerLogoUrl, setHeaderLogoUrl] = useState("");
  const [primaryThemeColor, setPrimaryThemeColor] = useState("#2563eb");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  // ── Vision & Mission ──────────────────────────────────────
  const [visionText, setVisionText] = useState("");
  const [missionText, setMissionText] = useState("");
  const [aboutDescription, setAboutDescription] = useState("");

  // ── Company Details ───────────────────────────────────────
  const [companyName, setCompanyName] = useState("NVIT SOLUTION PVT. LTD.");
  const [companyTagline, setCompanyTagline] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyCin, setCompanyCin] = useState("");
  const [companyGst, setCompanyGst] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // ── Founders ──────────────────────────────────────────────
  const [founderName, setFounderName] = useState("Nishant Bhardwaj");
  const [founderTitle, setFounderTitle] = useState("Founder & CEO");
  const [founderBio, setFounderBio] = useState("");
  const [founderLinkedin, setFounderLinkedin] = useState("");

  const [coFounderName, setCoFounderName] = useState("Vineet");
  const [coFounderTitle, setCoFounderTitle] = useState("Co-Founder & CTO");
  const [coFounderBio, setCoFounderBio] = useState("");
  const [coFounderLinkedin, setCoFounderLinkedin] = useState("");

  const [cmsStatus, setCmsStatus] = useState("DRAFT");
  const [cmsHistory, setCmsHistory] = useState<any[]>([]);

  const fetchCMS = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/cms");
      if (res.data.success) {
        const data = res.data.data;
        if (data.hero) {
          setHeroTitle(data.hero.title || "");
          setHeroSubtitle(data.hero.subtitle || "");
        }
        if (data.brand) {
          setHeaderLogoUrl(data.brand.logoUrl || "");
          setPrimaryThemeColor(data.brand.themeColor || "#2563eb");
          setSupportEmail(data.brand.supportEmail || "");
          setSupportPhone(data.brand.supportPhone || "");
        }
        if (data.about) {
          setVisionText(data.about.vision || "");
          setMissionText(data.about.mission || "");
          setAboutDescription(data.about.description || "");
        }
        if (data.company) {
          setCompanyName(data.company.name || "NVIT SOLUTION PVT. LTD.");
          setCompanyTagline(data.company.tagline || "");
          setCompanyAddress(data.company.address || "");
          setCompanyCity(data.company.city || "");
          setCompanyState(data.company.state || "");
          setCompanyCin(data.company.cin || "");
          setCompanyGst(data.company.gst || "");
          setCompanyWebsite(data.company.website || "");
        }
        if (data.founders) {
          setFounderName(data.founders.founder?.name || "Nishant Bhardwaj");
          setFounderTitle(data.founders.founder?.title || "Founder & CEO");
          setFounderBio(data.founders.founder?.bio || "");
          setFounderLinkedin(data.founders.founder?.linkedin || "");
          setCoFounderName(data.founders.coFounder?.name || "Vineet");
          setCoFounderTitle(data.founders.coFounder?.title || "Co-Founder & CTO");
          setCoFounderBio(data.founders.coFounder?.bio || "");
          setCoFounderLinkedin(data.founders.coFounder?.linkedin || "");
        }
        if (data.status) setCmsStatus(data.status);
        if (data.history) setCmsHistory(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMS();
  }, []);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    const payload = {
      hero: { title: heroTitle, subtitle: heroSubtitle },
      brand: { logoUrl: headerLogoUrl, themeColor: primaryThemeColor, supportEmail, supportPhone },
      about: { vision: visionText, mission: missionText, description: aboutDescription },
      company: {
        name: companyName,
        tagline: companyTagline,
        address: companyAddress,
        city: companyCity,
        state: companyState,
        cin: companyCin,
        gst: companyGst,
        website: companyWebsite,
      },
      founders: {
        founder: { name: founderName, title: founderTitle, bio: founderBio, linkedin: founderLinkedin },
        coFounder: { name: coFounderName, title: coFounderTitle, bio: coFounderBio, linkedin: coFounderLinkedin },
      },
    };

    try {
      const res = await apiClient.put("/admin/cms", payload);
      if (res.data.success) {
        setSuccessMsg("Draft version saved successfully!");
        fetchCMS();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishLive = async () => {
    setPublishing(true);
    setSuccessMsg("");
    try {
      const res = await apiClient.post("/admin/cms/publish");
      if (res.data.success) {
        setSuccessMsg("CMS changes successfully published and live!");
        fetchCMS();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to publish live");
    } finally {
      setPublishing(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!confirm(`Are you sure you want to rollback to version ${version}?`)) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/admin/cms/rollback", { version });
      if (res.data.success) {
        setSuccessMsg(`CMS rolled back to version ${version} successfully!`);
        fetchCMS();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to rollback version");
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors";
  const labelCls = "text-[10px] font-black uppercase text-slate-400 tracking-wider";
  const sectionCls = "bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6";

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-royal selection:text-white">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <AdminHeader />

        <main className="flex-1 p-8 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Website CMS & Company Settings</h1>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                  cmsStatus === "PUBLISHED"
                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                    : "border-amber-500 text-amber-400 bg-amber-500/10 animate-pulse"
                }`}>
                  {cmsStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Manage company name, founders, contact details, hero content, and branding
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                form="cms-form"
                disabled={saving || publishing}
                className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-400" />
                <span>{saving ? "Saving Draft..." : "Save Draft"}</span>
              </button>
              <button
                type="button"
                onClick={handlePublishLive}
                disabled={saving || publishing}
                className="h-10 px-5 rounded-xl bg-royal hover:bg-royal-hover disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-royal/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>{publishing ? "Publishing..." : "Publish Live"}</span>
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading CMS configurations...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <form id="cms-form" onSubmit={handleSaveDraft} className="space-y-8">

                {/* ── Section 1: Company Details ─────────────────────────── */}
                <div className={sectionCls}>
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Company Details</h2>
                    <span className="ml-auto text-[10px] font-bold text-slate-500">Displayed in footer, about page, and legal sections</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className={labelCls}>Company Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. NVIT SOLUTION PVT. LTD."
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Company Tagline</label>
                      <input
                        type="text"
                        value={companyTagline}
                        onChange={(e) => setCompanyTagline(e.target.value)}
                        placeholder="e.g. Empowering Financial Decisions"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className={labelCls}>Registered Office Address</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="e.g. Sector 8, E-14, 3rd Floor, near Java Showroom, Sector 15 Metro"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>City</label>
                      <input
                        type="text"
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        placeholder="e.g. Noida"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>State & PIN</label>
                      <input
                        type="text"
                        value={companyState}
                        onChange={(e) => setCompanyState(e.target.value)}
                        placeholder="e.g. Uttar Pradesh – 201301"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>CIN / Registration No.</label>
                      <input
                        type="text"
                        value={companyCin}
                        onChange={(e) => setCompanyCin(e.target.value)}
                        placeholder="e.g. U74999UP2024PTC000000"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>GST Number</label>
                      <input
                        type="text"
                        value={companyGst}
                        onChange={(e) => setCompanyGst(e.target.value)}
                        placeholder="e.g. 09AAAAA0000A1Z5"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Support Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="email"
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          placeholder="info@nvitsolution.com"
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Support Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          value={supportPhone}
                          onChange={(e) => setSupportPhone(e.target.value)}
                          placeholder="+91-85100-88409"
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Website URL</label>
                      <input
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://nvitsolution.com"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Founders ────────────────────────────────── */}
                <div className={sectionCls}>
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Founders & Leadership</h2>
                    <span className="ml-auto text-[10px] font-bold text-slate-500">Displayed on About / Team sections</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Founder */}
                    <div className="space-y-4 p-6 bg-slate-950 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black">F</div>
                        <span className="text-xs font-black text-white uppercase tracking-wider">Founder</span>
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Full Name *</label>
                        <input
                          type="text"
                          required
                          value={founderName}
                          onChange={(e) => setFounderName(e.target.value)}
                          placeholder="e.g. Nishant Bhardwaj"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Title / Designation</label>
                        <input
                          type="text"
                          value={founderTitle}
                          onChange={(e) => setFounderTitle(e.target.value)}
                          placeholder="e.g. Founder & CEO"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Short Bio</label>
                        <textarea
                          value={founderBio}
                          onChange={(e) => setFounderBio(e.target.value)}
                          placeholder="Brief background, expertise, and vision..."
                          className={`${inputCls} h-24 resize-none`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>LinkedIn Profile URL</label>
                        <input
                          type="url"
                          value={founderLinkedin}
                          onChange={(e) => setFounderLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/nishant-bhardwaj"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Co-Founder */}
                    <div className="space-y-4 p-6 bg-slate-950 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-black">CF</div>
                        <span className="text-xs font-black text-white uppercase tracking-wider">Co-Founder</span>
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Full Name *</label>
                        <input
                          type="text"
                          required
                          value={coFounderName}
                          onChange={(e) => setCoFounderName(e.target.value)}
                          placeholder="e.g. Vineet"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Title / Designation</label>
                        <input
                          type="text"
                          value={coFounderTitle}
                          onChange={(e) => setCoFounderTitle(e.target.value)}
                          placeholder="e.g. Co-Founder & CTO"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Short Bio</label>
                        <textarea
                          value={coFounderBio}
                          onChange={(e) => setCoFounderBio(e.target.value)}
                          placeholder="Brief background, expertise, and vision..."
                          className={`${inputCls} h-24 resize-none`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>LinkedIn Profile URL</label>
                        <input
                          type="url"
                          value={coFounderLinkedin}
                          onChange={(e) => setCoFounderLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/vineet"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: About / Vision / Mission ────────────────── */}
                <div className={`${sectionCls}`}>
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">About Section & Mission</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1 md:col-span-2">
                      <label className={labelCls}>About / Company Description</label>
                      <textarea
                        value={aboutDescription}
                        onChange={(e) => setAboutDescription(e.target.value)}
                        placeholder="e.g. NVIT Solution PVT. LTD. is India's trusted DSA loan consultancy and financial technology marketplace..."
                        className={`${inputCls} h-28 resize-none`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Vision Statement</label>
                      <textarea
                        value={visionText}
                        onChange={(e) => setVisionText(e.target.value)}
                        placeholder="State the institutional vision..."
                        className={`${inputCls} h-24 resize-none`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Mission Statement</label>
                      <textarea
                        value={missionText}
                        onChange={(e) => setMissionText(e.target.value)}
                        placeholder="State the operational mission..."
                        className={`${inputCls} h-24 resize-none`}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Hero Banner ─────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={sectionCls}>
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                      <Layout className="w-5 h-5 text-purple-400" />
                      <h2 className="text-sm font-black text-white uppercase tracking-wider">Public Hero Banner</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className={labelCls}>Main Hero Headline *</label>
                        <input
                          type="text"
                          required
                          value={heroTitle}
                          onChange={(e) => setHeroTitle(e.target.value)}
                          placeholder="e.g. Smart Institutional Credit Matching Platform"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Sub-Headline Tagline *</label>
                        <textarea
                          required
                          value={heroSubtitle}
                          onChange={(e) => setHeroSubtitle(e.target.value)}
                          placeholder="e.g. Compare bank policies, eligibility parameters instantly."
                          className={`${inputCls} h-24 resize-none`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Section 5: Branding ───────────────────────────────── */}
                  <div className={sectionCls}>
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                      <Palette className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-sm font-black text-white uppercase tracking-wider">Branding & Theme</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className={labelCls}>Header Brand Logo URL</label>
                        <input
                          type="text"
                          value={headerLogoUrl}
                          onChange={(e) => setHeaderLogoUrl(e.target.value)}
                          placeholder="e.g. /images/logo.png"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Primary Accent Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={primaryThemeColor}
                            onChange={(e) => setPrimaryThemeColor(e.target.value)}
                            className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={primaryThemeColor}
                            onChange={(e) => setPrimaryThemeColor(e.target.value)}
                            className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 text-white font-mono rounded-xl text-xs font-semibold uppercase focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </form>

              {/* ── Version History ──────────────────────────────────────── */}
              <div className={sectionCls}>
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">CMS Publication Version History</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-500 text-[10px] uppercase font-black tracking-wider border-b border-slate-800">
                        <th className="py-3 px-5">Version</th>
                        <th className="py-3 px-5">Published By</th>
                        <th className="py-3 px-5">Timestamp</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs font-bold text-slate-200">
                      {cmsHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                            No publication versions recorded yet. Save and Publish to log first version.
                          </td>
                        </tr>
                      ) : (
                        [...cmsHistory].reverse().map((h) => (
                          <tr key={h.version} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-5 font-black text-blue-400">v{h.version}</td>
                            <td className="py-3.5 px-5 font-medium text-white">{h.publishedBy}</td>
                            <td className="py-3.5 px-5 font-mono text-[10px] text-slate-500">
                              {new Date(h.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRollback(h.version)}
                                className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-[10px] font-black text-white rounded-lg border border-slate-800 cursor-pointer transition-colors"
                              >
                                Restore
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

