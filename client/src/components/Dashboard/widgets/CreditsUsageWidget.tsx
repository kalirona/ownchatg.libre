import { Coins } from 'lucide-react';
import type { TBalanceResponse } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

function formatCredits(credits: number): string {
  if (credits >= 1_000_000) {
    return `${(credits / 1_000_000).toFixed(1)}M`;
  }
  if (credits >= 1_000) {
    return `${(credits / 1_000).toFixed(1)}K`;
  }
  return credits.toLocaleString();
}

function CreditsUsageWidget({
  balanceData,
}: {
  balanceData: TBalanceResponse | undefined;
}) {
  const localize = useLocalize();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-primary-alt px-5 py-4 transition-all duration-200 hover:shadow-md">
      <h2 className="text-sm font-semibold text-text-secondary">
        {localize('com_ui_usage')}
      </h2>
      {balanceData ? (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-tertiary">
            <Coins className="h-5 w-5 text-text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-text-primary">
              {formatCredits(balanceData.tokenCredits)}
            </span>
            <span className="text-xs text-text-secondary">
              {localize('com_ui_settings_label_credits')}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-tertiary">
            <Coins className="h-5 w-5 text-text-secondary" />
          </div>
          <p className="text-sm text-text-secondary">
            {localize('com_ui_no_credits')}
          </p>
        </div>
      )}
    </div>
  );
}

export default CreditsUsageWidget;
