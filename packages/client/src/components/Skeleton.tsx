import { JSX } from 'react/jsx-runtime';
import { cn } from '~/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-tertiary opacity-50 dark:opacity-25',
        'transition-opacity duration-[var(--duration-normal)]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
