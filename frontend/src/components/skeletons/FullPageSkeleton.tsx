import { Skeleton } from './Skeleton';

/** Minimal full-page skeleton when layout is simple (e.g. detail pages) */
export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="space-y-4 mt-8">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
