import { Skeleton } from './Skeleton';

/** Pharmacy product card (existing pattern in Pharmacy.tsx) */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3 mt-2" />
        <Skeleton className="h-9 w-9 ml-auto mt-2 rounded-lg" />
      </div>
    </div>
  );
}
