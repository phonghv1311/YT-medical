import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppDispatch';
import { getRole } from './utils/auth';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SessionExpiryChecker from './components/SessionExpiryChecker';

import Landing from './pages/public/Landing';
import DoctorsList from './pages/public/DoctorsList';
import DoctorProfile from './pages/public/DoctorProfile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegisterCustomer from './pages/auth/RegisterCustomer';
import RegisterCustomerSuccess from './pages/auth/RegisterCustomerSuccess';
import RegisterDoctorCreate from './pages/auth/RegisterDoctorCreate';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ResetPassword from './pages/auth/ResetPassword';

import CustomerDashboard from './pages/customer/Dashboard';
import CustomerAppointments from './pages/customer/Appointments';
import CustomerRecords from './pages/customer/MedicalRecords';
import CustomerPackages from './pages/customer/Packages';
import PaymentMethods from './pages/customer/PaymentMethods';
import CustomerDocuments from './pages/customer/CustomerDocuments';
import CustomerFamily from './pages/customer/Family';
import CustomerConsult from './pages/customer/Consult';
import CustomerPaymentDetails from './pages/customer/PaymentDetails';
import CustomerPharmacy from './pages/customer/Pharmacy';
import PharmacyCart from './pages/customer/PharmacyCart';
import ConfirmBooking from './pages/customer/ConfirmBooking';
import PackageDetails from './pages/customer/PackageDetails';
import FamilyMemberRecords from './pages/customer/FamilyMemberRecords';
import ProductDetail from './pages/customer/ProductDetail';
import AppointmentDetail from './pages/customer/AppointmentDetail';
import ConsultationCall from './pages/customer/ConsultationCall';
import RecordDetail from './pages/customer/RecordDetail';
import SearchResults from './pages/customer/SearchResults';
import CustomerMessages from './pages/customer/Messages';
import HealthNewsArticle from './pages/customer/HealthNewsArticle';
import AvailableDoctors from './pages/customer/AvailableDoctors';
import HealthArticles from './pages/customer/HealthArticles';
import HospitalList from './pages/customer/HospitalList';
import HospitalDetail from './pages/customer/HospitalDetail';
import HospitalDepartmentsList from './pages/customer/HospitalDepartmentsList';
import HospitalDoctorsList from './pages/customer/HospitalDoctorsList';
import DepartmentDetail from './pages/customer/DepartmentDetail';

import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorSchedule from './pages/doctor/Schedule';
import DoctorPatients from './pages/doctor/Patients';
import DoctorPatientProfile from './pages/doctor/PatientProfile';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorConsultationCall from './pages/doctor/ConsultationCall';
import DoctorMessages from './pages/doctor/Messages';
import DoctorNewPrescription from './pages/doctor/NewPrescription';
import DoctorRuleManagement from './pages/doctor/RuleManagement';
import DoctorRuleDetails from './pages/doctor/RuleDetails';
import DoctorDefineRule from './pages/doctor/DefineRule';
import DoctorEarnings from './pages/doctor/Earnings';
import DoctorUploadCertificates from './pages/doctor/UploadCertificates';
import DoctorOnboardingStep1 from './pages/doctor/onboarding/DoctorOnboardingStep1';
import DoctorOnboardingStep2 from './pages/doctor/onboarding/DoctorOnboardingStep2';
import DoctorPendingApproval from './pages/doctor/onboarding/DoctorPendingApproval';

import AdminDashboard from './pages/admin/Dashboard';
import AdminHospitals from './pages/admin/Hospitals';
import AdminHospitalDetail from './pages/admin/HospitalDetail';
import AdminUsersV2 from './pages/admin/AdminUsers_v2';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminEmployeeDetail from './pages/admin/EmployeeDetail';
import AdminPackages from './pages/admin/Packages';
import AdminRoles from './pages/admin/Roles';
import AdminLogs from './pages/admin/Logs';
import AdminReports from './pages/admin/Reports';
import AdminNewsV2 from './pages/admin/AdminNews_v2';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminApprovals from './pages/admin/AdminApprovals';

import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Notifications from './pages/Notifications';

function RoleRedirect() {
  const { user } = useAppSelector((s) => s.auth);
  const role = getRole(user);
  if (!user) return <Navigate to="/" replace />;
  switch (role) {
    case 'doctor': return <Navigate to="/doctor" />;
    case 'admin': case 'superadmin': case 'staff': return <Navigate to="/admin" />;
    default: return <Navigate to="/customer" />;
  }
}

export default function App() {
  return (
    <>
      <SessionExpiryChecker />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/doctors" element={<DoctorsList />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/customer" element={<RegisterCustomer />} />
        <Route path="/register/customer/success" element={<RegisterCustomerSuccess />} />
        <Route path="/register/doctor/create" element={<RegisterDoctorCreate />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password/reset" element={<ResetPassword />} />

        {/* Authenticated layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<RoleRedirect />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/change-password" element={<ChangePassword />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Customer */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/customer" element={<CustomerDashboard />} />
              <Route path="/customer/doctors" element={<AvailableDoctors />} />
              <Route path="/customer/search" element={<SearchResults />} />
              <Route path="/customer/consult" element={<CustomerConsult />} />
              <Route path="/customer/booking/:doctorId" element={<ConfirmBooking />} />
              <Route path="/customer/appointments" element={<CustomerAppointments />} />
              <Route path="/customer/appointments/:id" element={<AppointmentDetail />} />
              <Route path="/customer/messages" element={<CustomerMessages />} />
              <Route path="/customer/appointments/:id/call" element={<ConsultationCall />} />
              <Route path="/customer/records" element={<CustomerRecords />} />
              <Route path="/customer/records/:id" element={<RecordDetail />} />
              <Route path="/customer/family" element={<CustomerFamily />} />
              <Route path="/customer/family/:id" element={<FamilyMemberRecords />} />
              <Route path="/customer/packages" element={<CustomerPackages />} />
              <Route path="/customer/packages/:id" element={<PackageDetails />} />
              <Route path="/customer/payment-details" element={<CustomerPaymentDetails />} />
              <Route path="/customer/payment-methods" element={<PaymentMethods />} />
              <Route path="/customer/documents" element={<CustomerDocuments />} />
              <Route path="/customer/pharmacy" element={<CustomerPharmacy />} />
              <Route path="/customer/pharmacy/:id" element={<ProductDetail />} />
              <Route path="/customer/pharmacy/cart" element={<PharmacyCart />} />
              <Route path="/customer/articles" element={<HealthArticles />} />
              <Route path="/customer/news/:id" element={<HealthNewsArticle />} />
              <Route path="/customer/hospitals" element={<HospitalList />} />
              <Route path="/customer/hospitals/:id" element={<HospitalDetail />} />
              <Route path="/customer/hospitals/:id/departments" element={<HospitalDepartmentsList />} />
              <Route path="/customer/hospitals/:id/doctors" element={<HospitalDoctorsList />} />
              <Route path="/customer/departments/:id" element={<DepartmentDetail />} />
            </Route>

            {/* Doctor */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/register/doctor" element={<DoctorOnboardingStep1 />} />
              <Route path="/register/doctor/step-2" element={<DoctorOnboardingStep2 />} />
              <Route path="/register/doctor/pending" element={<DoctorPendingApproval />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor/schedule" element={<DoctorSchedule />} />
              <Route path="/doctor/patients" element={<DoctorPatients />} />
              <Route path="/doctor/patients/:id" element={<DoctorPatientProfile />} />
              <Route path="/doctor/patients/:patientId/prescription/new" element={<DoctorNewPrescription />} />
              <Route path="/doctor/prescriptions/new" element={<Navigate to="/doctor/patients" replace />} />
              <Route path="/doctor/appointments" element={<DoctorAppointments />} />
              <Route path="/doctor/appointments/:id/call" element={<DoctorConsultationCall />} />
              <Route path="/doctor/messages" element={<DoctorMessages />} />
              <Route path="/doctor/settings" element={<Navigate to="/profile" replace />} />
              <Route path="/doctor/rules" element={<DoctorRuleManagement />} />
              <Route path="/doctor/rules/new" element={<DoctorDefineRule />} />
              <Route path="/doctor/rules/:id" element={<DoctorRuleDetails />} />
              <Route path="/doctor/rules/:id/edit" element={<DoctorDefineRule />} />
              <Route path="/doctor/earnings" element={<DoctorEarnings />} />
              <Route path="/doctor/certificates" element={<DoctorUploadCertificates />} />
              <Route path="/doctor/payment-methods" element={<PaymentMethods />} />
              <Route path="/doctor/articles" element={<HealthArticles />} />
              <Route path="/doctor/news/:id" element={<HealthNewsArticle />} />
            </Route>

            {/* Admin / Staff / Superadmin */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'staff']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/hospitals" element={<AdminHospitals />} />
              <Route path="/admin/hospitals/:id" element={<AdminHospitalDetail />} />
              <Route path="/admin/employees" element={<Navigate to="/admin/users?status=active" replace />} />
              <Route path="/admin/employees/:id" element={<AdminEmployeeDetail />} />
              <Route path="/admin/users" element={<AdminUsersV2 />} />
              <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              <Route path="/admin/packages" element={<AdminPackages />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/news" element={<AdminNewsV2 />} />
              <Route path="/admin/schedule" element={<AdminSchedule />} />
              <Route path="/admin/approvals" element={<AdminApprovals />} />
            </Route>

            {/* Roles management */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
              <Route path="/admin/roles" element={<AdminRoles />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
