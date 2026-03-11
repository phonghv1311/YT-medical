import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { doctorsApi } from '../../api/doctors';
import type { User } from '../../types';
import { ListRowSkeleton } from '../../components/skeletons';

interface PatientRow extends User {
  lastVisit?: string;
  patientId?: string;
  status?: 'active' | 'follow_up' | 'archived';
  gender?: string;
  age?: number;
}

const DATE_FILTERS = ['Today', 'This week', 'This month'] as const;
const STATUS_TABS = ['ACTIVE', 'FOLLOW-UP', 'ARCHIVED'] as const;

export default function DoctorPatients() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]>('Today');
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>('ACTIVE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    doctorsApi.me.getPatients({ signal: ctrl.signal })
      .then(({ data }) => {
        if (cancelled.current) return;
        const list = (data?.data ?? data) as PatientRow[];
        setPatients(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled.current) setPatients([]); })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  const filtered = patients.filter((p) => {
    const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (p.email ?? '').toLowerCase().includes(search.toLowerCase()) || (String((p as PatientRow).patientId ?? p.id)).toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    const status = ((p as PatientRow).status ?? 'active').toString().toUpperCase().replace('_', '-');
    if (statusTab === 'ACTIVE') return status === 'ACTIVE' || !(p as PatientRow).status;
    if (statusTab === 'FOLLOW-UP') return status === 'FOLLOW-UP';
    return status === 'ARCHIVED';
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ListRowSkeleton key={i} lines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Patient List</h1>
        <Link to="/doctor/schedule" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Calendar">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </Link>
      </div>

      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {DATE_FILTERS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDateFilter(d)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${dateFilter === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {d}
            <span className="ml-1 inline-block w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-current align-middle" />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${statusTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">No patients found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `Patient #${p.id}`;
            const demographics = [p.age ? `${p.age} yrs` : null, p.gender ?? '', p.patientId ?? `#PT-${String(p.id).padStart(4, '0')}`].filter(Boolean).join(' • ');
            return (
              <div
                key={p.id}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex items-center gap-4"
              >
                <Link to={`/doctor/patients/${p.id}`} className="flex-1 min-w-0 flex items-center gap-4 no-underline text-inherit hover:opacity-90">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                    {(p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '') || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{name}</p>
                      {(p as PatientRow).status === 'follow_up' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">FOLLOW-UP</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{demographics}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Last visit: {p.lastVisit ?? '—'}
                    </p>
                  </div>
                </Link>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link to={`/doctor/patients/${p.id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Chat">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </Link>
                  <Link to={`/doctor/patients/${p.id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Medical records">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        to="/doctor/schedule"
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 z-10"
        aria-label="Add"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </Link>
    </div>
  );
}
