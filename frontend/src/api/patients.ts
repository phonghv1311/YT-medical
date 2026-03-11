import api from './axios';

export const patientsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/patients', { params }),

  getRecords: (patientId: number) =>
    api.get(`/patients/${patientId}/records`),

  getStatus: (patientId: number) =>
    api.get(`/patients/${patientId}/status`),

  getFamilyMembers: (patientId: number) =>
    api.get(`/patients/${patientId}/family-members`),

  addFamilyMember: (patientId: number, data: { firstName: string; lastName: string; relationship: string; dateOfBirth?: string; gender?: string; bloodType?: string; statusNotes?: string }) =>
    api.post(`/patients/${patientId}/family-members`, data),

  getFamilyMembersMe: () =>
    api.get('/patients/me/family-members'),

  addFamilyMemberMe: (data: { firstName: string; lastName: string; relationship: string; dateOfBirth?: string; gender?: string; bloodType?: string; statusNotes?: string }) =>
    api.post('/patients/me/family-members', data),

  getMedicalRecords: (patientId: number) =>
    api.get(`/medical-records/patient/${patientId}`),

  getPrescriptions: (patientId: number) =>
    api.get(`/medical-records/prescriptions/${patientId}`),
};
