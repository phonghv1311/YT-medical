import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { HEALTH_NEWS_ITEMS, type HealthNewsItem, type ArticleCategory } from '../../data/healthNews';

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

export default function AdminNews() {
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const [articles, setArticles] = useState<HealthNewsItem[]>(() => [...HEALTH_NEWS_ITEMS]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ArticleCategory | 'ALL'>('ALL');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: HealthNewsItem } | null>(null);
  const [form, setForm] = useState({ ...EMPTY_ARTICLE, id: '' });

  const filtered = useMemo(() => {
    let list = articles;
    if (category !== 'ALL') list = list.filter((a) => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || (a.category ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [articles, category, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

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
      <div className="max-w-lg md:max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('newsManagement.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('newsManagement.subtitle')}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="search"
              placeholder={t('newsManagement.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button type="button" onClick={openAdd} className="shrink-0 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium flex items-center gap-2 hover:bg-blue-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('newsManagement.addArticle')}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${category === c.key ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {c.key === 'ALL' ? t('newsManagement.showAll') : c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">{t('newsManagement.noArticles')}</p>
        ) : (
          <div className="space-y-6">
            {featured && (
              <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-4 pb-0 flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase text-blue-600 bg-blue-50">
                    {(featured.category ?? 'ARTICLE').replace(/\s+/g, ' ')}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEdit(featured)} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" aria-label={t('common.edit')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => handleDelete(featured)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" aria-label={t('common.delete')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <div className={`h-48 mx-4 rounded-t-xl ${featured.img}`} />
                <div className="p-4">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{featured.title}</h2>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {featured.read} • {featured.date}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {rest.map((article) => (
                <div
                  key={article.id}
                  className="flex gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-blue-600 uppercase">{(article.category ?? 'ARTICLE').replace(/\s+/g, ' ')}</span>
                    <h3 className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-2">{article.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      {article.read} • {article.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => openEdit(article)} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" aria-label={t('common.edit')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => handleDelete(article)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" aria-label={t('common.delete')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div className={`w-20 h-20 shrink-0 rounded-lg overflow-hidden ${article.img}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {modal.mode === 'add' ? t('newsManagement.addArticle') : t('newsManagement.editArticle')}
                </h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.titleLabel')}</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.category')}</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ArticleCategory }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {CATEGORIES.filter((c) => c.key !== 'ALL').map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.date')}</label>
                      <input
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.readTime')}</label>
                      <input
                        value={form.read}
                        onChange={(e) => setForm((f) => ({ ...f, read: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.content')} (one paragraph per line)</label>
                    <textarea
                      value={form.content.join('\n\n')}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value.split(/\n\n+/).filter(Boolean) }))}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">{t('common.save')}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
