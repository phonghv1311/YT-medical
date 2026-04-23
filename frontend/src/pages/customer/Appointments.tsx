import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi } from '../../api';
import type { Appointment } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { ListRowSkeleton } from '../../components/skeletons';

const TABS = ['upcoming', 'completed', 'cancelled'] as const;
type Tab = (typeof TABS)[number];

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'customerAppointments.statusPending', className: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'customerAppointments.statusUpcoming', className: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'customerAppointments.statusUpcoming', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'customerAppointments.statusCompleted', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'customerAppointments.statusCancelled', className: 'bg-red-100 text-red-800' },
};

function formatApptDateTime(scheduledAt?: string, startTime?: string): string {
  if (!scheduledAt) return '—';
  const d = new Date(scheduledAt);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${startTime ?? ''}, ${day}/${month}/${year}`;
}

export default function CustomerAppointments() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    setLoading(true);
    appointmentsApi.getAll({ limit: 50 }, { signal: ctrl.signal })
      .then(({ data }) => {
        if (cancelled.current) return;
        const list = (data?.data?.appointments ?? data?.appointments ?? data) || [];
        setAppointments(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled.current) setAppointments([]); })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  const filtered = appointments.filter((a) => {
    if (activeTab === 'upcoming') return ['pending', 'confirmed', 'in_progress'].includes(a.status);
    if (activeTab === 'completed') return a.status === 'completed';
    return a.status === 'cancelled';
  });

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await appointmentsApi.cancel(cancelTarget.id);
      setAppointments((prev) => prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a)));
      setCancelTarget(null);
    } catch {
      /* noop */
    } finally {
      setCancelling(false);
    }
  };

  const doctorName = (apt: Appointment) => {
    const d = apt.doctor;
    if (!d?.user) return 'BS.';
    return `BS. ${d.user.firstName ?? ''} ${d.user.lastName ?? ''}`.trim() || 'BS.';
  };
  const specialty = (apt: Appointment) =>
    apt.doctor?.specializations?.[0]?.name ?? apt.doctor?.expertise ?? 'Nội tổng quát';
  const locationName = (apt: Appointment) =>
    (apt as { location?: string }).location ?? 'Bệnh viện Đa khoa Tâm Anh';

  const tabLabels: Record<Tab, string> = {
    upcoming: t('customerAppointments.tabUpcoming'),
    completed: t('customerAppointments.tabCompleted'),
    cancelled: t('customerAppointments.tabCancelled'),
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto pb-24 px-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <ListRowSkeleton key={i} lines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900">{t('customerAppointments.title')}</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label={t('common.menu')}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
        </button>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <ul className="px-4 py-4 space-y-4">
        {filtered.length === 0 ? (
          <li className="text-center text-gray-500 py-12">{t('appointments.noAppointmentsFound')}</li>
        ) : (
          filtered.map((apt) => {
            const config = statusConfig[apt.status] ?? statusConfig.pending;
            return (
              <li key={apt.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                    {apt.doctor?.user?.firstName?.[0]}{apt.doctor?.user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 truncate">{doctorName(apt)}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium uppercase ${config.className}`}>
                        {t(config.label as 'customerAppointments.statusUpcoming')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{specialty(apt)}</p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatApptDateTime(apt.scheduledAt, apt.startTime)}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                      <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      {locationName(apt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    to={`/customer/appointments/${apt.id}`}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                  >
                    {t('customerAppointments.details')}
                  </Link>
                  {['pending', 'confirmed'].includes(apt.status) && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(apt)}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    >
                      {t('customerAppointments.cancel')}
                    </button>
                  )}
                  {apt.status === 'completed' && (
                    <Link to={`/customer/records`} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
                      {t('customerAppointments.reviewResults')}
                    </Link>
                  )}
                  {apt.status === 'cancelled' && (
                    <Link to="/customer/doctors" className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100">
                      {t('customerAppointments.reschedule')}
                    </Link>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">{t('appointments.cancelAppointment')}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {t('appointments.cancelConfirmWith')} {doctorName(cancelTarget)} {t('appointments.cancelConfirmSuffix')}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('appointments.keepAppointment')}
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? t('common.loading') : t('appointments.yesCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
