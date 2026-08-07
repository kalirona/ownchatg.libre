import PageLayout from '~/components/PageLayout';
import { useLocalize } from '~/hooks';
import { useGetUserBalance } from '~/data-provider';
import { Coins, BarChart3 } from 'lucide-react';

export default function UsagePage() {
  const localize = useLocalize();
  const { data: balanceData } = useGetUserBalance({ enabled: true });

  const stats = [
    {
      label: 'Token Credits',
      value: balanceData?.tokenCredits != null ? balanceData.tokenCredits.toLocaleString() : '—',
      icon: Coins,
    },
    {
      label: 'Estimated Value',
      value: balanceData?.tokenCredits != null ? `$${((balanceData.tokenCredits ?? 0) * 0.00001).toFixed(2)}` : '—',
      icon: BarChart3,
    },
  ];

  return (
    <PageLayout title="Usage" description="Track your token usage and costs.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border-light p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-active-alt">
                <stat.icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">{stat.label}</p>
                <p className="text-lg font-semibold text-text-primary">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
