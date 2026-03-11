import { Skeleton } from './Skeleton';

/** Matches AvailableDoctors / DoctorsList doctor card layout */
export function DoctorCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="relative h-36">
        <Skeleton className="absolute inset-0 rounded-none" />
        <Skeleton className="absolute top-2 right-2 h-6 w-16 rounded-lg" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-4/5 mt-2" />
        <Skeleton className="h-12 w-full mt-4 rounded-xl" />
      </div>
    </div>
  );
}
