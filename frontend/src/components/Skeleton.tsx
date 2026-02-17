import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  count?: number;
}

/**
 * Skeleton loader component for better perceived performance
 * Shows placeholders while content is loading
 */
export default function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '1rem' : '100px'),
  };

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variantClasses[variant], className)}
            style={style}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Card skeleton for route listings
 */
export function RouteCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="rectangular" width="80px" height="28px" />
            <Skeleton variant="rectangular" width="60px" height="20px" />
          </div>
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right space-y-2">
            <Skeleton variant="text" width="80px" height="32px" />
            <Skeleton variant="text" width="60px" height="16px" />
          </div>
          <Skeleton variant="rectangular" width="100px" height="40px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table skeleton for admin dashboard
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="text" width="25%" height="20px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} variant="text" width="25%" height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Stats card skeleton
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width="100px" height="16px" />
          <Skeleton variant="text" width="80px" height="32px" />
        </div>
        <Skeleton variant="circular" width="48px" height="48px" />
      </div>
    </div>
  );
}
