import { useQuery } from "@tanstack/react-query";
import { apiClient, healthClient } from "@/services/apiClient";

// Query Keys
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

// 1. Gateway Health Query — uses dedicated healthClient (5s timeout, never blocked by uploads)
export function useHealthQuery() {
  return useQuery<any>({
    queryKey: ADMIN_QUERY_KEYS.health,
    queryFn: async () => {
      const res = await healthClient.get("/health");
      return res.data;
    },
    staleTime: 60 * 1000,        // 1 minute cache
    refetchInterval: 60 * 1000,  // Poll every 60s (not 30s) — less noise during uploads
    retry: false,                // Don't retry on fail — avoids showing "Offline" on transient blip
    retryOnMount: false,
  });
}

// 2. Dashboard Stats (Cached for 2 minutes)
export function useDashboardStats() {
  return useQuery<any>({
    queryKey: ADMIN_QUERY_KEYS.dashboardStats,
    queryFn: async () => {
      const res = await apiClient.get("/admin/dashboard/stats");
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// 3. Lightweight Recent Alerts for Header (Cached for 1 minute)
export function useRecentAlerts() {
  return useQuery<any[]>({
    queryKey: ADMIN_QUERY_KEYS.recentAlerts,
    queryFn: async () => {
      const res = await apiClient.get("/admin/audit-logs?limit=4");
      return res.data.data?.items || [];
    },
    staleTime: 60 * 1000,
  });
}

// 4. Banks List (Cached for 5 minutes)
export function useBanksQuery() {
  return useQuery<any[]>({
    queryKey: ADMIN_QUERY_KEYS.banks,
    queryFn: async () => {
      const res = await apiClient.get("/admin/banks");
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 5. Companies Paginated & Filtered Query
export function useCompaniesQuery(page: number, search: string) {
  return useQuery<{ items: any[]; totalPages: number; total: number }>({
    queryKey: ADMIN_QUERY_KEYS.companies(page, search),
    queryFn: async () => {
      const res = await apiClient.get(`/admin/companies?page=${page}&limit=20&query=${encodeURIComponent(search)}`);
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}

// 6. Categories Mapping Query
export function useCategoriesQuery(page: number, search: string) {
  return useQuery<{ items: any[]; totalPages: number; total: number }>({
    queryKey: ADMIN_QUERY_KEYS.categories(page, search),
    queryFn: async () => {
      const res = await apiClient.get(`/admin/categories?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}

// 7. Pincodes Paginated Query
export function usePincodesQuery(page: number, search: string) {
  return useQuery<{ items: any[]; totalPages: number; total: number }>({
    queryKey: ADMIN_QUERY_KEYS.pincodes(page, search),
    queryFn: async () => {
      const res = await apiClient.get(`/admin/pincodes?page=${page}&limit=20&query=${encodeURIComponent(search)}`);
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}

// 8. Policies Query
export function usePoliciesQuery(bankId?: string, page: number = 1) {
  return useQuery<{ items: any[]; totalPages: number } | any[]>({
    queryKey: ADMIN_QUERY_KEYS.policies(bankId, page),
    queryFn: async () => {
      const url = bankId
        ? `/admin/policies?bankId=${bankId}&page=${page}`
        : `/admin/policies?page=${page}`;
      const res = await apiClient.get(url);
      return res.data.data?.items || res.data.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// 9. Loan Products Query
export function useLoanProductsQuery(bankId?: string) {
  return useQuery<any[]>({
    queryKey: ADMIN_QUERY_KEYS.loanProducts(bankId),
    queryFn: async () => {
      const url = bankId ? `/admin/products?bankId=${bankId}` : "/admin/products";
      const res = await apiClient.get(url);
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 10. CRM Leads Query (Live pipeline: 30s staleTime)
export function useCrmLeadsQuery(search?: string) {
  return useQuery<any[]>({
    queryKey: ADMIN_QUERY_KEYS.crmLeads(search),
    queryFn: async () => {
      const url = search ? `/crm/leads?query=${encodeURIComponent(search)}` : "/crm/leads";
      const res = await apiClient.get(url);
      return res.data.data || [];
    },
    staleTime: 30 * 1000,
  });
}

// 11. CRM Customers Query
export function useCrmCustomersQuery(page: number = 1, search?: string) {
  return useQuery<{ items: any[]; totalPages: number }>({
    queryKey: ADMIN_QUERY_KEYS.crmCustomers(page, search),
    queryFn: async () => {
      const url = `/crm/customers?page=${page}&limit=20${search ? `&query=${encodeURIComponent(search)}` : ""}`;
      const res = await apiClient.get(url);
      return res.data.data || { items: [], totalPages: 1 };
    },
    staleTime: 60 * 1000,
  });
}

// 12. Executives Team Query
export function useExecutivesQuery() {
  return useQuery<any[]>({
    queryKey: ADMIN_QUERY_KEYS.executives,
    queryFn: async () => {
      const res = await apiClient.get("/admin/users");
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 13. Loan Applications Leads Query
export function useApplicationsQuery() {
  return useQuery<any[]>({
    queryKey: ADMIN_QUERY_KEYS.applications,
    queryFn: async () => {
      const res = await apiClient.get("/loan/applications");
      return res.data.data?.items || [];
    },
    staleTime: 45 * 1000,
  });
}

// 14. Audit Logs Query
export function useAuditLogsQuery(page: number = 1, limit: number = 30) {
  return useQuery<{ items: any[]; totalPages: number; total: number }>({
    queryKey: ADMIN_QUERY_KEYS.auditLogs(page, limit),
    queryFn: async () => {
      const res = await apiClient.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
      return res.data.data || { items: [], totalPages: 1, total: 0 };
    },
    staleTime: 60 * 1000,
  });
}
