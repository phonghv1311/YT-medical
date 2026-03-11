import { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { DashboardSkeleton } from '../../components/skeletons';

interface ReportStats {
  totalAppointments: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconCurrency({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

export default function AdminReports() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<ReportStats>({
    totalAppointments: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getUsers({ limit: 1 }, { signal })
      .then(({ data }) => {
        if (signal.aborted) return;
        const payload = data?.data ?? data;
        setStats((prev) => ({ ...prev, totalAppointments: payload?.total ?? 0 }));
      })
      .catch((err) => { if (!signal.aborted) console.error('Failed to load reports', err); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  if (loading) return <DashboardSkeleton />;

  function currency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const appointmentTotal = stats.pending + stats.confirmed + stats.completed + stats.cancelled;
  const appointmentCards = [
    { labelKey: 'reports.pending', value: stats.pending, bg: 'bg-amber-50', text: 'text-amber-700', icon: IconCalendar },
    { labelKey: 'reports.confirmed', value: stats.confirmed, bg: 'bg-violet-50', text: 'text-violet-700', icon: IconCalendar },
    { labelKey: 'reports.completed', value: stats.completed, bg: 'bg-green-50', text: 'text-green-700', icon: IconCalendar },
    { labelKey: 'reports.cancelled', value: stats.cancelled, bg: 'bg-red-50', text: 'text-red-700', icon: IconCalendar },
  ];

  const revenueCards = [
    { labelKey: 'reports.totalRevenue', value: stats.revenue, bg: 'bg-green-50', text: 'text-green-700' },
    { labelKey: 'reports.thisMonth', value: 0, bg: 'bg-blue-50', text: 'text-blue-700' },
    { labelKey: 'reports.avgPerAppointment', value: stats.totalAppointments ? stats.revenue / stats.totalAppointments : 0, bg: 'bg-amber-50', text: 'text-amber-700' },
  ];
  const revenueTotal = stats.revenue;

  return (
    <div className="space-y-8 pb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('reports.subtitle')}</p>
      </div>

      {/* Appointment Summary: total in title, 2 cards per row */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          {t('reports.appointmentSummaryTotal', { count: String(appointmentTotal) })}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {appointmentCards.map((c) => (
            <div key={c.labelKey} className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 min-w-0 ${c.bg} ${c.text} shadow-sm`}>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <p className="text-xs sm:text-sm font-medium opacity-90 truncate">{t(c.labelKey)}</p>
                <c.icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 opacity-80" />
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-bold">{c.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Summary: 2 per row, 1-line labels, total amount */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('reports.revenueSummary')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {revenueCards.map((c) => (
            <div key={c.labelKey} className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 min-w-0 ${c.bg} ${c.text} shadow-sm flex items-center gap-3`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/60">
                <IconCurrency className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium opacity-90 truncate whitespace-nowrap">{t(c.labelKey)}</p>
                <p className="mt-1 text-lg sm:text-xl font-bold truncate">{currency(c.value)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{t('reports.totalAmount')}</span>
          <span className="text-lg font-bold text-gray-900">{currency(revenueTotal)}</span>
        </div>
      </section>

      {/* Charts */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('reports.charts')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[264px] shadow-sm">
            <IconChart className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm text-center">{t('reports.appointmentsChartPlaceholder')}</p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[264px] shadow-sm">
            <IconChart className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm text-center">{t('reports.revenueChartPlaceholder')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
