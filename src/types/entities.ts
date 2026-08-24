// ============================================================
//  NVIT.SPACE Admin Portal — Shared Entity Type Definitions
//  Single source of truth for all API response shapes
// ============================================================

// ── Auth & User ─────────────────────────────────────────────
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EXECUTIVE" | "VIEWER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Bank / NBFC ──────────────────────────────────────────────
export type BankType = "BANK" | "NBFC";
export type PartnerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Bank {
  id: string;
  name: string;
  code: string;
  type: BankType;
  logoUrl?: string | null;
  applyEnabled?: boolean;
  applyUrl?: string | null;
  priority: number;
  partnerStatus: PartnerStatus | string;
  displayOrder: number;
  eligibility?: string | null;
  processingFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Company ─────────────────────────────────────────────────
export type CompanyStatus = "ACTIVE" | "INACTIVE" | "MERGED" | "CLOSED";

export interface CompanyBankCategory {
  id?: string;
  bankId: string;
  bank?: { id: string; name: string; code: string };
  bankName?: string;
  bankCode?: string;
  category: string;
  status: string;
  remarks?: string;
  isModified?: boolean;
  delete?: boolean;
}

export interface Company {
  id: string;
  name: string;
  cin?: string | null;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
  district?: string | null;
  status: CompanyStatus | string;
  bankCategories?: CompanyBankCategory[];
  companyCategories?: CompanyBankCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalPages: number;
  total: number;
}

// ── Category ────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Pincode ─────────────────────────────────────────────────
export interface Pincode {
  id: string;
  pincode: string;
  city?: string;
  state?: string;
  district?: string | null;
  area?: string | null;
  bankId?: string | null;
  bank?: { id: string; name: string; code: string } | null;
  isServiceable: boolean;
  isNegative?: boolean;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Loan Policy ─────────────────────────────────────────────
export interface Policy {
  id: string;
  bankId: string;
  bank?: Pick<Bank, "id" | "name" | "code"> | null;
  companyCategory: string;
  roi: number;
  minSalary: number;
  maxSalary?: number | null;
  minAge?: number | null;
  maxAge?: number | null;
  foir?: number | null;
  minCibil?: number | null;
  processingFee?: number | null;
  minLoanAmount?: number | null;
  maxLoanAmount?: number | null;
  minTenure?: number | null;
  maxTenure?: number | null;
  tenureMonths?: number | null;
  employmentType?: string | null;
  requiredDocuments?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Loan Product ────────────────────────────────────────────
export interface LoanProduct {
  id: string;
  bankId: string;
  bank?: Pick<Bank, "id" | "name" | "code"> | null;
  name: string;
  code?: string;
  type?: string;
  roiRange?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  minTenure?: number | null;
  maxTenure?: number | null;
  minTenureMonths?: number | null;
  maxTenureMonths?: number | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── CRM Lead ────────────────────────────────────────────────
export type LeadStatus = "NEW" | "CONTACTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "CLOSED" | string;

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  company?: string | null;
  companyName?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  loanType?: string | null;
  loanAmount?: number | null;
  monthlySalary?: number | null;
  monthlyIncome?: number | null;
  status: LeadStatus;
  assignedTo?: string | null;
  notes?: any;
  createdAt: string;
  updatedAt: string;
}

export type LoanApplication = Lead;

// ── CRM Customer ────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  mobile: string;
  company?: string | null;
  city?: string | null;
  state?: string | null;
  monthlyIncome?: number | null;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Executive ───────────────────────────────────────────────
export interface Executive {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ── Audit Log ───────────────────────────────────────────────
export interface AuditLog {
  id: string;
  action: string;
  userEmail?: string | null;
  entity: string;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
  createdAt: string;
}

// ── API Key ─────────────────────────────────────────────────
export interface ApiKey {
  id: string;
  name: string;
  key?: string;
  keyPrefix?: string;
  status?: string;
  lastUsedAt?: string | null;
  createdAt: string;
  revokedAt?: string | null;
}

// ── Scan Category (Maintenance) ─────────────────────────────
export interface ScanCategory {
  id: string;
  title: string;
  description: string;
  count: number;
  riskLevel: "SAFE" | "LOW" | "MODERATE" | string;
  impact?: string;
  sampleItems: any[];
}

// ── Health Data ─────────────────────────────────────────────
export interface HealthData {
  status: "ok" | "error" | "degraded";
  timestamp: string;
  version?: string;
  database?: "connected" | "disconnected";
  uptime?: number;
}

// ── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  metrics: {
    totalBanks: number;
    totalCompanies: number;
    totalPincodes: number;
    totalApplications?: number;
    totalLeads?: number;
    todaysLeads?: number;
    pendingLeads?: number;
    approvedLeads?: number;
    rejectedLeads?: number;
    todaysSearches?: number;
    monthlySearches?: number;
    activeUsers?: number;
    googleAdsStatus?: string;
    websiteStatus?: string;
    storageUsage?: string;
    systemHealth?: string;
    excelUploads?: number;
  };
  latestLeads?: Lead[];
  recentPolicyUpdates?: Policy[];
  recentAuditLogs?: AuditLog[];
}
