import { Outlet, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { logout, fetchDoctorId } from '../store/authSlice';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getRole } from '../utils/auth';
import BottomNav from './BottomNav';
import CustomerLayout from './CustomerLayout';
import AppHeader from './AppHeader';
import FeedbackModal from './FeedbackModal';

export default function Layout() {
  const { user, doctorId } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [doctorMenuOpen, setDoctorMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const customerMenuRef = useRef<HTMLDivElement>(null);
  const doctorMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const role = getRole(user);
  const isDoctor = role === 'doctor';
  const isCustomer = role === 'customer';
  const isAdminRole = role === 'admin' || role === 'superadmin' || role === 'staff';
  const adminHotline = import.meta.env.VITE_ADMIN_HOTLINE || '+1-800-123-4567';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/', { state: { message: t('messages.signedOut') } });
    setCustomerMenuOpen(false);
    setDoctorMenuOpen(false);
    setAdminMenuOpen(false);
  };

  useEffect(() => {
    if (isDoctor && user && doctorId == null) {
      dispatch(fetchDoctorId());
    }
  }, [isDoctor, user, doctorId, dispatch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customerMenuRef.current && !customerMenuRef.current.contains(e.target as Node)) setCustomerMenuOpen(false);
      if (doctorMenuRef.current && !doctorMenuRef.current.contains(e.target as Node)) setDoctorMenuOpen(false);
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) setAdminMenuOpen(false);
    }
    if (customerMenuOpen || doctorMenuOpen || adminMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [customerMenuOpen, doctorMenuOpen, adminMenuOpen]);

  if (isCustomer) {
    return (
      <CustomerLayout>
        <div className="flex flex-col min-h-screen min-h-[100dvh] bg-gray-50">
          <AppHeader
            variant="customer"
            user={user}
            homeHref="/customer"
            menuRef={customerMenuRef}
            menuOpen={customerMenuOpen}
            setMenuOpen={setCustomerMenuOpen}
            onLogout={handleLogout}
            onCloseMenu={() => setCustomerMenuOpen(false)}
          />
          <main className="flex-1 min-h-0 max-w-lg mx-auto w-full px-4 pb-20">
            <Outlet />
          </main>
          <BottomNav />
        </div>
        {/* FABs: minimized (icon only), expand on hover to show labels */}
        <div className="fixed bottom-20 right-4 max-w-lg mx-auto w-full flex justify-end pointer-events-none z-30">
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white border-2 border-blue-500 text-blue-600 shadow-lg hover:bg-blue-50 transition-all duration-200 overflow-hidden w-12 h-12 hover:w-[8.5rem] focus-within:w-[8.5rem] pl-3 pr-4"
              aria-label={t('feedback.feedbackLabel')}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">{t('feedback.feedbackLabel')}</span>
            </button>
            <a
              href={`tel:${adminHotline.replace(/\s/g, '')}`}
              className="flex items-center gap-2 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all duration-200 overflow-hidden w-12 h-12 hover:w-[8.5rem] focus-within:w-[8.5rem] pl-3 pr-4"
              aria-label={t('feedback.emergencyLabel')}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600/80">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">{t('feedback.emergencyLabel')}</span>
            </a>
          </div>
        </div>
        <FeedbackModal open={feedbackOpen} onClose={() => { setFeedbackOpen(false); }} />
      </CustomerLayout>
    );
  }

  if (isDoctor) {
    return (
      <div className="flex flex-col min-h-screen min-h-[100dvh] bg-gray-50">
        <AppHeader
          variant="doctor"
          user={user}
          homeHref="/doctor"
          menuRef={doctorMenuRef}
          menuOpen={doctorMenuOpen}
          setMenuOpen={setDoctorMenuOpen}
          onLogout={handleLogout}
          onCloseMenu={() => setDoctorMenuOpen(false)}
        />
        <main className="flex-1 min-h-0 max-w-lg mx-auto w-full px-4 pb-20">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Admin, superadmin, staff: same shell as doctor — AppHeader + main + BottomNav
  if (isAdminRole) {
    return (
      <div className="flex flex-col min-h-screen min-h-[100dvh] bg-gray-50">
        <AppHeader
          variant="admin"
          user={user}
          homeHref="/admin"
          menuRef={adminMenuRef}
          menuOpen={adminMenuOpen}
          setMenuOpen={setAdminMenuOpen}
          onLogout={handleLogout}
          onCloseMenu={() => setAdminMenuOpen(false)}
        />
        <main className="flex-1 min-h-0 max-w-lg mx-auto w-full px-4 pb-20">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    );
  }

  return null;
}
