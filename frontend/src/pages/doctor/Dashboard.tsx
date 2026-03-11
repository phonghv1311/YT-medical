import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import { HEALTH_NEWS_ITEMS, type HealthNewsItem } from '../../data/healthNews';
import type { Appointment } from '../../types';
import { DashboardSkeleton } from '../../components/skeletons';

const NOTIFICATIONS_MOCK = [
  { id: 1, type: 'emergency', title: 'Emergency Alert', body: 'Patient Mark Robinson reported severe chest pain.', time: 'Just now', urgent: true },
  { id: 2, type: 'lab', title: 'New Test Results', body: 'Lab results available for Sarah Jenkins (Blood Panel).', time: '24 mins ago', urgent: false },
];

export default function DoctorDashboard() {
  const { t } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const [todayCount, setTodayCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [scheduleDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('doctorDashboard.greetingMorning');
    if (h < 17) return t('doctorDashboard.greetingAfternoon');
    return t('doctorDashboard.greetingEvening');
  })();

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    const cancelled = { current: false };
    setLoading(true);
    Promise.all([
      doctorsApi.me.getAppointments({ signal }),
      doctorsApi.me.getPatients({ signal }),
    ])
      .then(([apptsRes, patientsRes]) => {
        if (cancelled.current) return;
        const appointments: Appointment[] = apptsRes.data?.data ?? apptsRes.data ?? [];
        const patients = patientsRes.data?.data ?? patientsRes.data ?? [];
        const today = new Date().toISOString().split('T')[0];
        const todayList = appointments.filter((a) => a.scheduledAt?.startsWith(today));
        setTodayCount(todayList.length);
        setNewCount(3);
        setTotalCount(Array.isArray(patients) ? patients.length : 0);
        setTodayAppts(todayList);
      })
      .catch((err) => {
        if (!cancelled.current && err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') {
          setTodayCount(0);
          setTotalCount(0);
          setTodayAppts([]);
        }
      })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  async function handleConfirm(id: number) {
    await appointmentsApi.confirm(id);
    setTodayAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'confirmed' } as Appointment : a)));
  }

  if (loading) return <DashboardSkeleton />;

  const statCards = [
    { label: t('doctorDashboard.today'), value: todayCount, trend: '+2.4%', up: true, icon: 'calendar' },
    { label: t('doctorDashboard.newLabel'), value: newCount, trend: '-1.2%', up: false, icon: 'user' },
    { label: t('doctorDashboard.total'), value: totalCount, trend: '+5.1%', up: true, icon: 'file' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header — notification bell is in Layout; no duplicate here */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('doctorDashboard.welcomeBack')}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {greeting}, Dr. {user?.firstName ?? user?.lastName ?? 'Doctor'}
          </h1>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase">{card.label}</span>
              <span className={`text-xs font-medium ${card.up ? 'text-green-600' : 'text-red-600'}`}>{card.trend}</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* News list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{t('doctorDashboard.healthNews')}</h2>
          <Link to="/doctor/articles" className="text-sm font-medium text-blue-600 hover:underline">{t('common.viewAll')}</Link>
        </div>
        <div className="space-y-3">
          {HEALTH_NEWS_ITEMS.slice(0, 3).map((item: HealthNewsItem) => (
            <Link
              key={item.id}
              to={`/doctor/news/${item.id}`}
              className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-blue-100 transition-colors"
            >
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{item.date} · {item.read}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{t('doctorDashboard.recentNotifications')}</h2>
          <Link to="/notifications" className="text-sm font-medium text-blue-600 hover:underline">{t('common.viewAll')}</Link>
        </div>
        <div className="space-y-3">
          {NOTIFICATIONS_MOCK.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 ${n.urgent ? 'bg-red-50/80 border-red-100' : 'bg-white border-gray-100 shadow-sm'}`}
            >
              <div className="flex gap-3">
                <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${n.urgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                  {n.type === 'emergency' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                  <p className={`text-xs mt-1 ${n.urgent ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{n.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{t('doctorDashboard.todayAppointments')}</h2>
          <button type="button" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            {scheduleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </button>
        </div>
        {todayAppts.length === 0 ? (
          <p className="text-gray-500 py-6 text-center rounded-xl border border-gray-100 bg-gray-50">{t('doctorDashboard.noAppointmentsScheduled')}</p>
        ) : (
          <div className="relative space-y-0">
            {todayAppts.map((appt, idx) => {
              const patientName = appt.patient ? `${(appt.patient as { firstName?: string }).firstName} ${(appt.patient as { lastName?: string }).lastName}` : `Patient #${appt.patientId}`;
              const isNow = appt.status === 'confirmed' || appt.status === 'in_progress';
              const type = appt.type === 'video' ? 'video' : 'in_person';
              return (
                <div key={appt.id} className="flex gap-4 relative pb-6">
                  {idx < todayAppts.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />}
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-[1] ${type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {type === 'video' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{patientName}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {appt.type === 'video' ? t('doctorDashboard.virtualCheckup') : t('doctorDashboard.inPerson')} • {appt.notes || t('doctorDashboard.consultation')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {appt.startTime} – {appt.endTime}
                        </p>
                      </div>
                      {isNow && (
                        <Link
                          to={`/doctor/appointments/${appt.id}/call`}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                          {t('doctorDashboard.now')}
                        </Link>
                      )}
                      {appt.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleConfirm(appt.id)}
                          className="shrink-0 px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50"
                        >
                          {t('doctorDashboard.confirm')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
