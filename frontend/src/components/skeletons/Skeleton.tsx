interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Base skeleton block using app's .skeleton utility (animate-pulse, bg-gray-200) */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden />;
}
