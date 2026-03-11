import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { HEALTH_NEWS_ITEMS } from '../../data/healthNews';

export default function HealthNewsArticle() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [followed, setFollowed] = useState(false);
  const article = id ? HEALTH_NEWS_ITEMS.find((a) => a.id === id) : null;
  const articlesPath = location.pathname.startsWith('/doctor') ? '/doctor/articles' : '/customer/articles';

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-48">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <p className="text-gray-600">{t('customer.articleNotFound')}</p>
          <Link to={articlesPath} className="mt-4 text-blue-600 font-medium">{t('common.back')}</Link>
        </div>
        <div className="fixed left-0 right-0 bottom-20 z-50 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <p className="text-center text-xs font-semibold text-gray-500 uppercase mb-3">Emergency Contacts</p>
          <div className="flex gap-3 max-w-lg mx-auto">
            <a href="tel:+18001234567" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 text-white font-medium py-3">
              <span className="text-lg">+</span> Hospital Hotline
            </a>
            <a href="tel:+18005551234" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 text-white font-medium py-3">
              <span className="text-lg">*</span> Local Emergency
            </a>
            <a href="tel:911" className="flex items-center justify-center w-14 rounded-xl bg-gray-800 text-white py-3" aria-label="Call">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-48">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Article Details</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Share">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className={`h-48 ${article.img}`} />
        <div className="px-4 py-4">
          {article.category && (
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold uppercase">
              {article.category}
            </span>
          )}
          {article.updated && <span className="ml-2 text-xs text-gray-500">Updated {article.updated}</span>}
          <h1 className="text-2xl font-bold text-gray-900 mt-3">{article.title}</h1>

          {(article.authorName || article.authorSpecialty) && (
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                {article.authorName?.[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{article.authorName ?? 'Author'}</p>
                {article.authorSpecialty && <p className="text-sm text-gray-500">{article.authorSpecialty}</p>}
                <p className="text-xs text-gray-500">{article.read}</p>
              </div>
              <button
                type="button"
                onClick={() => setFollowed((v) => !v)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${followed ? 'bg-gray-200 text-gray-700' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                {followed ? 'Following' : 'Follow'}
              </button>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {article.content.map((para, i) => (
              <p key={i} className="text-gray-700 leading-relaxed">{para}</p>
            ))}
          </div>

          {article.highlightTitle && article.highlightItems && article.highlightItems.length > 0 && (
            <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="text-green-600">🛡</span> {article.highlightTitle}
              </h3>
              <ul className="mt-3 space-y-2">
                {article.highlightItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 text-sm text-gray-600 leading-relaxed">
            These measures are not a replacement for professional medical advice. Consult with a doctor immediately through our telemedicine platform if needed.
          </p>
        </div>
      </main>

      <div className="fixed left-0 right-0 bottom-20 z-50 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <p className="text-center text-xs font-semibold text-gray-500 uppercase mb-3">Emergency Contacts</p>
        <div className="flex gap-3 max-w-lg mx-auto">
          <a href="tel:+18001234567" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 text-white font-medium py-3">
            <span className="text-lg">+</span> Hospital Hotline
          </a>
          <a href="tel:+18005551234" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 text-white font-medium py-3">
            <span className="text-lg">*</span> Local Emergency
          </a>
          <a href="tel:911" className="flex items-center justify-center w-14 rounded-xl bg-gray-800 text-white py-3" aria-label="Call">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
