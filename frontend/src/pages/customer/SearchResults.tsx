import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { searchApi, type SearchResult, type SearchArticle } from '../../api/search';
import type { Doctor } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { DoctorCardSkeleton, ListRowSkeleton } from '../../components/skeletons';

type Tab = 'all' | 'doctors' | 'hospitals' | 'articles';

function getDoctorName(d: Doctor): string {
  return d.user ? `Dr. ${d.user.firstName} ${d.user.lastName}` : 'Doctor';
}

function StarRating({ rating }: { rating: number }) {
  const r = Number(rating) || 0;
  return (
    <span className="flex items-center gap-0.5 text-amber-600 font-medium">
      ★ {(r).toFixed(1)}
    </span>
  );
}

export default function SearchResults() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(q);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const { data } = await searchApi.search(term, { doctorsLimit: 20, hospitalsLimit: 20 });
      setResult(data);
    } catch {
      setResult({ doctors: [], hospitals: [], articles: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInputValue(q);
    runSearch(q);
  }, [q, runSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = inputValue.trim();
    if (term) setSearchParams({ q: term });
    else setSearchParams({});
  };

  const doctors = result?.doctors ?? [];
  const hospitals = result?.hospitals ?? [];
  const articles = result?.articles ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 h-14 px-4">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">{t('search.searchResults')}</h1>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="More">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
          </button>
        </div>
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="search"
              placeholder={t('search.searchPlaceholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500" aria-label="Filter">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </button>
          </div>
        </form>
      </header>

      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'doctors', 'hospitals', 'articles'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium capitalize ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {tab === 'all' ? t('search.all') : t(`search.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-6">
        {loading ? (
          <div className="space-y-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <ListRowSkeleton key={i} lines={3} />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : !q.trim() ? (
          <p className="text-gray-500 text-center py-12">{t('search.enterSearchTerm')}</p>
        ) : (
          <>
            {(activeTab === 'all' || activeTab === 'doctors') && doctors.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">{t('search.doctors')}</h2>
                  <Link to={`/doctors?q=${encodeURIComponent(q)}`} className="text-sm text-blue-600 font-medium">{t('search.viewAll')}</Link>
                </div>
                <div className="space-y-3">
                  {doctors.map((d) => (
                    <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                        {d.user?.firstName?.[0]}{d.user?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{getDoctorName(d)}</p>
                        <p className="text-sm text-blue-600">{d.specializations?.[0]?.name ?? 'General'} • Clinic</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">📍 2.5 {t('search.kmAway')}</p>
                      </div>
                      <div className="shrink-0">
                        <StarRating rating={(d as Doctor & { averageRating?: number }).averageRating ?? 0} />
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Link to={`/doctors/${d.id}`} className="px-3 py-1.5 rounded-lg border border-blue-500 text-blue-600 text-sm font-medium text-center">{t('search.details')}</Link>
                        <Link to={`/customer/booking/${d.id}`} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium text-center">{t('search.book')}</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'hospitals') && hospitals.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">{t('search.hospitals')}</h2>
                  <Link to="/customer/hospitals" className="text-sm text-blue-600 font-medium">{t('search.viewAll')}</Link>
                </div>
                <div className="space-y-3">
                  {hospitals.map((h) => (
                    <Link key={h.id} to={`/customer/hospitals/${h.id}`} className="block rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
                      <div className="h-24 bg-teal-100" />
                      <div className="p-4">
                        <p className="font-semibold text-gray-900">{h.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">📍 {h.address}</p>
                        <p className="text-xs text-green-600 mt-1">{t('search.open247')}</p>
                        <p className="text-sm text-amber-600 mt-1">★ 4.7</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'articles') && articles.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">{t('search.relatedArticles')}</h2>
                  <span className="text-sm text-blue-600 font-medium">{t('search.readMore')}</span>
                </div>
                <div className="space-y-3">
                  {articles.map((a: SearchArticle) => (
                    <div key={a.id} className="flex gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                      <div className="w-20 h-20 rounded-lg bg-blue-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-blue-600">{a.category}</span>
                        <p className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-2">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.excerpt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!loading && q.trim() && doctors.length === 0 && hospitals.length === 0 && articles.length === 0 && (
              <p className="text-gray-500 text-center py-12">{t('search.noResults').replace('{query}', q)}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
