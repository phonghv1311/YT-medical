import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { conversationsApi } from '../../api/conversations';

interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
}

function normalizeChat(item: unknown): ChatPreview {
  const c = item as Record<string, unknown>;
  const id = c?.id != null ? String(c.id) : '';
  const name = (c?.name as string) ?? (c?.doctorName as string) ?? (c?.participantName as string) ?? '—';
  const lastMessage = (c?.lastMessage as string) ?? (c?.lastMessageText as string) ?? '';
  const rawDate = (c?.updatedAt ?? c?.lastMessageAt) as string | undefined;
  const time = rawDate
    ? (() => {
      try {
        const d = new Date(rawDate);
        if (Number.isNaN(d.getTime())) return rawDate;
        const now = new Date();
        const today = now.toDateString();
        if (d.toDateString() === today) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const diff = (now.getTime() - d.getTime()) / 86400000;
        if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      } catch {
        return rawDate;
      }
    })()
    : '—';
  const unread = typeof c?.unreadCount === 'number' ? c.unreadCount : (c?.unread as number) ?? 0;
  const online = Boolean(c?.online);
  return { id, name, lastMessage, time, unread: unread || undefined, online: online || undefined };
}

export default function CustomerMessages() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    conversationsApi.getList({ signal: ctrl.signal })
      .then((res) => {
        if (cancelled) return;
        const raw = (res.data as unknown[]) ?? [];
        setChats(Array.isArray(raw) ? raw.map(normalizeChat) : []);
      })
      .catch(() => { if (!cancelled) setChats([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <button type="button" className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label={t('common.menu')}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">{t('customerMessages.title')}</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label={t('common.search')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="text"
            placeholder={t('customerMessages.searchDoctorsOrConversations')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-center text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500">{t('customerMessages.noConversations') ?? 'No conversations yet.'}</div>
      ) : (
        <ul className="px-4 divide-y divide-gray-100">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                to={`/customer/messages/${c.id}`}
                className="flex items-center gap-3 py-4 hover:bg-gray-50 active:bg-gray-100 transition"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    {c.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                  </div>
                  {c.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-sm text-gray-500 truncate">{c.lastMessage}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-400">{c.time}</span>
                  {c.unread != null && c.unread > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
