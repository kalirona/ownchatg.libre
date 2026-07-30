import * as React from 'react';
import { cn } from '~/utils';
import './Field.css';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>> =
  React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          'lc-field flex h-10 w-full rounded-lg border border-border-light bg-transparent px-3 py-2 text-sm text-text-primary ring-offset-background placeholder:text-text-secondary transition-colors focus-visible:border-border-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary disabled:cursor-not-allowed disabled:opacity-50',
          '[&:invalid]:border-border-destructive [&:invalid]:ring-1 [&:invalid]:ring-destructive',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  });

Input.displayName = 'Input';

export { Input };
