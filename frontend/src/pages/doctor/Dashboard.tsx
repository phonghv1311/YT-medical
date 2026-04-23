import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import type { Appointment } from '../../types';
import { DashboardSkeleton } from '../../components/skeletons';

export default function DoctorDashboard() {
  const { t } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<Array<{ id: number; name: string; lastVisit: string }>>([]);
  const [loading, setLoading] = useState(true);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('doctorDashboard.greetingMorning');
    if (h < 17) return t('doctorDashboard.greetingAfternoon');
    return t('doctorDashboard.greetingEvening');
  })();

  const doctorName = `BS. ${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'BS. Doctor';

  const fetchDashboardData = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    Promise.all([
      doctorsApi.me.getAppointments({ signal }),
      doctorsApi.me.getPatients({ signal }),
    ])
      .then(([apptsRes, patientsRes]) => {
        const appointments: Appointment[] = apptsRes.data?.data ?? apptsRes.data ?? [];
        const today = new Date().toISOString().split('T')[0];
        const todayList = appointments.filter((a) => a.scheduledAt?.startsWith(today));
        setTodayAppts(todayList);
        const patients = patientsRes.data?.data ?? patientsRes.data ?? [];
        const list = Array.isArray(patients) ? patients : [];
        setRecentPatients(
          list.slice(0, 4).map((p: { id: number; firstName?: string; lastName?: string }) => ({
            id: p.id,
            name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `Patient #${p.id}`,
            lastVisit: 'HÔM QUA, 15:45',
          })),
        );
      })
      .catch(() => {
        setTodayAppts([]);
        setRecentPatients([]);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchDashboardData(ctrl.signal);
    return () => {
      ctrl.abort();
    };
  }, [fetchDashboardData]);

  async function handleConfirm(id: number) {
    await appointmentsApi.confirm(id);
    setTodayAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'confirmed' } as Appointment : a)));
  }

  if (loading) return <DashboardSkeleton />;

  const waitingCount = todayAppts.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;
  const waitingList = todayAppts.slice(0, 2).map((a, i) => {
    const patientName = a.patient
      ? `${(a.patient as { firstName?: string }).firstName ?? ''} ${(a.patient as { lastName?: string }).lastName ?? ''}`.trim()
      : `Patient #${a.patientId}`;
    return { name: patientName, number: 12 + i };
  });
  if (waitingList.length === 0 && waitingCount > 0) {
    waitingList.push({ name: 'Bệnh nhân đang chờ', number: 12 });
  }

  return (
    <div className="max-w-lg mx-auto pb-24 space-y-5">
      {/* Header: avatar + greeting + doctor name, notification */}
      <div className="flex items-center justify-between gap-3 px-4 pt-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500">{greeting},</p>
            <h1 className="text-xl font-bold text-gray-900 truncate">{doctorName}</h1>
          </div>
        </div>
        <Link to="/notifications" className="relative p-2 rounded-full hover:bg-gray-100 shrink-0" aria-label={t('common.notifications')}>
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </Link>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-3 gap-3 px-4">
        <Link
          to="/doctor/patients"
          className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2 hover:border-blue-100 transition"
        >
          <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <span className="text-sm font-medium text-gray-900">{t('doctorDashboard.quickActionPatients')}</span>
        </Link>
        <Link
          to="/doctor/appointments"
          className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2 hover:border-blue-100 transition"
        >
          <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <span className="text-sm font-medium text-gray-900">{t('doctorDashboard.quickActionAppointments')}</span>
        </Link>
        <Link
          to="/doctor/messages"
          className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm flex flex-col items-center gap-2 hover:border-blue-100 transition"
        >
          <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
          <span className="text-sm font-medium text-gray-900">{t('doctorDashboard.quickActionChat')}</span>
        </Link>
      </div>

      {/* Patients currently waiting - blue card */}
      <div className="mx-4 rounded-2xl bg-blue-600 text-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('doctorDashboard.patientsWaiting')}
          </span>
          <span className="text-sm font-medium">{t('doctorDashboard.patientsWaitingCount', { count: String(waitingCount || 4) })}</span>
        </div>
        <ul className="space-y-2">
          {waitingList.map((item, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-sm">{i + 1} {item.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">SỐ {item.number}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Today's schedule */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">{t('doctorDashboard.todaySchedule')}</h2>
          <Link to="/doctor/appointments" className="text-sm font-medium text-blue-600 hover:underline">
            {t('common.viewAll')}
          </Link>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {todayAppts.length === 0 ? (
            <p className="text-gray-500 py-6 text-center text-sm">{t('doctorDashboard.noAppointmentsScheduled')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {todayAppts.slice(0, 3).map((appt) => {
                const patientName = appt.patient
                  ? `${(appt.patient as { firstName?: string }).firstName ?? ''} ${(appt.patient as { lastName?: string }).lastName ?? ''}`.trim()
                  : `Patient #${appt.patientId}`;
                const typeLabel = appt.notes || t('doctorDashboard.consultation');
                return (
                  <li key={appt.id}>
                    <Link
                      to={`/doctor/appointments/${appt.id}/call`}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <span className="text-sm font-medium text-blue-600 shrink-0">
                        {appt.startTime ?? '08:30'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{patientName}</p>
                        <p className="text-sm text-gray-500 truncate">{typeLabel}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent patients */}
      <div className="px-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">{t('doctorDashboard.recentPatients')}</h2>
        <ul className="space-y-3">
          {recentPatients.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
                {p.name.split(' ').pop()?.[0] ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-500 uppercase">{p.lastVisit}</p>
              </div>
              <Link to={`/doctor/patients/${p.id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label={t('common.menu')}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
