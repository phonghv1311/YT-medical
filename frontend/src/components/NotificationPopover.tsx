import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import type { Notification } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ListRowSkeleton } from './skeletons';

const PREVIEW_LIMIT = 5;

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

function getNotificationIcon(type: string, readAt?: string) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center shrink-0';
  const unread = !readAt ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500';
  switch (type) {
    case 'appointment':
    case 'booking':
      return (
        <span className={`${base} ${unread}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </span>
      );
    case 'reminder':
      return (
        <span className={`${base} ${unread}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </span>
      );
    case 'prescription':
      return (
        <span className={`${base} ${unread}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </span>
      );
    default:
      return (
        <span className={`${base} ${unread}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
      );
  }
}

interface NotificationPopoverProps {
  /** Optional unread count to show on the badge (if known). Popover may fetch and update. */
  initialUnreadCount?: number;
  className?: string;
}

export default function NotificationPopover({ initialUnreadCount, className = '' }: NotificationPopoverProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const badgeCount = initialUnreadCount ?? unreadCount;
  const previewList = notifications.slice(0, PREVIEW_LIMIT);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const ctrl = new AbortController();
    notificationsApi.getAll(undefined, { signal: ctrl.signal })
      .then(({ data }) => {
        const raw = data?.data ?? data;
        const list = raw?.notifications ?? (Array.isArray(raw) ? raw : []);
        setNotifications(Array.isArray(list) ? list : []);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markRead = async (id: number) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        aria-label={t('common.notifications')}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-[min(100vw-2rem,360px)] max-h-[min(70vh,420px)] flex flex-col rounded-xl border border-gray-200 bg-white shadow-xl z-[100] overflow-hidden"
          role="dialog"
          aria-label={t('notifications.title')}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
            <h2 className="text-base font-bold text-gray-900">{t('notifications.title')}</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {t('notifications.markAllAsRead')}
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="p-2 space-y-2">
                {[1, 2, 3].map((i) => (
                  <ListRowSkeleton key={i} avatarSize="sm" lines={2} className="p-3" />
                ))}
              </div>
            ) : previewList.length === 0 ? (
              <div className="py-12 px-4 text-center text-gray-500 text-sm">
                {t('notifications.noNotificationsYet')}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {previewList.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => !n.readAt && markRead(n.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50/80 transition-colors ${n.readAt ? 'bg-white' : 'bg-blue-50/30'}`}
                    >
                      <span className="shrink-0 mt-0.5">{getNotificationIcon(n.type, n.readAt)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${n.readAt ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{n.title}</p>
                        {n.body && <p className="text-xs text-gray-500 truncate mt-0.5">{n.body}</p>}
                        <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                      </div>
                      {!n.readAt && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" aria-hidden />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 shrink-0">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('common.viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
