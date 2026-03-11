import api from './axios';

type RequestConfig = { signal?: AbortSignal };

export const paymentsApi = {
  getPackages: (config?: RequestConfig) => api.get('/packages', config),

  buyPackage: (data: { packageId: number; paymentMethodId?: number }) =>
    api.post('/packages/buy', data),

  getTransactions: (params?: { page?: number; limit?: number }, config?: RequestConfig) =>
    api.get('/transactions', { params, ...config }),

  getPaymentMethods: (config?: RequestConfig) => api.get('/payment-methods', config),

  addPaymentMethod: (data: { type: string; provider: string; providerCustomerId?: string; last4?: string; isDefault?: boolean }) =>
    api.post('/payment-methods', data),
};
