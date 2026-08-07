import type { ReactNode } from 'react';

export default function PageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border-light px-6 py-5">
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        {description != null && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
