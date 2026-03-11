import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppDispatch';
import { useLanguage } from '../contexts/LanguageContext';
import { getRole } from '../utils/auth';

type NavIconKey = 'home' | 'doctors' | 'consult' | 'records' | 'family' | 'articles' | 'profile' | 'pharmacy' | 'plans' | 'schedule' | 'messages' | 'facilities' | 'roles' | 'reports';
type NavItem = { path: string; labelKey: string; icon: NavIconKey; fab?: boolean };

const customerNavItems: NavItem[] = [
  { path: '/customer', labelKey: 'nav.home', icon: 'home' },
  { path: '/customer/doctors', labelKey: 'nav.doctors', icon: 'doctors' },
  { path: '/customer/family', labelKey: 'nav.family', icon: 'family' },
  { path: '/customer/records', labelKey: 'nav.records', icon: 'records' },
  { path: '/customer/pharmacy', labelKey: 'nav.pharmacy', icon: 'pharmacy' },
  { path: '/profile', labelKey: 'nav.profile', icon: 'profile' },
];

const doctorNavItems: NavItem[] = [
  { path: '/doctor', labelKey: 'nav.dashboard', icon: 'home' },
  { path: '/doctor/patients', labelKey: 'nav.patients', icon: 'doctors' },
  { path: '/doctor/prescriptions/new', labelKey: 'nav.newPrescription', icon: 'consult', fab: true },
  { path: '/doctor/schedule', labelKey: 'nav.schedule', icon: 'schedule' },
  { path: '/profile', labelKey: 'nav.settings', icon: 'profile' },
];

const superadminNavItems: NavItem[] = [
  { path: '/admin', labelKey: 'nav.dashboard', icon: 'home' },
  { path: '/admin/users', labelKey: 'nav.users', icon: 'doctors' },
  { path: '/admin/hospitals', labelKey: 'nav.hospitals', icon: 'facilities' },
  { path: '/admin/news', labelKey: 'nav.news', icon: 'articles' },
  { path: '/admin/reports', labelKey: 'nav.reports', icon: 'reports' },
  { path: '/profile', labelKey: 'nav.settings', icon: 'profile' },
];

const adminNavItems: NavItem[] = [
  { path: '/admin', labelKey: 'nav.dashboard', icon: 'home' },
  { path: '/admin/users', labelKey: 'nav.users', icon: 'doctors' },
  { path: '/admin/hospitals', labelKey: 'nav.hospitals', icon: 'facilities' },
  { path: '/admin/news', labelKey: 'nav.news', icon: 'articles' },
  { path: '/admin/reports', labelKey: 'nav.reports', icon: 'reports' },
  { path: '/profile', labelKey: 'nav.settings', icon: 'profile' },
];

const staffNavItems: NavItem[] = [
  { path: '/admin', labelKey: 'nav.dashboard', icon: 'home' },
  { path: '/admin/users', labelKey: 'nav.users', icon: 'doctors' },
  { path: '/admin/reports', labelKey: 'nav.reports', icon: 'reports' },
  { path: '/profile', labelKey: 'nav.settings', icon: 'profile' },
];

const icons: Record<string, React.ReactNode> = {
  home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  consult: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  records: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  family: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  profile: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  doctors: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  articles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  pharmacy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  plans: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  schedule: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  messages: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  facilities: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  roles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  reports: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAppSelector((s) => s.auth);
  const { t } = useLanguage();
  const role = getRole(user);
  const items =
    role === 'customer' ? customerNavItems
      : role === 'doctor' ? doctorNavItems
        : role === 'superadmin' ? superadminNavItems
          : role === 'admin' ? adminNavItems
            : role === 'staff' ? staffNavItems
              : [];

  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb" aria-label="Main">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const active = location.pathname === item.path;
          if (item.fab) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-2 -mt-6"
                aria-label={t(item.labelKey as 'nav.home')}
              >
                <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:scale-95 transition">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </div>
              </Link>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 min-w-0 py-2 gap-0.5 ${active ? 'text-blue-600' : 'text-gray-500'}`}
              aria-current={active ? 'page' : undefined}
            >
              {icons[item.icon] || icons.home}
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide truncate w-full text-center">{t(item.labelKey as 'nav.home')}</span>
              {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-600 rounded-t" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
