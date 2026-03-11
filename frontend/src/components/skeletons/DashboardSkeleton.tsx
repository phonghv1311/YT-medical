import { Skeleton } from './Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-36" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div>
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-9 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
