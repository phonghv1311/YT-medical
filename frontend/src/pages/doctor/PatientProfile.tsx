import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { doctorsApi } from '../../api/doctors';
import type { User } from '../../types';
import { ProfileSkeleton } from '../../components/skeletons';

type TabId = 'record' | 'prescriptions' | 'history';

interface ActivityItem {
  id: string;
  type: 'reExamination' | 'general' | 'emergency';
  date: string;
  title: string;
  description: string;
  doctor?: string;
}

function appointmentToActivity(a: { id: number; scheduledAt?: string; reason?: string; notes?: string; status?: string }): ActivityItem {
  const dateStr = a.scheduledAt
    ? (() => {
      try {
        const d = new Date(a.scheduledAt);
        return Number.isNaN(d.getTime()) ? a.scheduledAt : d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch {
        return a.scheduledAt;
      }
    })()
    : '—';
  return {
    id: String(a.id),
    type: (a.reason?.toLowerCase().includes('tái khám') || a.reason?.toLowerCase().includes('re-examination')) ? 'reExamination' : (a.status === 'emergency' ? 'emergency' : 'general'),
    date: dateStr,
    title: (a.reason as string) ?? 'Appointment',
    description: (a.notes as string) ?? '',
    doctor: undefined,
  };
}

export default function DoctorPatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [patient, setPatient] = useState<(User & { lastVisit?: string; patientId?: string; gender?: string; age?: number }) | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [tab, setTab] = useState<TabId>('record');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const cancelled = { current: false };
    Promise.all([
      doctorsApi.me.getPatients({ signal: ctrl.signal }),
      doctorsApi.me.getAppointments({ signal: ctrl.signal }),
    ])
      .then(([patientsRes, apptsRes]) => {
        if (cancelled.current) return;
        const list = (patientsRes.data?.data ?? patientsRes.data) as User[];
        const found = Array.isArray(list) ? list.find((p) => String(p.id) === id) : null;
        setPatient(found ?? null);
        const appts = (apptsRes.data?.data ?? apptsRes.data) as unknown[];
        const arr = Array.isArray(appts) ? appts : [];
        const forPatient = arr.filter((a: { patientId?: number; patient?: { id?: number } }) => String((a as { patientId?: number }).patientId ?? (a as { patient?: { id?: number } }).patient?.id) === id);
        setActivities(forPatient.map((a: unknown) => appointmentToActivity(a as Parameters<typeof appointmentToActivity>[0])));
      })
      .catch(() => {
        if (!cancelled.current) {
          setPatient(null);
          setActivities([]);
        }
      })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [id]);

  if (loading) return <ProfileSkeleton />;

  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-gray-500">Patient not found.</p>
        <Link to="/doctor/patients" className="mt-4 inline-block text-blue-600 hover:underline">Back to Patient List</Link>
      </div>
    );
  }

  const name = `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || `Patient #${patient.id}`;
  const age = (patient as { age?: number }).age ?? 35;
  const gender = (patient as { gender?: string }).gender ?? 'Nam';
  const phone = (patient as { phone?: string }).phone ?? '+84 912 345 678';
  const address = (patient as { address?: string }).address ?? '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh';
  const tabs: { id: TabId; label: string }[] = [
    { id: 'record', label: t('doctorPatientProfile.medicalRecord') },
    { id: 'prescriptions', label: t('doctorPatientProfile.prescriptions') },
    { id: 'history', label: t('doctorPatientProfile.history') },
  ];

  const badgeClass = (type: ActivityItem['type']) =>
    type === 'reExamination' ? 'bg-blue-100 text-blue-800' : type === 'general' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  const badgeLabel = (type: ActivityItem['type']) =>
    type === 'reExamination' ? t('doctorPatientProfile.reExamination') : type === 'general' ? t('doctorPatientProfile.general') : t('doctorPatientProfile.emergency');

  return (
    <div className="min-h-full w-full max-w-lg mx-auto pb-28 px-4">
      <div className="flex items-center gap-3 py-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label={t('common.back')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">{name}</h1>
        <Link to={`/doctor/messages/${id}`} className="p-2 rounded-lg hover:bg-gray-100 text-blue-600" aria-label={t('nav.messages')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </Link>
        <Link to={`/doctor/appointments?patientId=${id}`} className="p-2 rounded-lg hover:bg-gray-100 text-blue-600" aria-label="Video call">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </Link>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0">
            {(patient.firstName?.[0] ?? '') + (patient.lastName?.[0] ?? '') || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900">{name}</h2>
            <p className="text-sm text-gray-600 mt-0.5">{age} tuổi • {gender}</p>
            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {phone}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {address}
            </p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={`py-3 px-2 text-sm font-medium border-b-2 transition ${tab === tb.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">{t('doctorPatientProfile.recent')}</h3>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">{t('doctorPatientProfile.noRecentActivity') ?? 'No recent activity.'}</p>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClass(item.type)}`}>{badgeLabel(item.type)}</span>
                  <span className="text-xs text-gray-500">{item.date}</span>
                </div>
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                {item.doctor && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {item.doctor}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Link
        to={`/doctor/appointments?patientId=${patient.id}`}
        className="fixed left-4 right-4 bottom-20 max-w-lg mx-auto py-4 rounded-xl bg-blue-600 text-white text-center font-semibold shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 z-30"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        {t('doctorPatientProfile.startExam')}
      </Link>
    </div>
  );
}
