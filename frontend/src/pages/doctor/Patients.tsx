import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import { doctorsApi } from '../../api/doctors';
import type { User } from '../../types';
import { ListRowSkeleton } from '../../components/skeletons';

interface PatientRow extends User {
  lastVisit?: string;
  patientId?: string;
  gender?: string;
  age?: number;
}

const TABS = ['all', 'today', 'waiting'] as const;

function formatLastVisit(date?: string): string {
  if (!date) return '—';
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hôm nay, ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const diff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 1) return 'Hôm qua';
  if (diff < 7) return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DoctorPatients() {
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('all');
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    doctorsApi.me
      .getPatients({ signal })
      .then(({ data }) => {
        const list = (data?.data ?? data) as PatientRow[];
        setPatients(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setPatients([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPatients(ctrl.signal);
    return () => {
      ctrl.abort();
    };
  }, [fetchPatients]);

  const filtered = patients.filter((p) => {
    const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (p.email ?? '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    return true;
  });

  const doctorName = user?.firstName ?? 'Bác sĩ';
  const clinicName = 'Phòng khám Nội tổng quát';

  if (loading) {
    return (
      <div className="max-w-lg mx-auto pb-24 px-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ListRowSkeleton key={i} lines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">Bác sĩ {doctorName}</h1>
              <p className="text-xs text-gray-500 truncate">{clinicName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={t('common.notifications')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button type="button" className="p-2 rounded-full bg-blue-100 text-blue-600" aria-label={t('common.menu')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 01-.707.293H3a1 1 0 01-1-1V4z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="relative mt-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={t('doctorPatients.searchPatient')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-blue-600 text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 01-.707.293H3a1 1 0 01-1-1V4z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'all' ? t('doctorPatients.tabAll') : tab === 'today' ? t('doctorPatients.tabToday') : t('doctorPatients.tabWaiting')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 py-12 text-center px-4">{t('consult.noDoctors')}</p>
      ) : (
        <ul className="px-4 py-4 space-y-4">
          {filtered.map((p) => {
            const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `Patient #${p.id}`;
            const demographics = [p.age ? `${p.age} tuổi` : null, p.gender ?? ''].filter(Boolean).join(' • ');
            const phone = (p as { phone?: string }).phone ?? '';
            const lastVisitStr = formatLastVisit(p.lastVisit as string);
            return (
              <li key={p.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                    {(p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '') || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">{name}</p>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] uppercase text-gray-500 font-medium">{t('doctorPatients.lastTime')}</p>
                        <p className="text-sm font-medium text-blue-600">{lastVisitStr}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{demographics || phone}</p>
                    {phone && demographics && <p className="text-xs text-gray-400 mt-0.5">{phone}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    to={`/doctor/patients/${p.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {t('doctorPatients.view')}
                  </Link>
                  <Link
                    to={`/doctor/messages/${p.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {t('doctorPatients.chat')}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/doctor/schedule"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 z-10"
        aria-label={t('common.add')}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}
