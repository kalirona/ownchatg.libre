import { useState } from 'react';
import { useLocalize, type TranslationKeys } from '~/hooks';
import OverviewPanel from './panels/OverviewPanel';
import UsersPanel from './panels/UsersPanel';
import CreditsPanel from './panels/CreditsPanel';
import RevenuePanel from './panels/RevenuePanel';
import SubscriptionsPanel from './panels/SubscriptionsPanel';
import ProvidersPanel from './panels/ProvidersPanel';
import AnnouncementsPanel from './panels/AnnouncementsPanel';
import HealthPanel from './panels/HealthPanel';
import AuditLogPanel from './panels/AuditLogPanel';
import AnalyticsPanel from './analytics/AnalyticsPanel';
import WhiteLabelSettings from './branding/WhiteLabelSettings';

type TabId =
  | 'overview'
  | 'users'
  | 'credits'
  | 'revenue'
  | 'subscriptions'
  | 'providers'
  | 'announcements'
  | 'health'
  | 'audit'
  | 'analytics'
  | 'branding';

const tabs: { id: TabId; label: TranslationKeys; icon: React.ReactNode }[] = [
  {
    id: 'overview',
    label: 'com_admin_overview',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    id: 'users',
    label: 'com_admin_users',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    id: 'credits',
    label: 'com_admin_credits',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    id: 'revenue',
    label: 'com_admin_revenue',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  },
  {
    id: 'subscriptions',
    label: 'com_admin_subscriptions',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  },
  {
    id: 'providers',
    label: 'com_admin_providers',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    id: 'announcements',
    label: 'com_admin_announcements',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  },
  {
    id: 'health',
    label: 'com_admin_health',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    id: 'audit',
    label: 'com_admin_audit',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    id: 'analytics',
    label: 'com_admin_analytics',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    id: 'branding',
    label: 'com_admin_branding',
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
  },
];

function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const localize = useLocalize();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {tab.icon}
          {localize(tab.label)}
        </button>
      ))}
    </nav>
  );
}

export default function AdminDashboard() {
  const localize = useLocalize();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {localize('com_admin_title')}
        </h1>
      </div>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'credits' && <CreditsPanel />}
        {activeTab === 'revenue' && <RevenuePanel />}
        {activeTab === 'subscriptions' && <SubscriptionsPanel />}
        {activeTab === 'providers' && <ProvidersPanel />}
        {activeTab === 'announcements' && <AnnouncementsPanel />}
        {activeTab === 'health' && <HealthPanel />}
        {activeTab === 'audit' && <AuditLogPanel />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
        {activeTab === 'branding' && <WhiteLabelSettings />}
      </div>
    </div>
  );
}
