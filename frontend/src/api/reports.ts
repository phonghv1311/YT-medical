import api from './axios';

export type RequestConfig = { signal?: AbortSignal };

export type SuperadminDashboardResponse = {
  metrics: Record<string, { total: number; thisMonth: number; lastMonth: number; changePct: number }>;
  cashflow: {
    revenueThisMonth: number;
    revenueLastMonth: number;
    changePct: number;
    dailySeries: Array<{ date: string; value: number }>;
    revenueByType: Record<string, number>;
  };
};

export const reportsApi = {
  getSuperadminDashboard: (config?: RequestConfig) =>
    api.get<SuperadminDashboardResponse>('/reports/superadmin-dashboard', config),
};

