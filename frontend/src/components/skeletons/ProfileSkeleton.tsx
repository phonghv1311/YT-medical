import { Skeleton } from './Skeleton';

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="flex items-center gap-5">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-32 rounded-lg" />
    </div>
  );
}
