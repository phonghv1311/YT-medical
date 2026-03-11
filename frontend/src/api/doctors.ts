import api from './axios';

export type RequestConfig = { signal?: AbortSignal };

export type DoctorCertificateType = 'medical_degree' | 'board_certification' | 'identity_proof' | 'medical_license';
export type DoctorCertificateStatus = 'pending' | 'uploaded' | 'verifying' | 'verified' | 'rejected';

export interface DoctorCertificateItem {
  id: number;
  doctorId: number;
  type: DoctorCertificateType;
  fileUrl: string | null;
  status: DoctorCertificateStatus;
  submittedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Use these for current-doctor endpoints (JWT identifies the doctor). Avoids 404 from using user id. */
const me = {
  getSchedule: (config?: RequestConfig) => api.get('/doctors/me/schedule', config),
  getAvailability: (date?: string, config?: RequestConfig) =>
    api.get('/doctors/me/availability', { params: { date }, ...config }),
  createAvailability: (data: { date: string; startTime: string; endTime: string }) =>
    api.post('/doctors/me/availability', data),
  deleteAvailability: (slotId: number) => api.delete(`/doctors/me/availability/${slotId}`),
  getPatients: (config?: RequestConfig) => api.get('/doctors/me/patients', config),
  getAppointments: (config?: RequestConfig) => api.get('/doctors/me/appointments', config),
  getEarnings: (params?: { dateFrom?: string; dateTo?: string }, config?: RequestConfig) =>
    api.get('/doctors/me/earnings', { params, ...config }),
  getCertificates: (config?: RequestConfig) =>
    api.get<{ certificates: DoctorCertificateItem[] }>('/doctors/me/certificates', config),
  uploadCertificate: (file: File, type: DoctorCertificateType, onUploadProgress?: (p: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    return api.post<DoctorCertificateItem>('/doctors/me/certificates/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onUploadProgress
        ? (e) => { if (e.total && e.total > 0) onUploadProgress(Math.round((e.loaded / e.total) * 100)); }
        : undefined,
    });
  },
  deleteCertificate: (id: number) => api.delete(`/doctors/me/certificates/${id}`),
  submitCertificatesForVerification: () => api.post('/doctors/me/certificates/submit'),
};

export const doctorsApi = {
  getAll: (params?: { specialty?: string; hospitalId?: number; minRating?: number; page?: number; limit?: number }, config?: RequestConfig) =>
    api.get('/doctors', { params, ...config }),

  getMe: (config?: RequestConfig) => api.get<{ id: number;[k: string]: unknown }>('/doctors/me', config),

  getById: (id: number, config?: RequestConfig) => api.get(`/doctors/${id}`, config),

  getByUserId: (userId: number, config?: RequestConfig) => api.get(`/doctors/by-user/${userId}`, config),

  getSchedule: (id: number, config?: RequestConfig) => api.get(`/doctors/${id}/schedule`, config),

  getAvailability: (id: number, date?: string, config?: RequestConfig) =>
    api.get(`/doctors/${id}/availability`, { params: { date }, ...config }),

  createSchedule: (id: number, data: { dayOfWeek: number; startTime: string; endTime: string }) =>
    api.post(`/doctors/${id}/schedule`, data),

  createAvailability: (id: number, data: { date: string; startTime: string; endTime: string }) =>
    api.post(`/doctors/${id}/availability`, data),

  deleteAvailability: (id: number, slotId: number) =>
    api.delete(`/doctors/${id}/availability/${slotId}`),

  getPatients: (id: number, config?: RequestConfig) => api.get(`/doctors/${id}/patients`, config),

  getAppointments: (id: number, config?: RequestConfig) => api.get(`/doctors/${id}/appointments`, config),

  getReviews: (id: number, params?: { page?: number; limit?: number }, config?: RequestConfig) =>
    api.get(`/doctors/${id}/reviews`, { params, ...config }),

  getEarnings: (id: number, params?: { dateFrom?: string; dateTo?: string }, config?: RequestConfig) =>
    api.get(`/doctors/${id}/earnings`, { params, ...config }),

  /** Current doctor (from JWT). Use in doctor UI to avoid 404. */
  me,

  /** Onboarding: list specializations for dropdowns */
  getSpecializations: (config?: RequestConfig) =>
    api.get<{ id: number; name: string }[]>('/doctors/meta/specializations', config),

  /** Onboarding: list hospitals (for affiliation search) */
  getHospitals: (config?: RequestConfig) =>
    api.get<{ id: number; name: string;[k: string]: unknown }[]>('/hospitals', config),

  /** Onboarding: list departments, optionally by hospital */
  getDepartments: (hospitalId?: number, config?: RequestConfig) =>
    api.get<{ id: number; name: string; hospitalId: number;[k: string]: unknown }[]>('/departments', { params: { hospitalId }, ...config }),

  /** Onboarding: save step 1 or step 2 data (partial payload). */
  updateOnboarding: (data: {
    firstName?: string;
    lastName?: string;
    licenseNumber?: string;
    primaryDepartmentId?: number | null;
    specializationIds?: number[];
    yearsOfExperience?: number;
    bio?: string;
    qualifications?: { qualification: string; institution?: string; year?: number }[];
  }) => api.patch('/doctors/me/onboarding', data),
};
