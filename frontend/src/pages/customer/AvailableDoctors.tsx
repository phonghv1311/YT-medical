import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Doctor } from '../../types';
import { DoctorCardSkeleton } from '../../components/skeletons';

const SPECIALTY_KEYS = ['all', 'cardiology', 'dermatology', 'pediatrics', 'general', 'neurology'] as const;
const SPECIALTY_API: Record<string, string> = {
  all: '',
  general: 'General',
  cardiology: 'Cardiology',
  dermatology: 'Dermatology',
  pediatrics: 'Pediatrics',
  neurology: 'Neurology',
};

function getDoctorName(d: Doctor): string {
  const u = d.user as { firstName?: string; lastName?: string } | undefined;
  const first = (u?.firstName ?? '').trim();
  const last = (u?.lastName ?? '').trim();
  if (first || last) return `BS. ${first} ${last}`.trim();
  return 'BS. —';
}
function getSpecialty(d: Doctor): string {
  const specs = (d as Doctor & { specializations?: { name: string }[] }).specializations;
  return specs?.[0]?.name ?? 'General';
}
function getWorkplace(d: Doctor): string {
  const w = (d as Doctor & { workplace?: string; hospitalName?: string }).workplace ?? (d as Doctor & { hospitalName?: string }).hospitalName;
  return w ?? '—';
}

export default function AvailableDoctors() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialtyKey, setSpecialtyKey] = useState<typeof SPECIALTY_KEYS[number]>('all');

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    setLoading(true);
    const apiSpec = specialtyKey === 'all' ? undefined : SPECIALTY_API[specialtyKey];
    doctorsApi
      .getAll({ specialty: apiSpec, limit: 20 }, { signal: ctrl.signal })
      .then((r) => {
        if (cancelled.current) return;
        const list = r.data?.doctors ?? r.data?.data?.doctors ?? r.data ?? [];
        setDoctors(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled.current && err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') setDoctors([]);
      })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [specialtyKey]);

  const filtered = doctors.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = getDoctorName(d).toLowerCase();
    const spec = getSpecialty(d).toLowerCase();
    const workplace = getWorkplace(d).toLowerCase();
    return name.includes(q) || spec.includes(q) || workplace.includes(q);
  });

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('customerFindDoctor.title')}</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label={t('common.menu')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
      </header>

      <div className="p-4 space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="search"
            placeholder={t('customerFindDoctor.searchDoctorsOrSpecialty')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {SPECIALTY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSpecialtyKey(key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${specialtyKey === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {key === 'all' ? t('customerFindDoctor.all') : t(`consult.${key}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-12">{t('consult.noDoctors')}</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((doc) => {
              const rating = Number((doc as Doctor & { averageRating?: number }).averageRating) || 0;
              const reviews = Number((doc as Doctor & { totalReviews?: number }).totalReviews) || 0;
              const avatar = (doc.user as { avatar?: string })?.avatar;
              return (
                <div key={doc.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-14 h-14 rounded-full bg-teal-100 overflow-hidden">
                      {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center text-teal-600 text-lg font-semibold">{getDoctorName(doc).slice(3, 4) || '?'}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-amber-600 text-sm">
                        <span>★</span>
                        <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
                        <span className="text-gray-500">({reviews} {t('customerFindDoctor.examinations')})</span>
                      </p>
                      <h2 className="font-bold text-gray-900 mt-0.5">{getDoctorName(doc)}</h2>
                      <p className="text-sm text-gray-600">{getSpecialty(doc)}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {getWorkplace(doc)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/doctors/${doc.id}`}
                      className="flex-1 py-2.5 rounded-xl border border-blue-600 text-blue-600 font-medium text-center text-sm hover:bg-blue-50 transition"
                    >
                      {t('customerFindDoctor.viewProfile')}
                    </Link>
                    <Link
                      to={`/customer/booking/${doc.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-center text-sm hover:bg-blue-700 transition"
                    >
                      {t('customerFindDoctor.bookAppointment')}
                    </Link>
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
