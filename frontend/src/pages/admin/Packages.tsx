import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { CardSkeleton } from '../../components/skeletons';

interface PackageItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  isActive: boolean;
}

export default function AdminPackages() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi
      .getPackages({ signal })
      .then(({ data }) => {
        if (signal.aborted) return;
        const raw = data?.data ?? data;
        const list = Array.isArray(raw) ? raw : (raw as { packages?: PackageItem[] })?.packages ?? [];
        setPackages(list);
      })
      .catch(() => { if (!signal.aborted) setPackages([]); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} lines={3} showImage={false} />
        ))}
      </div>
    );
  }

  function currency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
        <p className="mt-1 text-sm text-gray-500">Subscription packages available to customers</p>
      </div>

      {packages.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          No packages found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-xl border p-5 ${pkg.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-75'}`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                {!pkg.isActive && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>
                )}
              </div>
              {pkg.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{pkg.description}</p>}
              <p className="mt-3 text-lg font-bold text-gray-900">{currency(pkg.price)}</p>
              <p className="text-xs text-gray-500">{pkg.durationDays} days</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
