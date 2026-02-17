import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

/**
 * Empty state component for displaying when no data is available
 * Provides clear guidance to users on what to do next
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  children,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4">
        <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" aria-hidden="true" />
      </div>
      
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-sm sm:text-base text-gray-600 max-w-md mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}

      {children}
    </div>
  );
}
