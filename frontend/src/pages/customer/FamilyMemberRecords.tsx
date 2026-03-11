import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { patientsApi } from '../../api';
import type { FamilyMember } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

export default function FamilyMemberRecords() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [records, setRecords] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'history' | 'vaccines' | 'meds'>('history');

  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    patientsApi.getFamilyMembers(user.id)
      .then(({ data }) => {
        const list = data?.data ?? data ?? [];
        const arr = Array.isArray(list) ? list : [];
        const found = arr.find((m: FamilyMember) => String(m.id) === id);
        setMember(found ?? null);
      })
      .catch(() => setMember(null))
      .finally(() => setLoading(false));
    patientsApi.getMedicalRecords(user.id).then((r) => {
      const d = r.data?.data ?? r.data ?? [];
      setRecords(Array.isArray(d) ? d : []);
    }).catch(() => setRecords([]));
  }, [user, id]);

  if (loading) return <FullPageSkeleton />;
  if (!member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Member not found.</p>
        <Link to="/customer/family" className="mt-4 text-blue-600 font-medium">Back to family</Link>
      </div>
    );
  }

  const age = member.dateOfBirth ? (new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()) : null;
  const bloodType = (member as FamilyMember & { bloodType?: string }).bloodType;
  const weight = (member as FamilyMember & { weight?: number }).weight;
  const displayName = `${member.firstName} ${member.lastName}'s Records`;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{displayName}</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="More">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-teal-100 border-4 border-teal-200 flex items-center justify-center text-teal-700 font-bold text-2xl">
            {member.firstName[0]}{member.lastName[0]}
          </div>
          <p className="mt-3 font-bold text-gray-900">{member.firstName} {member.lastName}</p>
          <p className="text-sm text-gray-500">{member.relationship}, {age ?? '—'} years old</p>
          <div className="flex gap-2 mt-2">
            {bloodType && <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">Blood type: {bloodType}</span>}
            {weight != null && <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">Weight: {weight}kg</span>}
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200">
          {(['history', 'vaccines', 'meds'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`pb-3 text-sm font-medium capitalize ${tab === t ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>

        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">Upcoming Appointments</h2>
          <Link to="/customer/appointments" className="block p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
            <p className="font-medium text-gray-900">No upcoming appointments</p>
            <p className="text-sm text-gray-500 mt-0.5">Book one from Consult</p>
          </Link>
        </section>

        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">Recent Medical Records</h2>
          <div className="space-y-2">
            {records.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No records yet.</p>
            ) : (
              (records as { id: number; title?: string; recordDate?: string }[]).slice(0, 5).map((r) => (
                <Link key={r.id} to={`/customer/records/${r.id}`} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <span className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{r.title ?? 'Record'}</p>
                    <p className="text-xs text-gray-500">{r.recordDate ?? ''}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <Link to="/customer/records" className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </Link>
    </div>
  );
}
