import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { adminApi } from '../../api/admin';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Doctor, Hospital } from '../../types';
import { CardSkeleton } from '../../components/skeletons';

function getDoctorName(d: Doctor): string {
  const u = d.user as { firstName?: string; lastName?: string } | undefined;
  const name = u ? `${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.trim() || 'Doctor' : 'Doctor';
  return name.startsWith('BS.') || name.startsWith('Dr.') ? name : `BS. ${name}`;
}

function getDepartmentLabel(d: Doctor): string {
  const specs = (d.specializations ?? []).map((s) => s.name);
  return specs[0] ?? '—';
}

export default function AdminDoctors() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'onLeave' | 'intern'>('all');
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

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch = !search.trim() || (() => {
      const name = getDoctorName(d).toLowerCase();
      const spec = (d.specializations ?? []).map((s) => s.name).join(' ').toLowerCase();
      return name.includes(search.toLowerCase()) || spec.includes(search.toLowerCase());
    })();
    const isActive = (d as Doctor & { isActive?: boolean }).isActive !== false;
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'onLeave' && isActive) return false;
    if (statusFilter === 'intern') return (d as Doctor & { isIntern?: boolean }).isIntern === true;
    return matchesSearch;
  });

  const addDoctor = () => {
    navigate('/admin/users?create=1&role=doctor');
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="space-y-4 pb-24">
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <button type="button" onClick={() => navigate('/admin')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">{t('admin.manageDoctors')}</h1>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label={t('common.search')}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="search"
            placeholder={t('admin.searchDoctorOrSpecialty')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(['all', 'active', 'onLeave', 'intern'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setStatusFilter(f)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${statusFilter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              {f === 'all' && t('admin.allFilter')}
              {f === 'active' && t('admin.activeFilter')}
              {f === 'onLeave' && t('admin.onLeave')}
              {f === 'intern' && t('admin.intern')}
            </button>
          ))}
        </div>

        {filteredDoctors.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">{t('admin.manageDoctors')} — no match.</p>
        ) : (
          <div className="space-y-3">
            {filteredDoctors.map((d) => {
              const isActive = (d as Doctor & { isActive?: boolean }).isActive !== false;
              const department = getDepartmentLabel(d);
              const tags = (d.specializations ?? []).slice(1, 3).map((s) => s.name.toUpperCase());
              return (
                <div key={d.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                        {getDoctorName(d).replace(/^BS\.\s*/, '').slice(0, 2).toUpperCase()}
                      </div>
                      {isActive && <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-bold text-gray-900 truncate">{getDoctorName(d)}</h2>
                        <button type="button" className={`shrink-0 w-10 h-6 rounded-full transition ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`} aria-label={isActive ? t('admin.active') : t('admin.inactive')}>
                          <span className={`block w-4 h-4 rounded-full bg-white shadow mt-1 ml-0.5 transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <p className="text-sm text-blue-600 mt-0.5">Khoa: {department}</p>
                      {tags.length > 0 && <p className="text-xs text-gray-500 mt-1">{tags.join(' · ')}</p>}
                      <div className="mt-3 flex gap-2">
                        <Link to={`/admin/doctors/${d.id}`} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label={t('common.edit')}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </Link>
                        <button type="button" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label={t('common.delete')}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {total > limit && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        )}
      </main>

      <button type="button" onClick={addDoctor} className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 z-30" aria-label={t('admin.addDoctor')}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>
    </div>
  );
}
