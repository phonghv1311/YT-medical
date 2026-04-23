import api from './axios';

export type RequestConfig = { signal?: AbortSignal };

export const adminApi = {
  getUsers: (params?: { page?: number; limit?: number }, config?: RequestConfig) =>
    api.get('/users', { params, ...config }),

  getUser: (id: number, config?: RequestConfig) => api.get(`/users/${id}`, config),

  createUser: (data: { email: string; password: string; firstName: string; lastName: string; roleId: number; phone?: string; hospitalId?: number; departmentId?: number; specializationIds?: number[] }) =>
    api.post('/users', data),

  updateUser: (id: number, data: { firstName?: string; lastName?: string; phone?: string; isActive?: boolean; roleId?: number }) =>
    api.put(`/users/${id}`, data),

  resetUserPassword: (id: number, newPassword: string) =>
    api.put(`/users/${id}/reset-password`, { newPassword }),

  deleteUser: (id: number) => api.delete(`/users/${id}`),

  deactivateUser: (id: number, data: { reason: string }) =>
    api.put(`/users/${id}/deactivate`, data),

  getHospitals: (config?: RequestConfig) => api.get('/hospitals', config),
  getHospital: (id: number, config?: RequestConfig) => api.get(`/hospitals/${id}`, config),
  createHospital: (data: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    description?: string;
    operatingDate?: string;
    operatingHours?: string;
    headId?: number;
    recordsUrl?: string;
    contractUrl?: string;
    backgroundImageUrl?: string;
    website?: string;
    departmentNames?: string[];
    doctorIds?: number[];
  }) => api.post('/hospitals', data),
  updateHospital: (id: number, data: Record<string, unknown>) => api.put(`/hospitals/${id}`, data),
  deleteHospital: (id: number, data: { reason: string }) =>
    api.delete(`/hospitals/${id}`, { data: data }),

  getStaff: (params?: { hospitalId?: number; page?: number; limit?: number }, config?: RequestConfig) =>
    api.get('/staff', { params, ...config }),
  getStaffMe: (config?: RequestConfig) => api.get('/staff/me', config),
  getStaffOne: (id: number, config?: RequestConfig) => api.get(`/staff/${id}`, config),
  uploadStaffFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string }>('/staff/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  createStaff: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    hospitalId?: number;
    departmentId?: number;
    jobTitle?: string;
    position?: string;
    startDate?: string;
    weeklyHours?: number;
    contractUrl?: string;
    profilePhotoUrl?: string;
    resumeUrl?: string;
  }) => api.post('/staff', data),
  updateStaff: (id: number, data: Record<string, unknown>) => api.put(`/staff/${id}`, data),
  deleteStaff: (id: number) => api.delete(`/staff/${id}`),

  getDepartments: (hospitalId?: number, config?: RequestConfig) =>
    api.get('/departments', { params: { hospitalId }, ...config }),
  getDepartment: (id: number) => api.get(`/departments/${id}`),
  createDepartment: (data: { name: string; hospitalId: number; description?: string; headId?: number }) =>
    api.post('/departments', data),
  updateDepartment: (id: number, data: Record<string, unknown>) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id: number) => api.delete(`/departments/${id}`),

  getPackages: (config?: RequestConfig) => api.get('/packages', config),

  getRoles: (config?: RequestConfig) => api.get('/roles', config),
  updateRolePermissions: (roleId: number, permissionIds: number[]) =>
    api.put(`/roles/${roleId}/permissions`, { permissionIds }),
  createRole: (data: { name: string; permissionIds: number[] }) => api.post('/roles', data),
  deleteRole: (id: number) => api.delete(`/roles/${id}`),

  getLogs: (params?: { page?: number; limit?: number; userId?: number; action?: string; resource?: string; resourceId?: number }, config?: RequestConfig) =>
    api.get('/logs', { params, ...config }),

  getPendingDoctors: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-doctors', config),
  getPendingTransfers: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-transfers', config),
  getPendingStaff: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-staff', config),
  getPendingHospitals: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-hospitals', config),
  getPendingProfiles: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-profiles', config),
  getPendingResignations: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-resignations', config),
  getPendingLeave: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-leave', config),
  getPendingSalaryAdvance: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-salary-advance', config),
  getPendingAppointments: (config?: RequestConfig) =>
    api.get<unknown>('/approvals/pending-appointments', config),
};
