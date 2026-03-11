import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi } from '../../api';
import type { Appointment } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { ListRowSkeleton } from '../../components/skeletons';

const tabs = ['all', 'upcoming', 'completed', 'cancelled'] as const;
type Tab = (typeof tabs)[number];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-800',
};

const PAGE_SIZE = 10;

export default function Appointments() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    const statusMap: Record<Tab, string | undefined> = {
      all: undefined,
      upcoming: 'confirmed',
      completed: 'completed',
      cancelled: 'cancelled',
    };
    setLoading(true);
    appointmentsApi
      .getAll({ status: statusMap[activeTab], page, limit: PAGE_SIZE }, { signal: ctrl.signal })
      .then(({ data }) => {
        if (cancelled.current) return;
        const payload = data.data ?? data;
        if (Array.isArray(payload)) {
          setAppointments(payload);
          setTotal(payload.length);
        } else {
          setAppointments(payload?.data ?? []);
          setTotal(payload?.total ?? 0);
        }
      })
      .catch((err) => {
        if (!cancelled.current && err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') setAppointments([]);
      })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [activeTab, page, refreshKey]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await appointmentsApi.cancel(cancelTarget.id);
      setRefreshKey((k) => k + 1);
    } catch {
      /* noop */
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('appointments.myAppointments')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab === 'upcoming' ? 'Upcoming' : tab}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <ListRowSkeleton key={i} lines={2} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow ring-1 ring-gray-100">
          <p className="text-gray-500">{t('appointments.noAppointmentsFound')}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-white shadow ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Time', 'Doctor', 'Type', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((apt) => {
                  const date = new Date(apt.scheduledAt);
                  return (
                    <tr key={apt.id} className="hover:bg-gray-50 transition">
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-900">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {apt.startTime} – {apt.endTime}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900">
                        Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                      </td>
                      <td className="px-5 py-4 text-sm capitalize text-gray-600">
                        {apt.type === 'video' ? '📹 Video' : '🏥 In-person'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${statusColors[apt.status]}`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/customer/appointments/${apt.id}`}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                          >
                            {t('appointments.details')}
                          </Link>
                          {['pending', 'confirmed'].includes(apt.status) && (
                            <button
                              onClick={() => setCancelTarget(apt)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                            >
                              {t('appointments.cancel')}
                            </button>
                          )}
                          {apt.status === 'confirmed' && (
                            <Link
                              to={`/customer/appointments/${apt.id}/call`}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition"
                            >
                              {t('appointments.joinCall')}
                            </Link>
                          )}
                          {apt.status === 'completed' && (
                            <Link
                              to={`/customer/appointments/${apt.id}/review`}
                              className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
                            >
                              {t('appointments.review')}
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {appointments.map((apt) => {
              const date = new Date(apt.scheduledAt);
              return (
                <div key={apt.id} className="rounded-2xl bg-white p-5 shadow ring-1 ring-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {apt.startTime} – {apt.endTime}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 capitalize">{apt.type === 'video' ? 'Video call' : 'In-person'}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${statusColors[apt.status]}`}>
                      {apt.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/customer/appointments/${apt.id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      {t('appointments.details')}
                    </Link>
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button
                        onClick={() => setCancelTarget(apt)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      >
                        {t('appointments.cancel')}
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <Link
                        to={`/customer/appointments/${apt.id}/call`}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition"
                      >
                        {t('appointments.joinCall')}
                      </Link>
                    )}
                    {apt.status === 'completed' && (
                      <Link
                        to={`/customer/appointments/${apt.id}/review`}
                        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        {t('appointments.review')}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-3 shadow ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">{t('appointments.cancelAppointment')}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {t('appointments.cancelConfirmWith')}{' '}
              <span className="font-medium">
                Dr. {cancelTarget.doctor?.user?.firstName} {cancelTarget.doctor?.user?.lastName}
              </span>
              {t('appointments.cancelConfirmSuffix')}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                {t('appointments.keepAppointment')}
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition"
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
