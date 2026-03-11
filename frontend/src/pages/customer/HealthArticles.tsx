import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { HEALTH_NEWS_ITEMS, type HealthNewsItem, type ArticleCategory } from '../../data/healthNews';

const CATEGORIES: { key: ArticleCategory | 'ALL'; label: string; icon?: 'cutlery' | 'brain' | 'shield' }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'NUTRITION', label: 'Nutrition', icon: 'cutlery' },
  { key: 'MENTAL HEALTH', label: 'Mental Health', icon: 'brain' },
  { key: 'PREVENTION', label: 'Prevention', icon: 'shield' },
  { key: 'LIFESTYLE', label: 'Lifestyle' },
  { key: 'HEALTH TIPS', label: 'Health Tips' },
];

export default function HealthArticles() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const newsBase = location.pathname.startsWith('/doctor') ? '/doctor/news' : '/customer/news';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ArticleCategory | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    let list = HEALTH_NEWS_ITEMS;
    if (category !== 'ALL') {
      list = list.filter((a) => a.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || (a.category ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [category, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Health Articles</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Bookmark">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
        </button>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 py-4">
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="search"
            placeholder="Search health topics, symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${category === c.key ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {c.icon === 'cutlery' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              )}
              {c.icon === 'brain' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              )}
              {c.icon === 'shield' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              )}
              {c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-12">{t('customer.articleNotFound')}</p>
        ) : (
          <div className="mt-6 space-y-6">
            {featured && (
              <Link
                to={`${newsBase}/${featured.id}`}
                className="block rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="p-4 pb-0">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase text-blue-600 bg-blue-50">
                    {(featured.category ?? 'ARTICLE').replace(/\s+/g, ' ')}
                  </span>
                </div>
                <div className={`h-48 mx-4 rounded-t-xl ${featured.img}`} />
                <div className="p-4">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{featured.title}</h2>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {featured.read} • {featured.date}
                  </p>
                </div>
              </Link>
            )}

            <div className="space-y-4">
              {rest.map((article) => (
                <ArticleCard key={article.id} article={article} newsBase={newsBase} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, newsBase }: { article: HealthNewsItem; newsBase: string }) {
  return (
    <Link
      to={`${newsBase}/${article.id}`}
      className="flex gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition"
    >
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-blue-600 uppercase">{(article.category ?? 'ARTICLE').replace(/\s+/g, ' ')}</span>
        <h3 className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-2">{article.title}</h3>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {article.read} • {article.date}
        </p>
      </div>
      <div className={`w-20 h-20 shrink-0 rounded-lg overflow-hidden ${article.img}`} />
    </Link>
  );
}
