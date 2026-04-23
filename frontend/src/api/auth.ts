import type { AxiosResponse } from 'axios';
import api from './axios';
import type { User } from '../types';

export type ProfileResponse = { data?: User };

let profilePromise: Promise<AxiosResponse<ProfileResponse>> | null = null;

function getProfileDeduped(): Promise<AxiosResponse<ProfileResponse>> {
  if (!profilePromise) {
    profilePromise = api.get<ProfileResponse>('/profile').finally(() => {
      profilePromise = null;
    });
  }
  return profilePromise;
}

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: string; packageId?: number }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh-token', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  getProfile: getProfileDeduped,

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; address?: string }) =>
    api.put('/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/profile/change-password', data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<{ data?: { avatar: string }; avatar?: string }>('/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
