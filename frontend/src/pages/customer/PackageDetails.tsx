import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { paymentsApi } from '../../api';
import type { Package } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

export default function PackageDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.getPackages()
      .then(({ data }) => {
        const list = data?.data ?? data ?? [];
        const arr = Array.isArray(list) ? list : [];
        const found = arr.find((x: Package) => String(x.id) === id);
        setPkg(found ?? null);
      })
      .catch(() => setPkg(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <FullPageSkeleton />;
  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Package not found.</p>
        <Link to="/customer/packages" className="mt-4 text-blue-600 font-medium">Back to packages</Link>
      </div>
    );
  }

  const price = Number(pkg.price);
  const duration = pkg.durationDays >= 365 ? 'year' : pkg.durationDays === 30 ? 'month' : `${pkg.durationDays} days`;

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Package Details</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Share">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
          <span className="text-4xl">📋</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{pkg.name}</h2>
        <p className="text-gray-600">{pkg.description || 'Comprehensive health screening and consultations.'}</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase">Lab Tests</p>
            <p className="text-lg font-bold text-gray-900">15+</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase">Consults</p>
            <p className="text-lg font-bold text-gray-900">1 Dr.</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase">Sample</p>
            <p className="text-lg font-bold text-gray-900">Home</p>
          </div>
        </div>

        <section>
          <h3 className="font-bold text-gray-900 mb-2">What&apos;s included</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Lab tests & digital reports</li>
            <li>• Doctor consultation</li>
            <li>• 24h report turnaround</li>
          </ul>
        </section>

        <div className="rounded-2xl bg-gray-900 text-white p-4">
          <p className="text-xs uppercase text-gray-400">Package savings</p>
          <p className="text-xl font-bold mt-1">${price.toFixed(2)} / {duration}</p>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <p className="text-xs text-gray-500">Total Price</p>
          <p className="text-xl font-bold text-gray-900">${price.toFixed(2)}</p>
        </div>
        <Link
          to={`/customer/payment-details`}
          state={{ package: pkg }}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-center flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Book Package
        </Link>
      </footer>
    </div>
  );
}
