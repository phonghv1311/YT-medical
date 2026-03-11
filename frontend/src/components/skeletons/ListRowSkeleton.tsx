import { Skeleton } from './Skeleton';

type Size = 'sm' | 'md' | 'lg';
const avatarSizes: Record<Size, string> = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-14 h-14' };

interface ListRowSkeletonProps {
  avatarSize?: Size;
  lines?: number;
  className?: string;
}

export function ListRowSkeleton({ avatarSize = 'md', lines = 2, className = '' }: ListRowSkeletonProps) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 ${className}`}>
      <Skeleton className={`shrink-0 rounded-full ${avatarSizes[avatarSize]}`} />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        {lines >= 3 && (
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        )}
      </div>
      <Skeleton className="w-5 h-5 shrink-0 rounded" />
    </div>
  );
}
