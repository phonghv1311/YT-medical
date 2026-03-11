import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import type { User } from '../../types';
import { ProfileSkeleton } from '../../components/skeletons';

type TabId = 'history' | 'labs' | 'prescriptions' | 'appointments';

interface ActivityItem {
  id: string;
  type: 'consultation' | 'lab' | 'urgent';
  date: string;
  title: string;
  description: string;
  tags?: string[];
  link?: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'consultation', date: 'Oct 12, 2023', title: 'Telehealth Consultation', description: 'Follow-up on hypertension. Patient reports consistent blood pressure readings within range. Renewed Lisinopril prescription for 3 months.', tags: ['HYPERTENSION', 'FOLLOW-UP'] },
  { id: '2', type: 'lab', date: 'Sep 28, 2023', title: 'Laboratory Work', description: 'Complete blood count (CBC) and lipid panel. Results indicate slightly elevated LDL cholesterol. Recommended dietary adjustments.', link: 'View lab results' },
  { id: '3', type: 'urgent', date: 'Aug 15, 2023', title: 'Urgent Care Visit', description: 'Persistent dry cough and mild fever. Diagnosed with seasonal viral infection. OTC medication prescribed for symptom management.' },
];

export default function DoctorPatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<(User & { lastVisit?: string; patientId?: string; gender?: string; age?: number }) | null>(null);
  const [tab, setTab] = useState<TabId>('appointments');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const cancelled = { current: false };
    doctorsApi.me.getPatients({ signal: ctrl.signal })
      .then(({ data }) => {
        if (cancelled.current) return;
        const list = (data?.data ?? data) as User[];
        const found = Array.isArray(list) ? list.find((p) => String(p.id) === id) : null;
        setPatient(found ?? null);
      })
      .catch(() => { if (!cancelled.current) setPatient(null); })
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
  const demographics = `Female, 32 years • ID: ${(patient as { patientId?: string }).patientId ?? `#PT-${String(patient.id).padStart(4, '0')}`}`;
  const tabs: { id: TabId; label: string }[] = [
    { id: 'history', label: 'History' },
    { id: 'labs', label: 'Labs' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'appointments', label: 'Appointments' },
  ];

  return (
    <div className="min-h-full w-full max-w-4xl mx-auto pb-28 px-0">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Patient Profile</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="More options">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
            {(patient.firstName?.[0] ?? '') + (patient.lastName?.[0] ?? '') || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
            <p className="text-sm text-gray-600 mt-1">{demographics}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active Patient</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl bg-gray-50 p-3 flex items-center gap-2">
                <span className="text-red-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z" clipRule="evenodd" /></svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Blood Type</p>
                  <p className="text-sm font-medium text-gray-900">O Positive (O+)</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 flex items-center gap-2">
                <span className="text-amber-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Allergies</p>
                  <p className="text-sm font-medium text-gray-900">Penicillin, Latex</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 overflow-x-auto -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Recent Activity</h3>
        <div className="relative space-y-0">
          {MOCK_ACTIVITY.map((item, idx) => (
            <div key={item.id} className="flex gap-4 relative pb-6">
              {idx < MOCK_ACTIVITY.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />}
              <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center z-[1] text-gray-600">
                {item.type === 'consultation' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                {item.type === 'lab' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                {item.type === 'urgent' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              </div>
              <div className="flex-1 min-w-0 rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <span className="text-xs text-gray-500">{item.date}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{tag}</span>
                    ))}
                  </div>
                )}
                {item.link && <button type="button" className="mt-2 text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">{item.link} <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed left-0 right-0 bottom-16 max-w-lg mx-auto px-4 z-30 flex gap-2 safe-area-pb">
        <Link
          to={`/doctor/patients/${patient.id}/prescription/new`}
          className="flex-1 py-4 rounded-xl border-2 border-blue-600 text-blue-600 text-center font-semibold hover:bg-blue-50 flex items-center justify-center gap-2"
        >
          New Prescription
        </Link>
        <Link
          to={`/doctor/appointments?patientId=${patient.id}`}
          className="flex-1 py-4 rounded-xl bg-blue-600 text-white text-center font-semibold shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Start Consultation
        </Link>
      </div>
    </div>
  );
}
