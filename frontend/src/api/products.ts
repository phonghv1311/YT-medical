import api from './axios';

export type RequestConfig = { signal?: AbortSignal };

export const productsApi = {
  getList: (config?: RequestConfig) =>
    api.get<{ data?: unknown[] }>('/products', config),
};
