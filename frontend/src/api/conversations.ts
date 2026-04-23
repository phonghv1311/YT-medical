import api from './axios';

export type RequestConfig = { signal?: AbortSignal };

export const conversationsApi = {
  getList: (config?: RequestConfig) => api.get<unknown[]>('/conversations', config),
};
