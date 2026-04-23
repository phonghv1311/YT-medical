import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { DashboardSkeleton } from '../../components/skeletons';

export type ApprovalTab =
  | 'doctors'
  | 'transfers'
  | 'staff'
  | 'hospitals'
  | 'profiles'
  | 'resignation'
  | 'leave'
  | 'salary_advance'
  | 'appointments';

type PendingItem = { id: string; title?: string; name?: string; email?: string; submittedAt?: string;[key: string]: unknown };

function normalizeList(raw: unknown): PendingItem[] {
  const arr = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
  return arr.map((item: Record<string, unknown>, i: number) => ({
    id: String(item.id ?? i),
    title: item.title != null ? String(item.title) : undefined,
    name: item.name != null ? String(item.name) : [item.firstName, item.lastName].filter(Boolean).join(' ') || undefined,
    email: item.email != null ? String(item.email) : undefined,
    submittedAt: item.submittedAt != null ? String(item.submittedAt) : item.createdAt != null ? String(item.createdAt) : undefined,
    ...item,
  }));
}

const TAB_API_MAP: Record<ApprovalTab, (config?: { signal?: AbortSignal }) => Promise<{ data?: unknown }>> = {
  doctors: (c) => adminApi.getPendingDoctors(c),
  transfers: (c) => adminApi.getPendingTransfers(c),
  staff: (c) => adminApi.getPendingStaff(c),
  hospitals: (c) => adminApi.getPendingHospitals(c),
  profiles: (c) => adminApi.getPendingProfiles(c),
  resignation: (c) => adminApi.getPendingResignations(c),
  leave: (c) => adminApi.getPendingLeave(c),
  salary_advance: (c) => adminApi.getPendingSalaryAdvance(c),
  appointments: (c) => adminApi.getPendingAppointments(c),
};

const TAB_KEYS: { tab: ApprovalTab; labelKey: string }[] = [
  { tab: 'doctors', labelKey: 'adminApprovals.tabDoctors' },
  { tab: 'transfers', labelKey: 'adminApprovals.tabTransfers' },
  { tab: 'staff', labelKey: 'adminApprovals.tabStaff' },
  { tab: 'hospitals', labelKey: 'adminApprovals.tabHospitals' },
  { tab: 'profiles', labelKey: 'adminApprovals.tabProfiles' },
  { tab: 'resignation', labelKey: 'adminApprovals.tabResignation' },
  { tab: 'leave', labelKey: 'adminApprovals.tabLeave' },
  { tab: 'salary_advance', labelKey: 'adminApprovals.tabSalaryAdvance' },
  { tab: 'appointments', labelKey: 'adminApprovals.pendingOrders' },
];

export default function AdminApprovals() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (() => {
    const raw = searchParams.get('tab') ?? undefined;
    if (!raw) return 'doctors' as ApprovalTab;
    const allTabs = new Set<ApprovalTab>(TAB_KEYS.map((x) => x.tab));
    return (allTabs.has(raw as ApprovalTab) ? raw : 'doctors') as ApprovalTab;
  })();

  const [tab, setTab] = useState<ApprovalTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [itemsByTab, setItemsByTab] = useState<Partial<Record<ApprovalTab, PendingItem[]>>>({});
  const loadedTabsRef = useRef<Set<ApprovalTab>>(new Set());

  useEffect(() => {
    if (loadedTabsRef.current.has(tab)) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    const fetchFn = TAB_API_MAP[tab];
    fetchFn({ signal })
      .then((r) => normalizeList(r.data ?? r))
      .catch(() => [] as PendingItem[])
      .then((data) => {
        if (signal.aborted) return;
        loadedTabsRef.current.add(tab);
        setItemsByTab((prev) => ({ ...prev, [tab]: data }));
      })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [tab]);

  const items = itemsByTab[tab] ?? [];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">{t('adminApprovals.title')}</h1>
        </div>
        <div className="max-w-lg mx-auto px-4 flex gap-2 pb-3 overflow-x-auto scrollbar-hide">
          {TAB_KEYS.map(({ tab: tKey, labelKey }) => (
            <button
              key={tKey}
              type="button"
              onClick={() => setTab(tKey)}
              className={`shrink-0 py-2.5 px-3 rounded-xl text-sm font-medium transition whitespace-nowrap ${tab === tKey ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-4">
          {tab === 'doctors' && t('adminApprovals.doctorApprovalDesc')}
          {tab === 'appointments' && t('adminApprovals.orderApprovalDesc')}
          {tab !== 'doctors' && tab !== 'appointments' && t('adminApprovals.doctorApprovalDesc')}
        </p>
        {items.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">{t('adminApprovals.noPending')}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl bg-white border border-gray-200 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{item.title ?? item.name ?? item.id}</p>
                  {item.email && <p className="text-sm text-gray-500 truncate">{item.email}</p>}
                  {item.submittedAt && <p className="text-xs text-gray-400 mt-1">{t('adminApprovals.submittedAt')}: {item.submittedAt}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
                    {t('adminApprovals.approve')}
                  </button>
                  <button type="button" className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                    {t('adminApprovals.reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link to="/admin" className="block text-center text-sm text-teal-600 font-medium hover:underline">{t('adminApprovals.backToDashboard')}</Link>
        </div>
      </main>
    </div>
  );
}
