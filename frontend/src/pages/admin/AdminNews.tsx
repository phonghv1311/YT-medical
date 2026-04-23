import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { newsApi } from '../../api/news';
import type { HealthNewsItem, ArticleCategory } from '../../data/healthNews';

const CATEGORIES: { key: ArticleCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'NUTRITION', label: 'Nutrition' },
  { key: 'MENTAL HEALTH', label: 'Mental Health' },
  { key: 'PREVENTION', label: 'Prevention' },
  { key: 'LIFESTYLE', label: 'Lifestyle' },
  { key: 'HEALTH TIPS', label: 'Health Tips' },
];

const EMPTY_ARTICLE: Omit<HealthNewsItem, 'id'> = {
  title: '',
  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  read: '5 min read',
  img: 'bg-gray-100',
  content: [],
  category: 'NUTRITION',
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'article';
}

function normalizeNewsItems(raw: unknown): HealthNewsItem[] {
  const arr = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
  return arr.map((item: Record<string, unknown>, i: number) => ({
    id: String(item.id ?? i),
    title: String(item.title ?? ''),
    date: String(item.date ?? item.createdAt ?? ''),
    read: String(item.read ?? '5 min read'),
    img: String(item.img ?? item.image ?? 'bg-gray-100'),
    content: Array.isArray(item.content) ? item.content as string[] : [],
    category: (item.category as ArticleCategory) ?? 'NUTRITION',
    authorName: item.authorName != null ? String(item.authorName) : undefined,
    authorSpecialty: item.authorSpecialty != null ? String(item.authorSpecialty) : undefined,
  }));
}

export default function AdminNews() {
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const [articles, setArticles] = useState<HealthNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ArticleCategory | 'ALL'>('ALL');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: HealthNewsItem } | null>(null);
  const [form, setForm] = useState({ ...EMPTY_ARTICLE, id: '' });

  useEffect(() => {
    const ctrl = new AbortController();
    newsApi
      .getList({ signal: ctrl.signal })
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? [];
        if (!ctrl.signal.aborted) setArticles(normalizeNewsItems(raw));
      })
      .catch(() => { if (!ctrl.signal.aborted) setArticles([]); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  const filtered = useMemo(() => {
    let list = articles;
    if (category !== 'ALL') list = list.filter((a) => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || (a.category ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [articles, category, search]);

  function openAdd() {
    setForm({
      ...EMPTY_ARTICLE,
      id: '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
    setModal({ mode: 'add' });
  }

  function openEdit(item: HealthNewsItem) {
    setForm({
      id: item.id,
      title: item.title,
      date: item.date,
      read: item.read,
      img: item.img,
      content: [...(item.content || [])],
      category: item.category ?? 'NUTRITION',
      authorName: item.authorName,
      authorSpecialty: item.authorSpecialty,
    });
    setModal({ mode: 'edit', item });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const content = form.content.filter(Boolean);
    if (!form.title.trim()) return;
    const id = form.id || slugify(form.title) + '-' + Date.now();
    const next: HealthNewsItem = {
      id,
      title: form.title.trim(),
      date: form.date,
      read: form.read,
      img: form.img,
      content,
      category: form.category,
      authorName: form.authorName,
      authorSpecialty: form.authorSpecialty,
    };
    if (modal?.mode === 'add') {
      setArticles((prev) => [next, ...prev]);
    } else if (modal?.item) {
      setArticles((prev) => prev.map((a) => (a.id === modal.item!.id ? next : a)));
    }
    setModal(null);
  }

  async function handleDelete(item: HealthNewsItem) {
    const ok = await confirm({
      title: t('newsManagement.deleteArticle'),
      message: t('newsManagement.deleteConfirm'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (ok) setArticles((prev) => prev.filter((a) => a.id !== item.id));
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <button type="button" onClick={() => window.history.back()} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">{t('newsManagement.title')}</h1>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="More">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input type="search" placeholder={t('newsManagement.searchNews')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button type="button" onClick={() => setCategory('ALL')} className={`shrink-0 px-4 py-2 text-sm font-medium transition ${category === 'ALL' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}>
            {t('newsManagement.allPublished')} ({articles.length})
          </button>
          <button type="button" className="shrink-0 px-4 py-2 text-sm font-medium text-gray-500">
            {t('newsManagement.published')}
          </button>
          <button type="button" className="shrink-0 px-4 py-2 text-sm font-medium text-gray-500">
            {t('newsManagement.draft')}
          </button>
        </div>

        <div className="flex justify-center py-2">
          <button type="button" className="p-2 rounded-full hover:bg-gray-100" aria-label="Refresh">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 py-12 text-center">{t('common.loading')}</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">{t('newsManagement.noArticles')}</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((article) => (
              <div key={article.id} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                <div className="relative">
                  <div className={`h-40 ${article.img}`} />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold text-white bg-green-600">
                    {t('newsManagement.published')}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="font-bold text-gray-900 line-clamp-2">{article.title}</h2>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{(article.content ?? [])[0] ?? ''}</p>
                  <p className="text-xs text-gray-400 mt-2">{t('newsManagement.postedDate')} {article.date}</p>
                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="View">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button type="button" onClick={() => openEdit(article)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label={t('common.edit')}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button type="button" onClick={() => handleDelete(article)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" aria-label={t('common.delete')}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={openAdd} className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 z-30" aria-label={t('newsManagement.addArticle')}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <button type="button" onClick={() => setModal(null)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {modal.mode === 'add' ? t('newsManagement.writeNew') : t('newsManagement.editArticle')}
                  </h3>
                  <button type="button" className="px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium">{t('newsManagement.preview')}</button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.titleLabel')}</label>
                    <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t('newsManagement.newsTitlePlaceholder')} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.coverImage')}</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-gray-50">
                      <span className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                      </span>
                      <p className="text-sm font-medium text-gray-700">{t('newsManagement.uploadImage')}</p>
                      <p className="text-xs text-gray-500">{t('newsManagement.ratio16_9')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.category')}</label>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ArticleCategory }))} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm">
                      <option value="">{t('newsManagement.selectCategory')}</option>
                      {CATEGORIES.filter((c) => c.key !== 'ALL').map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.content')}</label>
                    <textarea value={form.content.join('\n\n')} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value.split(/\n\n+/).filter(Boolean) }))} rows={6} placeholder={t('newsManagement.startWritingContent')} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm" />
                  </div>
                  <div className="flex items-center justify-between py-2 rounded-xl bg-gray-50 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{t('newsManagement.articleStatus')}</p>
                      <p className="text-sm text-gray-500">{t('newsManagement.postNowForAll')}</p>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">{t('newsManagement.postNow')}</span>
                    <span className="w-12 h-7 rounded-full bg-blue-600" />
                  </div>
                  <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
                    {t('newsManagement.saveArticle')}
                  </button>
                  {modal.mode === 'edit' && modal.item && (
                    <button type="button" onClick={() => { handleDelete(modal.item!); setModal(null); }} className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {t('newsManagement.deleteNews')}
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
