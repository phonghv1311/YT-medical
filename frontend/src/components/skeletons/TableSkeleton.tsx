import { Skeleton } from './Skeleton';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  headerLabels?: string[];
  className?: string;
}

export function TableSkeleton({ rows = 5, cols = 5, headerLabels, className = '' }: TableSkeletonProps) {
  const colCount = headerLabels?.length ?? cols;
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: colCount }).map((_, i) => (
              <th key={i} className="px-4 sm:px-6 py-3 text-left">
                {headerLabels?.[i] ?? <Skeleton className="h-4 w-20" />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: colCount }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 sm:px-6 py-3">
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
