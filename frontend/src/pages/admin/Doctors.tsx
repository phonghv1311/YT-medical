import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { adminApi } from '../../api/admin';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Doctor, Hospital } from '../../types';
import { CardSkeleton } from '../../components/skeletons';

function getDoctorName(d: Doctor): string {
  const u = d.user as { firstName?: string; lastName?: string } | undefined;
  return u ? `Dr. ${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.trim() || 'Doctor' : 'Doctor';
}

export default function AdminDoctors() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getHospitals({ signal })
      .then(({ data }) => {
        if (signal.aborted) return;
        const list = data?.data ?? data;
        setHospitals(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    const hospitalId = hospitalFilter ? parseInt(hospitalFilter, 10) : undefined;
    doctorsApi.getAll(
      { hospitalId: Number.isNaN(hospitalId as number) ? undefined : hospitalId, page, limit },
      { signal },
    )
      .then((r) => {
        if (signal.aborted) return;
        const res = r.data?.doctors ?? r.data?.data ?? r.data;
        const list = Array.isArray(res) ? res : (res as { doctors?: Doctor[] })?.doctors ?? [];
        setDoctors(list);
        const tot = (r.data?.total ?? (r.data as { total?: number })?.total) ?? list.length;
        setTotal(tot);
      })
      .catch(() => { if (!signal.aborted) setDoctors([]); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [hospitalFilter, page, limit]);

  const filteredDoctors = search.trim()
    ? doctors.filter((d) => {
      const name = getDoctorName(d).toLowerCase();
      const spec = (d.specializations ?? []).map((s) => s.name).join(' ').toLowerCase();
      return name.includes(search.toLowerCase()) || spec.includes(search.toLowerCase());
    })
    : doctors;

  const addDoctor = () => {
    navigate('/admin/users?create=1&role=doctor');
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} lines={4} showImage imageHeight="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600" aria-hidden>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Doctors</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="search"
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={hospitalFilter}
          onChange={(e) => { setHospitalFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All hospitals</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <button type="button" onClick={addDoctor} className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        + Add doctor
      </button>

      {filteredDoctors.length === 0 ? (
        <p className="text-gray-500 py-8">No doctors yet. Add a user with Doctor role to create a doctor profile.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDoctors.map((d) => (
            <div key={d.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <Link to={`/admin/doctors/${d.id}`} className="block p-4 flex-1 flex flex-col min-w-0 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                    {getDoctorName(d).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900 truncate">{getDoctorName(d)}</h2>
                    <p className="text-sm text-gray-500 truncate">
                      {(d.specializations ?? []).map((s) => s.name).join(', ') || '—'}
                    </p>
                  </div>
                </div>
                {d.yearsOfExperience != null && (
                  <p className="text-xs text-gray-500 mt-1">{d.yearsOfExperience} years experience</p>
                )}
                <div className="mt-2">
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Doctor</span>
                </div>
              </Link>
              <div className="px-4 pb-4 flex gap-2">
                <Link to={`/admin/doctors/${d.id}`} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition text-center">
                  {t('common.view')}
                </Link>
                <Link to={`/doctors/${d.id}`} className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition text-center">
                  Public profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition">Prev</button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition">Next</button>
        </div>
      )}
    </div>
  );
}
