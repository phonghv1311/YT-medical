import api from './axios';

export type RequestConfig = { signal?: AbortSignal };

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }, config?: RequestConfig) =>
    api.get('/notifications', { params, ...config }),

  create: (payload: { type: 'appointment' | 'payment' | 'system' | 'chat'; title: string; body: string }) =>
    api.post('/notifications', payload),

  markAsRead: (id: number) =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/notifications/read-all'),
};
