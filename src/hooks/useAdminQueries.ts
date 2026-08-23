import { useQuery } from "@tanstack/react-query";
import { apiClient, healthClient } from "@/services/apiClient";
import type {
  Bank,
  Company,
  Category,
  Pincode,
  Policy,
  LoanProduct,
  Lead,
  Customer,
  Executive,
  LoanApplication,
  AuditLog,
  DashboardStats,
  HealthData,
  PaginatedResult,
} from "@/types";

// ── Query Keys ───────────────────────────────────────────────────────────────
export const ADMIN_QUERY_KEYS = {
  health: ["admin", "health"] as const,
  dashboardStats: ["admin", "dashboardStats"] as const,
  recentAlerts: ["admin", "recentAlerts"] as const,
  banks: ["admin", "banks"] as const,
  companies: (page: number, search: string) => ["admin", "companies", { page, search }] as const,
  categories: (page: number, search: string) => ["admin", "categories", { page, search }] as const,
  pincodes: (page: number, search: string) => ["admin", "pincodes", { page, search }] as const,
  policies: (bankId?: string, page?: number) => ["admin", "policies", { bankId, page }] as const,
  loanProducts: (bankId?: string) => ["admin", "loanProducts", { bankId }] as const,
  crmLeads: (search?: string) => ["admin", "crmLeads", { search }] as const,
  crmCustomers: (page: number, search?: string) => ["admin", "crmCustomers", { page, search }] as const,
  executives: ["admin", "executives"] as const,
  applications: ["admin", "applications"] as const,
  auditLogs: (page: number, limit: number) => ["admin", "auditLogs", { page, limit }] as const,
};

// 1. Gateway Health Query
export function useHealthQuery() {
  return useQuery<HealthData>({
    queryKey: ADMIN_QUERY_KEYS.health,
    queryFn: async () => {
      const res = await healthClient.get<{ data: HealthData }>("/health");
      return res.data as unknown as HealthData;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: false,
    retryOnMount: false,
  });
}

// 2. Dashboard Stats
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ADMIN_QUERY_KEYS.dashboardStats,
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardStats }>("/admin/dashboard/stats");
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// 3. Recent Alerts for Header
export function useRecentAlerts() {
  return useQuery<AuditLog[]>({
    queryKey: ADMIN_QUERY_KEYS.recentAlerts,
    queryFn: async () => {
      const res = await apiClient.get<{ data: { items: AuditLog[] } }>("/admin/audit-logs?limit=4");
      return res.data.data?.items || [];
    },
    staleTime: 60 * 1000,
  });
}

// 4. Banks List
export function useBanksQuery() {
  return useQuery<Bank[]>({
    queryKey: ADMIN_QUERY_KEYS.banks,
    queryFn: async () => {
      const res = await apiClient.get<{ data: Bank[] }>("/admin/banks");
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 5. Companies Paginated
export function useCompaniesQuery(page: number, search: string) {
  return useQuery<PaginatedResult<Company>>({
    queryKey: ADMIN_QUERY_KEYS.companies(page, search),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResult<Company> }>(
        `/admin/companies?page=${page}&limit=20&query=${encodeURIComponent(search)}`
      );
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}

// 6. Categories
export function useCategoriesQuery(page: number, search: string) {
  return useQuery<PaginatedResult<Category>>({
    queryKey: ADMIN_QUERY_KEYS.categories(page, search),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResult<Category> }>(
        `/admin/categories?page=${page}&limit=20&search=${encodeURIComponent(search)}`
      );
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}

// 7. Pincodes Paginated
export function usePincodesQuery(page: number, search: string) {
  return useQuery<PaginatedResult<Pincode>>({
    queryKey: ADMIN_QUERY_KEYS.pincodes(page, search),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResult<Pincode> }>(
        `/admin/pincodes?page=${page}&limit=20&query=${encodeURIComponent(search)}`
      );
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}

// 8. Policies
export function usePoliciesQuery(bankId?: string, page: number = 1) {
  return useQuery<Policy[]>({
    queryKey: ADMIN_QUERY_KEYS.policies(bankId, page),
    queryFn: async () => {
      const url = bankId
        ? `/admin/policies?bankId=${bankId}&page=${page}`
        : `/admin/policies?page=${page}`;
      const res = await apiClient.get<{ data: Policy[] | { items: Policy[] } }>(url);
      const data = res.data.data;
      // Handle both paginated and flat array responses
      if (data && !Array.isArray(data) && "items" in data) {
        return (data as { items: Policy[] }).items;
      }
      return (data as Policy[]) || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// 9. Loan Products
export function useLoanProductsQuery(bankId?: string) {
  return useQuery<LoanProduct[]>({
    queryKey: ADMIN_QUERY_KEYS.loanProducts(bankId),
    queryFn: async () => {
      const url = bankId ? `/admin/products?bankId=${bankId}` : "/admin/products";
      const res = await apiClient.get<{ data: LoanProduct[] }>(url);
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 10. CRM Leads
export function useCrmLeadsQuery(search?: string) {
  return useQuery<Lead[]>({
    queryKey: ADMIN_QUERY_KEYS.crmLeads(search),
    queryFn: async () => {
      const url = search ? `/crm/leads?query=${encodeURIComponent(search)}` : "/crm/leads";
      const res = await apiClient.get<{ data: Lead[] }>(url);
      return res.data.data || [];
    },
    staleTime: 30 * 1000,
  });
}

// 11. CRM Customers
export function useCrmCustomersQuery(page: number = 1, search?: string) {
  return useQuery<PaginatedResult<Customer>>({
    queryKey: ADMIN_QUERY_KEYS.crmCustomers(page, search),
    queryFn: async () => {
      const url = `/crm/customers?page=${page}&limit=20${search ? `&query=${encodeURIComponent(search)}` : ""}`;
      const res = await apiClient.get<{ data: PaginatedResult<Customer> }>(url);
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}

// 12. Executives
export function useExecutivesQuery() {
  return useQuery<Executive[]>({
    queryKey: ADMIN_QUERY_KEYS.executives,
    queryFn: async () => {
      const res = await apiClient.get<{ data: Executive[] }>("/admin/users");
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 13. Loan Applications
export function useApplicationsQuery() {
  return useQuery<LoanApplication[]>({
    queryKey: ADMIN_QUERY_KEYS.applications,
    queryFn: async () => {
      const res = await apiClient.get<{ data: { items: LoanApplication[] } }>("/loan/applications");
      return res.data.data?.items || [];
    },
    staleTime: 45 * 1000,
  });
}

// 14. Audit Logs
export function useAuditLogsQuery(page: number = 1, limit: number = 30) {
  return useQuery<PaginatedResult<AuditLog>>({
    queryKey: ADMIN_QUERY_KEYS.auditLogs(page, limit),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResult<AuditLog> }>(
        `/admin/audit-logs?page=${page}&limit=${limit}`
      );
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}
