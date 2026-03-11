import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { patientsApi } from '../../api';
import type { MedicalRecord } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { ListRowSkeleton } from '../../components/skeletons';

const FILTER_TABS = ['All', 'Lab Results', 'Consultations', 'Prescriptions'] as const;

export default function MedicalRecords() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<(typeof FILTER_TABS)[number]>('All');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    patientsApi.getMedicalRecords(user.id)
      .then((r) => setRecords(r.data?.data ?? r.data ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = records.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || r.title.toLowerCase().includes(filter.toLowerCase().slice(0, 4));
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4 -mt-4 pt-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('records.medicalRecords')}</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
        </button>
      </header>

      <div className="p-4 space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="search"
            placeholder={t('records.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${filter === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {tab === 'All' ? t('records.all') : tab === 'Lab Results' ? t('records.labResults') : tab === 'Consultations' ? t('records.consultations') : t('records.prescriptions')}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{t('records.recentRecords')}</h2>
          <Link to="#" className="text-sm font-medium text-blue-600">{t('records.seeAll')}</Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <ListRowSkeleton key={i} lines={2} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">{t('records.noRecordsYet')}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <Link key={r.id} to={`/customer/records/${r.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-sky-200 transition">
                <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{r.title}</p>
                  <p className="text-sm text-gray-500">{r.recordDate ? new Date(r.recordDate).toLocaleDateString() : ''}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/customer/records"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg z-10"
        aria-label="Add record"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </Link>
    </div>
  );
}
