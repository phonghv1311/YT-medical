import { Skeleton } from './Skeleton';

interface CardSkeletonProps {
  lines?: number;
  showImage?: boolean;
  imageHeight?: string;
  className?: string;
}

export function CardSkeleton({
  lines = 2,
  showImage = true,
  imageHeight = 'h-24',
  className = '',
}: CardSkeletonProps) {
  return (
    <div className={'rounded-xl border border-gray-100 bg-white overflow-hidden ' + className}>
      {showImage && <Skeleton className={'w-full ' + imageHeight + ' rounded-none'} />}
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        {lines >= 2 && <Skeleton className="h-4 w-1/2" />}
        {lines >= 3 && <Skeleton className="h-4 w-full" />}
        {lines >= 4 && <Skeleton className="h-9 w-24 mt-2" />}
      </div>
    </div>
  );
}
