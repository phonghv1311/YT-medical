import { useState, useEffect } from 'react';
import { notificationsApi } from '../api/notifications';
import type { Notification } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppSelector } from '../hooks/useAppDispatch';
import { getRole } from '../utils/auth';
import { ListRowSkeleton } from '../components/skeletons';

type TabFilter = 'all' | 'unread';

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

function getNotificationIcon(type: string, readAt?: string) {
  const base = 'w-10 h-10 rounded-full flex items-center justify-center shrink-0';
  const unread = !readAt ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500';
  switch (type) {
    case 'appointment':
    case 'booking':
      return (
        <span className={`${base} ${unread}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </span>
      );
    case 'reminder':
      return (
        <span className={`${base} ${unread}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </span>
      );
    case 'prescription':
      return (
        <span className={`${base} ${unread}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </span>
      );
    default:
      return (
        <span className={`${base} ${unread}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
      );
  }
}

export default function Notifications() {
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const isCustomer = getRole(user) === 'customer';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    notificationsApi.getAll(undefined, { signal: ctrl.signal }).then(({ data }) => {
      if (cancelled.current) return;
      const raw = data?.data ?? data;
      const list = raw?.notifications ?? (Array.isArray(raw) ? raw : []);
      setNotifications(Array.isArray(list) ? list : []);
    }).catch((err) => {
      if (err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') setNotifications([]);
    }).finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  const markRead = async (id: number) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="mt-20 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <ListRowSkeleton key={i} lines={2} avatarSize="sm" />
        ))}
      </div>
    );
  }

  const list = Array.isArray(notifications) ? notifications : [];
  const filtered = tab === 'unread' ? list.filter((n) => !n.readAt) : list;
  const todayItems = filtered.filter((n) => isToday(n.createdAt));
  const earlierItems = filtered.filter((n) => !isToday(n.createdAt));

  const titleKey = isCustomer ? 'customerNotifications.title' : 'notifications.title';
  const markAllReadKey = isCustomer ? 'customerNotifications.markAllRead' : 'notifications.markAllAsRead';
  const sectionLatestKey = isCustomer ? 'customerNotifications.latest' : 'notifications.today';
  const sectionPreviouslyKey = isCustomer ? 'customerNotifications.previously' : 'notifications.earlier';

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{t(titleKey)}</h1>
          {isCustomer ? (
            <button type="button" onClick={markAllRead} className="text-sm font-medium text-blue-600 hover:underline py-2">
              {t(markAllReadKey)}
            </button>
          ) : (
            <div className="relative">
              <button type="button" onClick={() => setMenuOpen((o) => !o)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label="Options">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white border border-gray-200 shadow-lg py-1 z-20">
                    <button type="button" onClick={markAllRead} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t(markAllReadKey)}</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {!isCustomer && (
          <div className="flex gap-1 mt-3">
            <button type="button" onClick={() => setTab('all')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{t('notifications.all')}</button>
            <button type="button" onClick={() => setTab('unread')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tab === 'unread' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{t('notifications.unread')}</button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 px-4">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <p>{t('notifications.noNotificationsYet')}</p>
        </div>
      ) : (
        <div className="px-4 pt-2">
          {/* Today */}
          {todayItems.length > 0 && (
            <section className="mb-4">
              <h2 className="text-sm font-bold text-gray-900 mb-2">{t(sectionLatestKey)}</h2>
              <ul className="space-y-0 divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 overflow-hidden">
                {todayItems.map((n) => (
                  <li key={n.id}>
                    <NotificationRow n={n} onMarkRead={markRead} getIcon={getNotificationIcon} formatTime={formatTimeAgo} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Earlier */}
          {earlierItems.length > 0 && (
            <section className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900">{t(sectionPreviouslyKey)}</h2>
                <span className="text-xs text-blue-600 font-medium">{t('notifications.seeAll')}</span>
              </div>
              <ul className="space-y-0 divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 overflow-hidden">
                {earlierItems.map((n) => (
                  <li key={n.id}>
                    <NotificationRow n={n} onMarkRead={markRead} getIcon={getNotificationIcon} formatTime={formatTimeAgo} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* See previous notifications */}
          <div className="flex justify-center pt-4">
            <button
              type="button"
              className="py-3 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
            >
              {t('notifications.seePrevious')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  n,
  onMarkRead,
  getIcon,
  formatTime,
}: {
  n: Notification;
  onMarkRead: (id: number) => void;
  getIcon: (type: string, readAt?: string) => JSX.Element;
  formatTime: (date: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={() => !n.readAt && onMarkRead(n.id)}
      className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/80 transition-colors ${n.readAt ? 'bg-white' : 'bg-blue-50/30'}`}
    >
      <span className="relative shrink-0">
        {getIcon(n.type, n.readAt)}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${n.readAt ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{n.title}</p>
        {n.body && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
        <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
      </div>
      {!n.readAt && (
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-4" aria-hidden />
      )}
    </button>
  );
}
