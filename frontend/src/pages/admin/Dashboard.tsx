import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { getRole } from '../../utils/auth';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import { reportsApi, type SuperadminDashboardResponse } from '../../api/reports';
import { DashboardSkeleton } from '../../components/skeletons';

interface AdminStats {
  totalDoctors: number;
  totalPatients: number;
  appointmentsToday: number;
  newsCount: number;
}

type SuperadminDashboard = SuperadminDashboardResponse;

interface ActivityItem {
  id: string;
  actorName: string;
  targetLabel: string;
  action: string;
  reasonText: string;
  dateTime: string;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const role = getRole(user);
  const isSuperadmin = role === 'superadmin';
  // `tab` state removed: this dashboard now uses static cards only.
  const [stats, setStats] = useState<AdminStats>({ totalDoctors: 0, totalPatients: 0, appointmentsToday: 0, newsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [superadminDash, setSuperadminDash] = useState<SuperadminDashboard | null>(null);

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      adminApi.getUsers({ limit: 1 }, { signal }),
      doctorsApi.getAll({ limit: 1 }, { signal }).catch(() => ({ data: {} })),
      (role === 'admin' || role === 'superadmin') ? appointmentsApi.getAll({ dateFrom: today, dateTo: today, limit: 1 }, { signal }).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
      adminApi.getLogs({ limit: 10 }, { signal }).catch(() => ({ data: {} })),
      isSuperadmin ? reportsApi.getSuperadminDashboard({ signal }).catch(() => ({ data: null as any })) : Promise.resolve({ data: null as any }),
    ])
      .then(([usersRes, doctorsRes, appointmentsRes, logsRes, superadminRes]) => {
        if (signal.aborted) return;
        const usersPayload = usersRes.data?.data ?? usersRes.data;
        const totalUsers = typeof usersPayload?.total === 'number' ? usersPayload.total : (Array.isArray(usersPayload) ? usersPayload.length : 0);
        const docPayload = (doctorsRes as { data?: { doctors?: unknown[]; total?: number } })?.data;
        const totalDoctors = typeof docPayload?.total === 'number' ? docPayload.total : (Array.isArray(docPayload?.doctors) ? docPayload.doctors.length : 0);
        const appPayload = (appointmentsRes as { data?: { total?: number } })?.data;
        const appointmentsToday = typeof appPayload?.total === 'number' ? appPayload.total : 0;
        setStats({
          totalDoctors: totalDoctors || 0,
          totalPatients: totalUsers || 0,
          appointmentsToday,
          newsCount: 0,
        });
        const logsPayload = logsRes.data?.data ?? logsRes.data;
        type LogRow = {
          id: number;
          userId?: number | null;
          action: string;
          resource?: string;
          resourceId?: number | null;
          details?: string | null;
          reason?: string | null;
          createdAt: string;
          user?: { firstName?: string; lastName?: string };
        };
        const logs = (logsPayload as { logs?: LogRow[] })?.logs ?? [];
        function parseReason(log: LogRow): string {
          if (log.reason && String(log.reason).trim()) return String(log.reason).trim();
          if (log.details) {
            try {
              const o = JSON.parse(log.details as string) as { reason?: string };
              if (o?.reason != null) return String(o.reason).trim();
            } catch {
              // ignore
            }
          }
          return log.action || '—';
        }
        function resourceLabel(resource?: string): string {
          const r = (resource || '').toLowerCase();
          if (r === 'user') return t('adminDashboard.resourceUser');
          if (r === 'hospital') return t('adminDashboard.resourceHospital');
          return resource || '—';
        }
        setRecentActivities(
          logs.slice(0, 10).map((log) => {
            const actorName = log.user ? [log.user.firstName, log.user.lastName].filter(Boolean).join(' ') || '—' : (log.userId != null ? `User #${log.userId}` : '—');
            const resLabel = resourceLabel(log.resource);
            const targetLabel = log.resourceId != null ? `${resLabel} #${log.resourceId}` : resLabel;
            const reasonText = parseReason(log);
            const dateTime = log.createdAt ? new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
            return {
              id: String(log.id),
              actorName,
              targetLabel,
              action: log.action,
              reasonText,
              dateTime,
            };
          }),
        );
        if (isSuperadmin && superadminRes?.data) setSuperadminDash(superadminRes.data as SuperadminDashboard);
      })
      .catch(() => { })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [role, t, isSuperadmin]);

  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  if (loading) return <DashboardSkeleton />;

  function StatCard({ label, value, changePct, icon, accent }: { label: string; value: number; changePct: number; icon: React.ReactNode; accent: string }) {
    const up = changePct >= 0;
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>{icon}</span>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 truncate">{label}</p>
            </div>
          </div>
          <div className={`shrink-0 px-2 py-1 rounded-lg text-xs font-semibold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {up ? '+' : ''}{changePct}%
          </div>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">MoM change (this month vs last month)</p>
      </div>
    );
  }

  function SparkBars({ series }: { series: Array<{ date: string; value: number }> }) {
    const values = series.map((s) => s.value);
    const max = Math.max(1, ...values);
    return (
      <div className="flex items-end gap-1 h-20">
        {series.slice(-14).map((s) => (
          <div
            key={s.date}
            className="flex-1 rounded bg-blue-200/70"
            style={{ height: `${Math.max(4, Math.round((s.value / max) * 100))}%` }}
            title={`${s.date}: ${s.value}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-5">
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">{t('adminDashboard.management')}</h2>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white p-4">
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/admin/users"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition"
              >
                <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('nav.users')}</span>
              </Link>

              <Link
                to="/admin/hospitals"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition"
              >
                <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('nav.hospitals')}</span>
              </Link>

              {(role === 'admin' || role === 'superadmin') && (
                <Link
                  to="/admin/roles"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition"
                >
                  <span className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </span>
                  <span className="font-medium text-gray-900">{t('nav.roles')}</span>
                </Link>
              )}

              <Link
                to="/admin/schedule"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition"
              >
                <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('nav.schedule')}</span>
              </Link>

              <Link
                to="/admin/news"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition"
              >
                <span className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('nav.news')}</span>
              </Link>

              <Link
                to="/admin/approvals?tab=profiles"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition"
              >
                <span className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('adminApprovals.tabProfiles')}</span>
              </Link>

              <Link
                to="/admin/approvals?tab=doctors"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition"
              >
                <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-8 0c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zm0 2c-2.761 0-5 2.239-5 5v1h10v-1c0-2.761-2.239-5-5-5zm8 0c-1.087 0-2.072.35-2.878.94 1.188 1.05 1.878 2.566 1.878 4.06v1h10v-1c0-2.761-2.239-5-5-5z" /></svg>
                </span>
                <span className="font-medium text-gray-900">
                  {t('adminApprovals.tabDoctors')}
                  {' / '}
                  {t('adminApprovals.tabStaff')}
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Superadmin: thẻ tổng Bác sĩ, Bệnh nhân, Bệnh viện, Nhân viên, Admin, Lịch hẹn hôm nay */}
        {isSuperadmin && superadminDash ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label={t('adminDashboard.totalDoctors')}
                value={superadminDash.metrics.doctors.total}
                changePct={superadminDash.metrics.doctors.changePct}
                accent="bg-blue-100 text-blue-600"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />
              <StatCard
                label={t('adminDashboard.totalPatients')}
                value={superadminDash.metrics.patients.total}
                changePct={superadminDash.metrics.patients.changePct}
                accent="bg-emerald-100 text-emerald-600"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              />
              <StatCard
                label={t('adminDashboard.totalHospitals')}
                value={superadminDash.metrics.hospitals.total}
                changePct={superadminDash.metrics.hospitals.changePct}
                accent="bg-teal-100 text-teal-700"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              />
              <StatCard
                label={t('adminDashboard.totalStaff')}
                value={superadminDash.metrics.staff.total}
                changePct={superadminDash.metrics.staff.changePct}
                accent="bg-violet-100 text-violet-600"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.343 3-3 3S6 12.657 6 11s1.343-3 3-3 3 1.343 3 3zm6 0c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM4 20v-1a6 6 0 0112 0v1M2 20v-1a5 5 0 019-4.584M22 20v-1a5 5 0 00-9-4.584" /></svg>}
              />
              <StatCard
                label="Admin"
                value={superadminDash.metrics.admins.total}
                changePct={superadminDash.metrics.admins.changePct}
                accent="bg-amber-100 text-amber-600"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" /></svg>}
              />
              <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
                    <p className="text-xs text-gray-500">{t('adminDashboard.appointmentsToday')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Báo cáo: chart dòng tiền + cơ cấu doanh thu */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-gray-900">{t('nav.reports')}</h2>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Dòng tiền tháng này</h3>
                <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${superadminDash.cashflow.changePct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {superadminDash.cashflow.changePct >= 0 ? '+' : ''}{superadminDash.cashflow.changePct}%
                </div>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(superadminDash.cashflow.revenueThisMonth)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Last month: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(superadminDash.cashflow.revenueLastMonth)}
                  </p>
                </div>
                <div className="mt-4">
                  <SparkBars series={superadminDash.cashflow.dailySeries} />
                  <p className="mt-2 text-[11px] text-gray-400">Last 14 days (completed tx, refunds negative)</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-gray-900">Cơ cấu doanh thu (tháng này)</h2>
              <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                {Object.keys(superadminDash.cashflow.revenueByType).length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có giao dịch.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(superadminDash.cashflow.revenueByType).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-gray-700">{k}</span>
                        <span className="font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </span>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">{t('adminDashboard.totalDoctors')}</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">{t('adminDashboard.totalPatients')}</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </span>
                <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">{t('adminDashboard.appointmentsToday')}</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </span>
                <p className="text-2xl font-bold text-gray-900">{stats.newsCount}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">{t('adminDashboard.newsCount')}</p>
            </div>
          </div>
        )}

        {/* Remove schedule-by-day section for superadmin per request */}
        {!isSuperadmin && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">{t('adminDashboard.scheduleByDay')}</h2>
              <button type="button" className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium">
                {t('adminDashboard.thisWeek')}
              </button>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-4 min-h-[120px] flex flex-col justify-end">
              <div className="flex justify-between mt-4 text-xs text-gray-400">
                {dayLabels.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">{t('adminDashboard.recentActivity')}</h2>
            <Link to="/admin/logs" className="text-sm font-medium text-blue-600 hover:underline">{t('adminDashboard.viewAll')}</Link>
          </div>
          <div className="space-y-3">
            {recentActivities.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-white border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <p className="text-gray-700"><span className="font-medium text-gray-500">{t('adminDashboard.logWhoDid')}:</span> <span className="text-gray-900">{item.actorName}</span></p>
                  <p className="text-gray-700"><span className="font-medium text-gray-500">{t('adminDashboard.logTarget')}:</span> <span className="text-gray-900">{item.targetLabel}</span></p>
                  <p className="text-gray-700"><span className="font-medium text-gray-500">{t('adminDashboard.logReason')}:</span> <span className="text-gray-900">{item.reasonText}</span></p>
                  <p className="text-gray-700"><span className="font-medium text-gray-500">{t('adminDashboard.logTime')}:</span> <span className="text-gray-900">{item.dateTime}</span></p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
