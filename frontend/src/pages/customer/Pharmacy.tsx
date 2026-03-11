import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProductCardSkeleton } from '../../components/skeletons';

const CATEGORIES = [
  { id: 'prescription', labelKey: 'pharmacy.prescription' as const, icon: 'clipboard' },
  { id: 'otc', labelKey: 'pharmacy.otc' as const, icon: 'pill' },
  { id: 'wellness', labelKey: 'pharmacy.wellness' as const, icon: 'heart' },
  { id: 'personal', labelKey: 'pharmacy.personalCare' as const, icon: 'face' },
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Multivitamin Complex A-Z', size: '60 Capsules', price: 18.5, fav: false, inCart: 0 },
  { id: 2, name: 'Hydrating Body Lotion', size: '200 ml', price: 12, fav: true, inCart: 0 },
  { id: 3, name: 'First Aid Antiseptic', size: '100 ml', price: 8.75, fav: false, inCart: 0 },
  { id: 4, name: 'Daily Nasal Spray', size: '20 ml', price: 15.9, fav: false, inCart: 2 },
];

function CategoryIcon({ icon }: { icon: string }) {
  const cls = 'w-6 h-6 text-sky-600';
  if (icon === 'clipboard') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    );
  }
  if (icon === 'pill') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    );
  }
  if (icon === 'heart') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export default function Pharmacy() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(2);
  const [products, setProducts] = useState<typeof MOCK_PRODUCTS>([]);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const toggleFav = (id: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, fav: !p.fav } : p)));
  };

  const addToCart = (id: number) => {
    setAddingId(id);
    setTimeout(() => {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, inCart: p.inCart + 1 } : p)));
      setCartCount((c) => c + 1);
      setAddingId(null);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4 safe-area-pt">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full interactive-btn hover:bg-gray-100"
          aria-label={t('common.back')}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('pharmacy.title')}</h1>
        <Link
          to="/customer/pharmacy/cart"
          className="relative p-2 rounded-full interactive-btn hover:bg-gray-100"
          aria-label="Cart"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="search"
            placeholder={t('pharmacy.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
        </div>

        <div>
          <h2 className="font-bold text-gray-900 mb-3">{t('pharmacy.categories')}</h2>
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="flex flex-col items-center gap-2 interactive-card rounded-2xl p-3 bg-white border border-gray-100 hover:border-sky-200 hover:shadow-sm"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-sky-50 flex items-center justify-center">
                  <CategoryIcon icon={c.icon} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{t(c.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white relative overflow-hidden interactive-card shadow-lg">
          <p className="text-xs font-medium opacity-90 uppercase tracking-wide">{t('pharmacy.limitedOffer')}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{t('pharmacy.offBanner')}</p>
          <p className="text-sm opacity-90 mt-0.5">{t('pharmacy.onSupplements')}</p>
          <button type="button" className="mt-4 px-4 py-2.5 rounded-xl bg-white text-sky-600 font-semibold text-sm interactive-btn shadow-sm">
            {t('pharmacy.shopNow')}
          </button>
          <div className="absolute bottom-0 right-0 w-24 h-24 opacity-20 pointer-events-none">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M20 7h-4V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /></svg>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{t('pharmacy.popularProducts')}</h2>
          <Link to="#" className="text-sm font-medium text-sky-600 link-hover">{t('pharmacy.seeAll')}</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden interactive-card"
              >
                <Link to={`/customer/pharmacy/${p.id}`} className="block">
                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
                      <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium uppercase">
                      {t('pharmacy.inStock')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(p.id); }}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center interactive-btn"
                      aria-label={p.fav ? 'Remove from favourites' : 'Add to favourites'}
                    >
                      <svg className={`w-5 h-5 ${p.fav ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} fill={p.fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.size}</p>
                    <p className="font-bold text-sky-600 mt-1">${p.price.toFixed(2)}</p>
                  </div>
                </Link>
                <div className="mt-2 flex justify-end px-3 pb-3">
                  {p.inCart > 0 ? (
                    <span className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-bold">{p.inCart}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(p.id)}
                      disabled={addingId === p.id}
                      className={`w-9 h-9 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-lg interactive-btn hover:bg-sky-600 ${addingId === p.id ? 'btn-loading' : ''}`}
                      aria-label={t('pharmacy.addToCart')}
                    >
                      {addingId === p.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        '+'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
