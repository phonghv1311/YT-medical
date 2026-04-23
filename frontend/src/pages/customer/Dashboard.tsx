import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import { appointmentsApi } from '../../api/appointments';
import type { Appointment } from '../../types';
import { DashboardSkeleton } from '../../components/skeletons';

function formatApptDate(scheduledAt?: string): string {
  if (!scheduledAt) return '—';
  const d = new Date(scheduledAt);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function CustomerDashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const routeState = location.state as { message?: string; isError?: boolean } | null;
  const message = routeState?.message;
  const isError = routeState?.isError;

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    appointmentsApi.getAll({ limit: 20 }, { signal: ctrl.signal })
      .then((r) => {
        if (cancelled.current) return;
        setAppointments((r.data?.data?.appointments ?? r.data?.appointments ?? r.data) || []);
      })
      .catch(() => { if (!cancelled.current) setAppointments([]); })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  const displayName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '';
  const upcoming = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status));
  const nextAppt = upcoming[0];
  const recentConsultations = appointments.filter((a) => a.status === 'completed').slice(0, 4);

  const doctorName = (apt: Appointment) => {
    const d = apt.doctor;
    if (!d?.user) return 'BS.';
    return `BS. ${d.user.firstName ?? ''} ${d.user.lastName ?? ''}`.trim() || 'BS.';
  };
  const specialty = (apt: Appointment) =>
    apt.doctor?.specializations?.[0]?.name ?? apt.doctor?.expertise ?? 'Nội tổng quát';
  const locationName = (apt: Appointment) =>
    (apt as { location?: string }).location ?? 'Bệnh viện Đa khoa Tâm Anh';

  const clearMessage = () => navigate(location.pathname, { replace: true, state: {} });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-lg mx-auto pb-24 px-4 pt-2 space-y-5">
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3 ${isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}
        >
          <span>{message}</span>
          <button type="button" onClick={clearMessage} className="p-1 rounded hover:opacity-70" aria-label={t('common.dismiss')}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{t('customer.welcomeBack')} {displayName}</h1>
            <p className="text-sm text-gray-500">{t('customer.wishHealthyDay')}</p>
          </div>
        </div>
        <Link to="/notifications" className="relative p-2 rounded-full hover:bg-gray-100 shrink-0" aria-label={t('common.notifications')}>
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">{t('customer.upcomingAppointments')}</h2>
        <Link to="/customer/appointments" className="text-sm font-medium text-blue-600 hover:underline">{t('common.viewAll')}</Link>
      </div>

      {nextAppt ? (
        <Link
          to={`/customer/appointments/${nextAppt.id}`}
          className="block rounded-2xl bg-blue-600 text-white p-4 shadow-lg hover:bg-blue-700 transition"
        >
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
              {nextAppt.doctor?.user?.firstName?.[0]}{nextAppt.doctor?.user?.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-lg">{doctorName(nextAppt)}</p>
              <p className="text-sm text-white/90">{specialty(nextAppt)}</p>
              <p className="text-sm mt-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {formatApptDate(nextAppt.scheduledAt)} · <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {nextAppt.startTime}
              </p>
              <p className="text-sm flex items-center gap-1.5 mt-0.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {locationName(nextAppt)}
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-gray-500">{t('customer.noAppointments')}</p>
          <Link to="/customer/doctors" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">{t('customer.bookNow')}</Link>
        </div>
      )}

      <h2 className="text-base font-bold text-gray-900">{t('customer.shortcuts')}</h2>
      <div className="grid grid-cols-3 gap-3">
        <Link
          to="/customer/doctors"
          className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2 hover:border-blue-100 transition"
        >
          <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </span>
          <span className="text-sm font-medium text-gray-900 text-center">{t('customer.bookAppointment')}</span>
        </Link>
        <Link
          to="/customer/messages"
          className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2 hover:border-blue-100 transition"
        >
          <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </span>
          <span className="text-sm font-medium text-gray-900 text-center">{t('customer.chat')}</span>
        </Link>
        <Link
          to="/customer/appointments"
          className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2 hover:border-blue-100 transition"
        >
          <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </span>
          <span className="text-sm font-medium text-gray-900 text-center">{t('customer.videoCall')}</span>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">{t('customer.recentConsultations')}</h2>
        <Link to="/customer/records" className="text-sm font-medium text-blue-600 hover:underline">{t('customer.history')}</Link>
      </div>

      {recentConsultations.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">{t('customer.noAppointments')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recentConsultations.map((apt) => (
            <li key={apt.id}>
              <Link
                to={`/customer/appointments/${apt.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm hover:border-blue-100 transition"
              >
                <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{doctorName(apt)}</p>
                  <p className="text-sm text-gray-500 truncate">{specialty(apt)} · {formatApptDate(apt.scheduledAt)}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
