import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import type { Appointment } from '../../types';
import { ListRowSkeleton } from '../../components/skeletons';

const TABS = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatApptDate(scheduledAt?: string, startTime?: string): string {
  if (!scheduledAt) return '—';
  const d = scheduledAt.split('T')[0].split('-');
  const dateStr = d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : scheduledAt;
  return startTime ? `${startTime}, ${dateStr}` : dateStr;
}

export default function DoctorAppointments() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('pending');

  const fetchAppointments = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    doctorsApi.me
      .getAppointments({ signal })
      .then(({ data }) => {
        setAppointments(data?.data ?? data ?? []);
      })
      .catch(() => {
        setAppointments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchAppointments(ctrl.signal);
    return () => {
      ctrl.abort();
    };
  }, [fetchAppointments]);

  async function handleConfirm(id: number) {
    await appointmentsApi.confirm(id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'confirmed' } as Appointment : a)));
  }

  async function handleDecline(id: number) {
    await appointmentsApi.cancel(id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } as Appointment : a)));
  }

  const tabLabels = {
    pending: t('doctorAppointments.tabPending'),
    confirmed: t('doctorAppointments.tabConfirmed'),
    completed: t('doctorAppointments.tabCompleted'),
    cancelled: t('doctorAppointments.tabCancelled'),
  };

  const filtered = appointments.filter((a) => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'confirmed') return a.status === 'confirmed' || a.status === 'in_progress';
    if (activeTab === 'completed') return a.status === 'completed';
    return a.status === 'cancelled';
  });

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
        <h1 className="text-xl font-bold text-gray-900">{t('doctorAppointments.title')}</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label={t('common.menu')}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <ul className="px-4 py-4 space-y-4">
        {filtered.length === 0 ? (
          <li className="text-center text-gray-500 py-8">{t('appointments.noAppointmentsFound')}</li>
        ) : (
          filtered.map((appt) => {
            const patientName = appt.patient
              ? `${(appt.patient as { firstName?: string }).firstName ?? ''} ${(appt.patient as { lastName?: string }).lastName ?? ''}`.trim()
              : `Patient #${appt.patientId}`;
            const isConfirmed = appt.status === 'confirmed' || appt.status === 'in_progress' || appt.status === 'completed';
            const typeLabel = appt.notes || t('doctorDashboard.generalCheckup');
            return (
              <li
                key={appt.id}
                className={`rounded-2xl bg-white border shadow-sm overflow-hidden ${
                  appt.status === 'pending' ? 'border-blue-100' : 'border-gray-100'
                }`}
              >
                <div className="flex gap-3 p-4">
                  {isConfirmed && (
                    <span className="shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600" aria-hidden>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
                    {(appt.patient as { firstName?: string })?.firstName?.[0] ?? ''}
                    {(appt.patient as { lastName?: string })?.lastName?.[0] ?? ''}
                    {!appt.patient && '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">{patientName}</p>
                      {appt.status === 'pending' && (
                        <span className="shrink-0 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                          MỚI
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{typeLabel}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatApptDate(appt.scheduledAt, appt.startTime)}
                    </p>
                  </div>
                </div>
                {appt.status === 'pending' && (
                  <div className="flex items-center gap-2 px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => handleConfirm(appt.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('doctorAppointments.accept')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(appt.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('doctorAppointments.decline')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/doctor/patients/${appt.patientId}`)}
                      className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
                      aria-label={t('doctorAppointments.viewDetails')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
