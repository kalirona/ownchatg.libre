import { useMemo } from 'react';
import { useGetStartupConfig, useGetUserBalance } from '~/data-provider';
import { useAuthContext } from '~/hooks';
import DashboardLayout from '~/components/Dashboard/DashboardLayout';
import WelcomeWidget from '~/components/Dashboard/widgets/WelcomeWidget';
import QuickActions from '~/components/Dashboard/widgets/QuickActions';
import RecentConversationsWidget from '~/components/Dashboard/widgets/RecentConversationsWidget';
import AccountSummaryWidget from '~/components/Dashboard/widgets/AccountSummaryWidget';
import CreditsUsageWidget from '~/components/Dashboard/widgets/CreditsUsageWidget';
import ProfileWidget from '~/components/Dashboard/widgets/ProfileWidget';

export default function DashboardRoute() {
  const { user, isAuthenticated } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: balanceData } = useGetUserBalance({
    enabled: isAuthenticated,
  });

  const currentModel = undefined;
  const currentEndpoint = undefined;

  const widgets = useMemo(
    () => [
      { id: 'welcome', width: 'full' as const, priority: 0 },
      { id: 'quick-actions', width: 'full' as const, priority: 10 },
      { id: 'profile', width: 'full' as const, priority: 15 },
      { id: 'recent-conversations', width: 'half' as const, priority: 20 },
      { id: 'account-summary', width: 'half' as const, priority: 30 },
      { id: 'credits-usage', width: 'half' as const, priority: 40 },
    ],
    [],
  );

  const renderWidget = (id: string) => {
    switch (id) {
      case 'welcome':
        return <WelcomeWidget user={user} startupConfig={startupConfig} />;
      case 'quick-actions':
        return <QuickActions />;
      case 'profile':
        return <ProfileWidget user={user} />;
      case 'recent-conversations':
        return <RecentConversationsWidget />;
      case 'account-summary':
        return (
          <AccountSummaryWidget
            user={user}
            currentModel={currentModel}
            currentEndpoint={currentEndpoint}
          />
        );
      case 'credits-usage':
        return <CreditsUsageWidget balanceData={balanceData} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <DashboardLayout widgets={widgets} renderWidget={renderWidget} />
    </div>
  );
}
