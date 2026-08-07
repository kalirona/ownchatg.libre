import type { LucideIcon } from 'lucide-react';

export default function PlaceholderPage({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-surface-active-alt p-4">
        <Icon className="h-8 w-8 text-text-secondary" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-text-primary">{title}</h2>
      {description != null && (
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      )}
      <p className="mt-4 text-xs text-text-tertiary">Coming soon</p>
    </div>
  );
}
