"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/services/apiClient";
import {
  Globe,
  Save,
  CheckCircle2,
  Layout,
  Type,
  Palette,
  Building2,
  Users,
  MapPin,
  Phone,
  Mail,
  FileText,
  History,
  Sparkles,
  Send,
} from "lucide-react";
import { AdminFormSkeleton } from "@/components/AdminSkeleton";
import { useToast } from "@/components/ui/Toast";

export default function AdminCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"HERO" | "BRAND" | "ABOUT" | "COMPANY" | "FOUNDERS">("HERO");
  const { showToast } = useToast();

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
  const [companyName, setCompanyName] = useState("NVIT.SPACE");
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
          setCompanyName(data.company.name || "NVIT.SPACE");
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
      }
    } catch (err) {
      console.error("Failed to load CMS content", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMS();
  }, []);

  const getPayload = (status: "DRAFT" | "PUBLISHED") => ({
    status,
    hero: { title: heroTitle, subtitle: heroSubtitle },
    brand: {
      logoUrl: headerLogoUrl,
      themeColor: primaryThemeColor,
      supportEmail,
      supportPhone,
    },
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
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await apiClient.post("/admin/cms", getPayload("DRAFT"));
      setCmsStatus("DRAFT");
      showToast({ title: "CMS Draft saved successfully", type: "success" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Save failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await apiClient.post("/admin/cms", getPayload("PUBLISHED"));
      setCmsStatus("PUBLISHED");
      showToast({ title: "CMS Changes published live to website!", type: "success" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Publish failed";
      showToast({ title: msg, type: "error" });
    } finally {
      setPublishing(false);
    }
  };

  const tabs = [
    { id: "HERO", label: "Hero Header", icon: Type },
    { id: "BRAND", label: "Brand & Colors", icon: Palette },
    { id: "ABOUT", label: "Vision & About", icon: FileText },
    { id: "COMPANY", label: "Legal Entity", icon: Building2 },
    { id: "FOUNDERS", label: "Founders", icon: Users },
  ] as const;

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Website CMS &amp; Live Site Editor
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10.5">
            Manage public website copy, hero headers, support channels, brand themes, and corporate legal entity records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            className="btn-secondary h-10 px-4 text-xs font-bold"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            <span>Save Draft</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={saving || publishing}
            className="btn-primary h-10 px-5 text-xs font-bold"
          >
            <Send className={`w-3.5 h-3.5 ${publishing ? "animate-spin" : ""}`} />
            <span>Publish Live Site</span>
          </button>
        </div>
      </div>

      {/* ── Tabs Bar ─────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-white/[0.08]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <AdminFormSkeleton />
      ) : (
        <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
          {/* ── HERO TAB ───────────────────────────────────────── */}
          {activeTab === "HERO" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Landing Page Hero Title *
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="e.g. Check Loan Eligibility Across 50+ Lenders Instantly"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Landing Page Hero Subtitle
                </label>
                <textarea
                  rows={3}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="e.g. Multi-lender underwriting matrix matching your exact employer category and income parameters."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-medium focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* ── BRAND TAB ──────────────────────────────────────── */}
          {activeTab === "BRAND" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Header Logo URL</label>
                  <input
                    type="url"
                    value={headerLogoUrl}
                    onChange={(e) => setHeaderLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.svg"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Primary Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryThemeColor}
                      onChange={(e) => setPrimaryThemeColor(e.target.value)}
                      className="w-12 h-11 rounded-xl bg-transparent border border-slate-200 dark:border-white/[0.08] cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      value={primaryThemeColor}
                      onChange={(e) => setPrimaryThemeColor(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@nvit.space"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Support Helpline</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── ABOUT TAB ──────────────────────────────────────── */}
          {activeTab === "ABOUT" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Corporate Vision</label>
                <textarea
                  rows={3}
                  value={visionText}
                  onChange={(e) => setVisionText(e.target.value)}
                  placeholder="Empowering every salaried professional with transparent lending access..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-medium focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Corporate Mission</label>
                <textarea
                  rows={3}
                  value={missionText}
                  onChange={(e) => setMissionText(e.target.value)}
                  placeholder="Democratizing credit underwriting through automated employer categorization..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-medium focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Company Overview</label>
                <textarea
                  rows={4}
                  value={aboutDescription}
                  onChange={(e) => setAboutDescription(e.target.value)}
                  placeholder="Detailed company background and technology platform overview..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-medium focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* ── COMPANY TAB ────────────────────────────────────── */}
          {activeTab === "COMPANY" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Entity Legal Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="NVIT.SPACE"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tagline / Motto</label>
                  <input
                    type="text"
                    value={companyTagline}
                    onChange={(e) => setCompanyTagline(e.target.value)}
                    placeholder="Intelligent Credit Underwriting Engine"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Registered Office Address</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="e.g. Cyber City, Sector 24"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">City</label>
                  <input
                    type="text"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    placeholder="Gurugram"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">State</label>
                  <input
                    type="text"
                    value={companyState}
                    onChange={(e) => setCompanyState(e.target.value)}
                    placeholder="Haryana"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">CIN Number</label>
                  <input
                    type="text"
                    value={companyCin}
                    onChange={(e) => setCompanyCin(e.target.value.toUpperCase())}
                    placeholder="U72900HR2024PTC123456"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">GSTIN Identification</label>
                  <input
                    type="text"
                    value={companyGst}
                    onChange={(e) => setCompanyGst(e.target.value.toUpperCase())}
                    placeholder="06AAAAA0000A1Z5"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Website URL</label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://nvit.space"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── FOUNDERS TAB ───────────────────────────────────── */}
          {activeTab === "FOUNDERS" && (
            <div className="space-y-6">
              {/* Founder 1 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Primary Founder Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Name</label>
                    <input
                      type="text"
                      value={founderName}
                      onChange={(e) => setFounderName(e.target.value)}
                      placeholder="Nishant Bhardwaj"
                      className="w-full px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Designation / Title</label>
                    <input
                      type="text"
                      value={founderTitle}
                      onChange={(e) => setFounderTitle(e.target.value)}
                      placeholder="Founder & CEO"
                      className="w-full px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Bio Summary</label>
                  <textarea
                    rows={2}
                    value={founderBio}
                    onChange={(e) => setFounderBio(e.target.value)}
                    placeholder="Leadership background and fintech experience..."
                    className="w-full px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-medium focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">LinkedIn URL</label>
                  <input
                    type="url"
                    value={founderLinkedin}
                    onChange={(e) => setFounderLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/nishant"
                    className="w-full px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Founder 2 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Co-Founder Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Name</label>
                    <input
                      type="text"
                      value={coFounderName}
                      onChange={(e) => setCoFounderName(e.target.value)}
                      placeholder="Vineet"
                      className="w-full px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Designation / Title</label>
                    <input
                      type="text"
                      value={coFounderTitle}
                      onChange={(e) => setCoFounderTitle(e.target.value)}
                      placeholder="Co-Founder & CTO"
                      className="w-full px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Bio Summary</label>
                  <textarea
                    rows={2}
                    value={coFounderBio}
                    onChange={(e) => setCoFounderBio(e.target.value)}
                    placeholder="Engineering and platform architecture experience..."
                    className="w-full px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-medium focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">LinkedIn URL</label>
                  <input
                    type="url"
                    value={coFounderLinkedin}
                    onChange={(e) => setCoFounderLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/vineet"
                    className="w-full px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
