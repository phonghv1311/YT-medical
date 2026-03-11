import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { DashboardSkeleton } from '../../components/skeletons';

interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalDoctors: 0, totalAppointments: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getUsers({ limit: 1 }, { signal })
      .then(({ data }) => {
        if (signal.aborted) return;
        const payload = data?.data ?? data;
        setStats({
          totalUsers: payload?.total ?? 0,
          totalDoctors: 0,
          totalAppointments: 0,
          revenue: 0,
        });
      })
      .catch((err) => { if (!signal.aborted) console.error('Failed to load admin stats', err); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const cards = [
    { labelKey: 'adminDashboard.totalUsers' as const, value: stats.totalUsers, color: 'bg-blue-50 text-blue-700', icon: '👥' },
    { labelKey: 'adminDashboard.totalDoctors' as const, value: stats.totalDoctors, color: 'bg-green-50 text-green-700', icon: '🩺' },
    { labelKey: 'adminDashboard.totalAppointments' as const, value: stats.totalAppointments, color: 'bg-purple-50 text-purple-700', icon: '📅' },
    { labelKey: 'adminDashboard.revenue' as const, value: `$${stats.revenue.toLocaleString()}`, color: 'bg-amber-50 text-amber-700', icon: '💰' },
  ];

  const quickLinks = [
    { labelKey: 'adminDashboard.manageUsers' as const, href: '/admin/users' },
    { labelKey: 'adminDashboard.manageHospitals' as const, href: '/admin/hospitals' },
    { labelKey: 'adminDashboard.manageDoctors' as const, href: '/admin/doctors' },
    { labelKey: 'adminDashboard.manageEmployees' as const, href: '/admin/employees' },
    { labelKey: 'nav.news' as const, href: '/admin/news' },
    { labelKey: 'adminDashboard.viewReports' as const, href: '/admin/reports' },
    { labelKey: 'adminDashboard.systemLogs' as const, href: '/admin/logs' },
    { labelKey: 'adminDashboard.rolesAndPermissions' as const, href: '/admin/roles' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('adminDashboard.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('adminDashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {cards.map((c) => (
          <div key={c.labelKey} className={`rounded-xl p-4 sm:p-6 min-w-0 ${c.color}`}>
            <div className="flex items-center justify-between gap-2 min-w-0">
              <p className="text-xs sm:text-sm font-medium opacity-75 truncate">{t(c.labelKey)}</p>
              <span className="text-xl sm:text-2xl shrink-0" aria-hidden>{c.icon}</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold truncate">{c.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">{t('adminDashboard.quickLinks')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition text-center min-h-[48px] sm:min-h-[52px]"
            >
              <span className="break-words leading-tight">{t(link.labelKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">{t('adminDashboard.analytics')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 flex items-center justify-center min-h-[200px] sm:min-h-[264px]">
            <p className="text-gray-400 text-sm text-center">{t('adminDashboard.appointmentsChartPlaceholder')}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 flex items-center justify-center min-h-[200px] sm:min-h-[264px]">
            <p className="text-gray-400 text-sm text-center">{t('adminDashboard.revenueChartPlaceholder')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
