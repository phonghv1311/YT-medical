import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { CardSkeleton } from '../../components/skeletons';
import type { Hospital } from '../../types';

const FILTERS = [
  { id: 'near', label: 'Near Me', icon: 'plane' },
  { id: '24_7', label: 'Open 24/7', icon: 'chevron' },
  { id: 'er', label: 'ER', icon: 'chevron' },
  { id: 'pediatrics', label: 'Pediatrics', icon: 'chevron' },
];

export default function HospitalList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('near');

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    adminApi
      .getHospitals({ signal: ctrl.signal })
      .then((r) => {
        if (!cancelled.current) setHospitals((r.data?.data ?? r.data) ?? []);
      })
      .catch(() => { if (!cancelled.current) setHospitals([]); })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  const filtered = search.trim()
    ? hospitals.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()) || (h.address ?? '').toLowerCase().includes(search.toLowerCase()))
    : hospitals;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <CardSkeleton key={i} lines={2} imageHeight="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 h-14 px-4">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Find Hospitals</h1>
          <Link to="/customer/hospitals" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Map view">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </Link>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="search"
              placeholder="Search hospitals, specialties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${activeFilter === f.id ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
            >
              {f.icon === 'plane' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              )}
              {f.icon === 'chevron' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              )}
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-12">{t('customer.noHospitals')}</p>
        ) : (
          filtered.map((h, idx) => (
            <div key={h.id} className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex gap-4 p-4">
                <div className="w-24 h-24 shrink-0 rounded-xl bg-teal-100 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-teal-200 to-cyan-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900">{h.name}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    {(idx + 1) * 1.2} km away
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="rounded-md bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5">ER</span>
                    <span className="rounded-md bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5">CARDIOLOGY</span>
                    <span className="rounded-md bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5">PEDIATRICS</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-4 pt-0">
                <a href={`tel:${(h.phone || '').replace(/\s/g, '')}`} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-500 text-white font-semibold py-2.5 hover:bg-teal-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Quick Call
                </a>
                <Link to={`/customer/hospitals/${h.id}`} className="flex-1 flex items-center justify-center rounded-xl border border-gray-200 text-gray-700 font-medium py-2.5 hover:bg-gray-50 transition">
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
        {filtered.length > 0 && <p className="text-center text-sm text-gray-400 py-4">Don&apos;t see your hospital?</p>}
      </div>
    </div>
  );
}
