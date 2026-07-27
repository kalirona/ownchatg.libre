import { User, Mail } from 'lucide-react';
import type { TUser } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

export default function AccountSummaryWidget({
  user,
  currentModel,
  currentEndpoint,
}: {
  user: TUser | undefined;
  currentModel: string | undefined;
  currentEndpoint: string | undefined;
}) {
  const localize = useLocalize();

  if (!user) {
    return null;
  }

  const rows: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: User, label: localize('com_ui_name'), value: user.name || user.username },
    { icon: Mail, label: localize('com_auth_email'), value: user.email },
  ];

  if (currentModel) {
    rows.push({ label: localize('com_ui_model'), value: currentModel });
  }

  if (currentEndpoint) {
    rows.push({ label: 'Endpoint', value: currentEndpoint });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-primary-alt px-5 py-4 transition-all duration-200 hover:shadow-md">
      <h2 className="text-sm font-semibold text-text-secondary">
        {localize('com_ui_account')}
      </h2>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {row.icon && (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-tertiary">
                <row.icon className="h-3.5 w-3.5 text-text-secondary" />
              </div>
            )}
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
              <span className="text-xs text-text-secondary">{row.label}</span>
              <span className="truncate text-sm font-medium text-text-primary">{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
