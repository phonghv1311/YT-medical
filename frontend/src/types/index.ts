export interface CustomerProfile {
  id?: number;
  dateOfBirth?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  address?: string | null;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string | null;
  avatar?: string;
  role: string;
  customer?: CustomerProfile;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  doctorId: number | null;
  loading: boolean;
  error: string | null;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  description?: string;
  isActive: boolean;
  operatingDate?: string | null;
  operatingHours?: string | null;
  headId?: number | null;
  head?: User;
  recordsUrl?: string | null;
  contractUrl?: string | null;
  backgroundImageUrl?: string | null;
  website?: string | null;
  departments?: Department[];
  stats?: { departmentCount: number; doctorCount: number; staffCount: number; patientCount: number };
  doctors?: Doctor[];
}

export interface Department {
  id: number;
  name: string;
  hospitalId: number;
  description?: string;
  hospital?: Hospital;
}

export interface Doctor {
  id: number;
  userId: number;
  bio?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  averageRating: number;
  totalReviews: number;
  startDate?: string | null;
  expertise?: string | null;
  recordsUrl?: string | null;
  contractUrl?: string | null;
  backgroundImageUrl?: string | null;
  user?: User;
  specializations?: Specialization[];
  departments?: Department[];
}

export interface Staff {
  id: number;
  userId: number;
  hospitalId?: number | null;
  departmentId?: number | null;
  position?: string | null;
  jobTitle?: string | null;
  startDate?: string | null;
  weeklyHours?: number | null;
  contractUrl?: string | null;
  profilePhotoUrl?: string | null;
  resumeUrl?: string | null;
  user?: User;
  department?: Department;
  hospital?: Hospital;
}

export interface Specialization {
  id: number;
  name: string;
}

export interface Schedule {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AvailabilitySlot {
  id: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  startTime: string;
  endTime: string;
  type: 'video' | 'in_person';
  notes?: string;
  cancelReason?: string;
  patient?: User;
  doctor?: Doctor;
  createdAt: string;
}

export interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId?: number;
  title: string;
  description?: string;
  fileUrl?: string;
  recordDate: string;
}

export interface Prescription {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  medications: string;
  notes?: string;
  fileUrl?: string;
}

export interface Package {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  maxConsultations?: number;
  isActive: boolean;
}

export interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: 'consultation' | 'package' | 'tip' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export interface PaymentMethod {
  id: number;
  userId: number;
  type: string;
  provider: string;
  last4?: string;
  isDefault: boolean;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

export interface Review {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  rating: number;
  comment?: string;
  patient?: User;
  createdAt: string;
}

export interface FamilyMember {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  statusNotes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
