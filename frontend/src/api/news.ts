import api from './axios';

export type RequestConfig = { signal?: AbortSignal };

export const newsApi = {
  getList: (config?: RequestConfig) =>
    api.get<{ data?: unknown[] }>('/news', {
      ...(config || {}),
      headers: {
        'Cache-Control': 'no-store',
      },
    }),

  getById: (id: number, config?: RequestConfig) =>
    api.get<{ data?: unknown }>(`/news/${id}`, config),

  create: (data: {
    title: string;
    category?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
    scheduledAt?: string;
    content: string[];
    coverImage?: File | null;
  }, config?: RequestConfig) => {
    const form = new FormData();
    form.append('title', data.title);
    if (data.category) form.append('category', data.category);
    form.append('status', data.status);
    if (data.scheduledAt) form.append('scheduledAt', data.scheduledAt);
    form.append('content', JSON.stringify(data.content ?? []));
    if (data.coverImage) form.append('coverImage', data.coverImage);
    return api.post<{ data?: unknown }>(
      '/news',
      form,
      { ...(config || {}), headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  update: (id: number, data: {
    title: string;
    category?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
    scheduledAt?: string;
    content: string[];
    coverImage?: File | null;
  }, config?: RequestConfig) => {
    const form = new FormData();
    form.append('title', data.title);
    if (data.category) form.append('category', data.category);
    form.append('status', data.status);
    if (data.scheduledAt) form.append('scheduledAt', data.scheduledAt);
    form.append('content', JSON.stringify(data.content ?? []));
    if (data.coverImage) form.append('coverImage', data.coverImage);
    return api.put<{ data?: unknown }>(
      `/news/${id}`,
      form,
      { ...(config || {}), headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  deleteById: (id: number, config?: RequestConfig) =>
    api.delete<{ message: string }>(`/news/${id}`, config),

  scanScheduled: (config?: RequestConfig) =>
    api.post<{ message: string }>(`/news/scan-scheduled`, {}, config),
};
