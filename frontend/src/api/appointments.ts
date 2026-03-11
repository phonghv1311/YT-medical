import api from './axios';

export type RequestConfig = { signal?: AbortSignal };

export const appointmentsApi = {
  getAll: (params?: { status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }, config?: RequestConfig) =>
    api.get('/appointments', { params, ...config }),

  getById: (id: number) => api.get(`/appointments/${id}`),

  create: (data: { doctorId: number; scheduledAt: string; startTime: string; endTime: string; type?: string; slotId?: number }) =>
    api.post('/appointments', data),

  cancel: (id: number, cancelReason?: string) =>
    api.put(`/appointments/${id}/cancel`, { cancelReason }),

  confirm: (id: number) => api.put(`/appointments/${id}/confirm`),

  startCall: (id: number) => api.post(`/appointments/${id}/start-call`),

  endCall: (id: number) => api.post(`/appointments/${id}/end-call`),

  review: (id: number, data: { rating: number; comment?: string }) =>
    api.post(`/appointments/${id}/review`, data),

  tip: (id: number, amount: number) =>
    api.post(`/appointments/${id}/tip`, { amount }),
};
