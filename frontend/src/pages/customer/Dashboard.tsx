import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import { appointmentsApi } from '../../api/appointments';
import { adminApi } from '../../api/admin';
import { HEALTH_NEWS_ITEMS, type HealthNewsItem } from '../../data/healthNews';
import type { Appointment } from '../../types';
import { DashboardSkeleton } from '../../components/skeletons';

export default function CustomerDashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const routeState = location.state as { message?: string; isError?: boolean } | null;
  const message = routeState?.message;
  const isError = routeState?.isError;
  const [hospitals, setHospitals] = useState<{ id: number; name: string; address?: string; phone?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsAlert, setNewsAlert] = useState<HealthNewsItem | null>(null);
  const upcomingCount = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status)).length;

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    const cancelled = { current: false };
    Promise.all([
      appointmentsApi.getAll({ limit: 5 }, { signal }).then((r) => {
        if (!cancelled.current) setAppointments((r.data?.data?.appointments ?? r.data?.appointments ?? r.data) || []);
      }),
      adminApi.getHospitals({ signal }).then((r) => {
        if (!cancelled.current) setHospitals((r.data?.data ?? r.data) || []);
      }).catch(() => { if (!cancelled.current) setHospitals([]); }),
    ]).finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  const displayName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'there';

  if (loading) return <DashboardSkeleton />;

  const clearMessage = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3 ${isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
            }`}
        >
          <span className="flex items-center gap-2">
            {isError ? (
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
            {message}
          </span>
          <button type="button" onClick={clearMessage} className="p-1 rounded hover:opacity-70" aria-label={t('common.dismiss')}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{t('customer.welcomeBack')} <span className="font-extrabold">{displayName}</span></h1>
          </div>
        </div>
      </div>

      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          const value = (e.currentTarget.elements.namedItem('search') as HTMLInputElement)?.value?.trim();
          if (value) navigate(`/customer/search?q=${encodeURIComponent(value)}`);
        }}
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          name="search"
          type="search"
          placeholder={t('customer.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </form>

      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900">{t('customer.healthTrends')}</h2>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{t('common.live')}</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">{t('customer.heartRateTracking')}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">72</span>
          <span className="text-gray-500">BPM</span>
          <span className="text-green-600 text-sm font-medium flex items-center gap-0.5">↑ 2%</span>
        </div>
        <div className="h-20 mt-4 flex items-end gap-1">
          {[40, 65, 55, 72, 68, 75, 72].map((v, i) => (
            <div key={i} className="flex-1 bg-blue-100 rounded-t" style={{ height: `${(v / 80) * 100}%` }} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Mon Tue Wed Thu Fri Sat Sun</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">{t('customer.upcomingAppointments')}</h2>
          <Link to="/customer/appointments" className="text-sm font-medium text-blue-600">{t('common.viewAll')}</Link>
        </div>
        {upcomingCount === 0 ? (
          <p className="text-sm text-gray-500 py-2">{t('customer.noAppointments')}</p>
        ) : (
          <p className="text-sm text-gray-600 py-2">{upcomingCount} {t('customer.upcomingAppointments').toLowerCase()}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">{t('customer.healthNews')}</h2>
          <Link to="/customer/articles" className="text-sm font-medium text-blue-600 hover:underline">{t('common.viewAll')}</Link>
        </div>
        <div
          className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {HEALTH_NEWS_ITEMS.map((n) => (
            <div
              key={n.id}
              className="min-w-[220px] shrink-0 snap-start rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
            >
              <div className={`h-24 ${n.img}`} />
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{n.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{n.date} • {n.read}</p>
                <button
                  type="button"
                  onClick={() => setNewsAlert(n)}
                  className="mt-3 w-full rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700 transition"
                >
                  {t('common.alert')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card-style alert modal for health news */}
      {newsAlert && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setNewsAlert(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-alert-title"
        >
          <div
            className="rounded-2xl bg-white border border-gray-100 shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-32 shrink-0 ${newsAlert.img}`} />
            <div className="p-5 flex-1 overflow-y-auto">
              <h2 id="news-alert-title" className="text-lg font-bold text-gray-900">{newsAlert.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{newsAlert.date} • {newsAlert.read}</p>
              <div className="mt-4 space-y-3">
                {newsAlert.content.map((para, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">{para}</p>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setNewsAlert(null)}
                className="w-full rounded-xl bg-blue-600 text-white font-medium py-2.5 hover:bg-blue-700 transition"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">{t('customer.nearbyHospitals')}</h2>
          <Link to="/customer/hospitals" className="text-sm font-medium text-blue-600">{t('common.viewAll')}</Link>
        </div>
        <div className="space-y-3">
          {hospitals.slice(0, 2).map((h) => (
            <div key={h.id} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm flex gap-3 sm:gap-4 hover:shadow-md transition">
              <Link to={`/customer/hospitals/${h.id}`} className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{h.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                    <span>•</span> {h.address || t('common.address')}
                  </p>
                </div>
              </Link>
              <div className="flex flex-wrap gap-2 items-center shrink-0">
                <a href={`tel:${(h.phone || '').replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {t('common.hotline')}
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((h.address || '').replace(/\s+/g, '+'))}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg border border-gray-200 text-gray-600" aria-label={t('customer.openInMaps')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
