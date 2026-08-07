import { Globe, Github } from 'lucide-react';
import PageLayout from '~/components/PageLayout';
import { useLocalize } from '~/hooks';

const providers = [
  {
    id: 'google',
    name: 'Google',
    icon: Globe,
    connected: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    connected: false,
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: Globe,
    connected: false,
  },
];

export default function ConnectedAccountsPage() {
  const localize = useLocalize();

  return (
    <PageLayout title="Connected Accounts">
      <div className="flex flex-col gap-3">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <div
              key={provider.id}
              className="rounded-lg border border-border-light p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-text-secondary" />
                <span className="text-sm font-medium text-text-primary">{provider.name}</span>
              </div>
              <button
                type="button"
                className="rounded-lg bg-surface-hover px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
              >
                Connect
              </button>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
