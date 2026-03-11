import api from './axios';

export const medicalRecordsApi = {
  createPrescription: (data: { appointmentId?: number; patientId: number; medications: string; notes?: string }) =>
    api.post('/medical-records/prescriptions', data),

  getRecordDownloadUrl: (id: number) =>
    api.get<{ url: string }>(`/medical-records/${id}/download`),
};
