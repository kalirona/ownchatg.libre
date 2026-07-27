import { useState } from 'react';
import { useGetAdminAnalytics } from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';
import SimpleBarChart from './SimpleBarChart';
import SimplePieChart from './PieChart';

type Period = '7d' | '30d' | '90d' | '1y';

const periods: Period[] = ['7d', '30d', '90d', '1y'];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPanel() {
  const localize = useLocalize();
  const [period, setPeriod] = useState<Period>('30d');
  const { data, isLoading, isError } = useGetAdminAnalytics({ period });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {localize('com_admin_analytics_error')}
      </div>
    );
  }

  const modelUsageData = data.modelUsage?.map((m) => ({
    name: m.model.length > 18 ? m.model.slice(0, 16) + '…' : m.model,
    value: m.count,
  })) ?? [];

  const imageProviderData = data.imageStats?.byProvider?.map((p) => ({
    name: p.provider,
    value: p.count,
  })) ?? [];

  const videoProviderData = data.videoStats?.byProvider?.map((p) => ({
    name: p.provider,
    value: p.count,
  })) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {localize('com_admin_analytics_period')}:
        </span>
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              period === p
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <SectionCard title={localize('com_admin_analytics_user_growth')}>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <StatCard
            label={localize('com_admin_analytics_total_users')}
            value={data.userGrowth?.totalUsers?.toLocaleString() ?? '0'}
          />
          <StatCard
            label={localize('com_admin_analytics_new_users')}
            value={data.userGrowth?.newUsers?.toLocaleString() ?? '0'}
          />
        </div>
        <SimpleBarChart data={(data.userGrowth?.daily ?? []).map((d) => ({ ...d, value: d.value }))} color="#3b82f6" />
      </SectionCard>

      <SectionCard title={localize('com_admin_analytics_credit_usage')}>
        <div className="mb-2 grid grid-cols-3 gap-2">
          <StatCard label={localize('com_admin_analytics_prompt_tokens')} value={(data.creditUsage?.creditTotal?.promptTokens ?? 0).toLocaleString()} />
          <StatCard label={localize('com_admin_analytics_completion_tokens')} value={(data.creditUsage?.creditTotal?.completionTokens ?? 0).toLocaleString()} />
          <StatCard label={localize('com_admin_analytics_total_cost')} value={`$${(data.creditUsage?.creditTotal?.totalCost ?? 0).toFixed(2)}`} />
        </div>
        <SimpleBarChart data={data.creditUsage?.daily ?? []} color="#f59e0b" />
      </SectionCard>

      <SectionCard title={localize('com_admin_analytics_revenue')}>
        <div className="mb-2 grid grid-cols-3 gap-2">
          <StatCard label={localize('com_admin_analytics_total_revenue')} value={`$${(data.revenue?.revenueTotal?.amount ?? 0).toFixed(2)}`} />
          <StatCard label={localize('com_admin_analytics_credits_awarded')} value={(data.revenue?.revenueTotal?.creditsAwarded ?? 0).toLocaleString()} />
          <StatCard label={localize('com_admin_completed_transactions')} value={(data.revenue?.revenueTotal?.count ?? 0).toLocaleString()} />
        </div>
        <SimpleBarChart data={data.revenue?.daily ?? []} color="#22c55e" />
      </SectionCard>

      <SectionCard title={localize('com_admin_analytics_user_activity')}>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <StatCard label={localize('com_admin_analytics_active_users')} value={(data.userActivity?.activityTotal?.activeUsers ?? 0).toLocaleString()} />
          <StatCard label={localize('com_admin_analytics_total_messages')} value={(data.userActivity?.activityTotal?.totalMessages ?? 0).toLocaleString()} />
        </div>
        <SimpleBarChart data={data.userActivity?.daily ?? []} color="#8b5cf6" />
      </SectionCard>

      <SectionCard title={localize('com_admin_analytics_retention')}>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <StatCard label={localize('com_admin_analytics_active_subscriptions')} value={(data.retention?.retentionCurrent?.activeSubscriptions ?? 0).toLocaleString()} />
          <StatCard label={localize('com_admin_analytics_churn_rate')} value={`${(data.retention?.retentionCurrent?.churnRate ?? 0).toFixed(1)}%`} />
        </div>
        <SimpleBarChart data={data.retention?.daily ?? []} color="#ef4444" />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={localize('com_admin_analytics_model_usage')}>
          {modelUsageData.length > 0 ? (
            <SimplePieChart data={modelUsageData} height={220} />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
              {localize('com_admin_analytics_no_data')}
            </div>
          )}
        </SectionCard>

        <SectionCard title={localize('com_admin_analytics_image_stats')}>
          <div className="mb-2">
            <StatCard
              label={localize('com_admin_analytics_images_generated')}
              value={(data.imageStats?.totalGenerated ?? 0).toLocaleString()}
            />
          </div>
          {imageProviderData.length > 0 ? (
            <SimplePieChart data={imageProviderData} height={180} />
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-gray-400">
              {localize('com_admin_analytics_no_data')}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title={localize('com_admin_analytics_video_stats')}>
        <div className="mb-2">
          <StatCard
            label={localize('com_admin_analytics_videos_generated')}
            value={(data.videoStats?.totalGenerated ?? 0).toLocaleString()}
          />
        </div>
        {videoProviderData.length > 0 ? (
          <SimplePieChart data={videoProviderData} height={200} />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
            {localize('com_admin_analytics_no_data')}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
