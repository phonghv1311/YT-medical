import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { patientsApi } from '../../api';
import type { MedicalRecord } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { ListRowSkeleton } from '../../components/skeletons';

const TABS = ['records', 'prescriptions'] as const;

export default function MedicalRecords() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('records');

  useEffect(() => {
    if (!user) return;
    const ctrl = new AbortController();
    setLoading(true);
    patientsApi.getMedicalRecords(user.id, { signal: ctrl.signal })
      .then((r) => setRecords(r.data?.data ?? r.data ?? []))
      .catch((err) => { if (err?.code !== 'ERR_CANCELED') setRecords([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [user]);

  const filtered = records.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const isPrescription = (r as { type?: string }).type === 'prescription' || r.title.toLowerCase().includes('đơn');
    if (activeTab === 'prescriptions') return matchSearch && isPrescription;
    return matchSearch && !isPrescription;
  });

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('customerRecords.title')}</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label={t('common.menu')}>
          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
        </button>
      </header>

      <div className="p-4 space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="search"
            placeholder={t('customerRecords.searchRecordsOrDoctor')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            >
              {tab === 'records' ? t('customerRecords.tabMedicalRecords') : t('customerRecords.tabPrescriptions')}
            </button>
          ))}
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
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900">{r.title}</p>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('customerRecords.statusCompleted')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">BS. {(r as { doctorName?: string }).doctorName ?? '—'}</p>
                    <p className="text-sm text-gray-500">{(r as { hospitalName?: string }).hospitalName ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {r.recordDate ? new Date(r.recordDate).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/customer/records/${r.id}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                >
                  {t('customerRecords.viewDetails')}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
