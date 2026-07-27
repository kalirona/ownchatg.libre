import type { ReactNode } from 'react';

export interface WidgetConfig {
  id: string;
  width: 'full' | 'half';
  priority: number;
}

const WIDGET_LABELS: Record<string, string | undefined> = {
  'recent-conversations': 'com_ui_chat_history',
  'account-summary': 'com_ui_account',
  'credits-usage': 'com_ui_usage',
};

export default function DashboardLayout({
  widgets,
  renderWidget,
}: {
  widgets: WidgetConfig[];
  renderWidget: (id: string) => ReactNode;
}) {
  const sorted = [...widgets].sort((a, b) => a.priority - b.priority);

  const fullWidth = sorted.filter((w) => w.width === 'full');
  const halfWidth = sorted.filter((w) => w.width === 'half');

  return (
    <div className="flex flex-col gap-6">
      {fullWidth.map((w) => (
        <div key={w.id}>{renderWidget(w.id)}</div>
      ))}
      {halfWidth.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          {halfWidth.map((w) => (
            <div key={w.id} className="flex flex-col">
              {renderWidget(w.id)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
