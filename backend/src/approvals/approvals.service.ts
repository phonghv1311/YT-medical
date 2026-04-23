import { Injectable } from '@nestjs/common';

export type ApprovalType =
  | 'doctor_new'
  | 'transfer'
  | 'staff_new'
  | 'hospital_new'
  | 'profile_submission'
  | 'resignation'
  | 'leave'
  | 'salary_advance';

export interface PendingItem {
  id: string;
  type: ApprovalType;
  title?: string;
  submittedAt?: string;
  [key: string]: unknown;
}

@Injectable()
export class ApprovalsService {
  async getPendingDoctors(): Promise<PendingItem[]> {
    return [];
  }

  async getPendingTransfers(): Promise<PendingItem[]> {
    return [];
  }

  async getPendingStaff(): Promise<PendingItem[]> {
    return [];
  }

  async getPendingHospitals(): Promise<PendingItem[]> {
    return [];
  }

  async getPendingProfiles(): Promise<PendingItem[]> {
    return [];
  }

  async getPendingResignations(): Promise<PendingItem[]> {
    return [];
  }

  async getPendingLeave(): Promise<PendingItem[]> {
    return [];
  }

  async getPendingSalaryAdvance(): Promise<PendingItem[]> {
    return [];
  }

  async getPendingAppointments(): Promise<PendingItem[]> {
    return [];
  }
}
