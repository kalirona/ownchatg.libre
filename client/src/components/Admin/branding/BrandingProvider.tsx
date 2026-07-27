import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from 'librechat-data-provider';
import { useRecoilValue } from 'recoil';
import store from '~/store';

export default function BrandingProvider({ children }: { children: React.ReactNode }) {
  const queriesEnabled = useRecoilValue(store.queriesEnabled);
  const { data } = useQuery(
    ['publicBranding'],
    () => dataService.getPublicBranding(),
    {
      enabled: queriesEnabled,
      staleTime: 5 * 60 * 1000,
    },
  );

  useEffect(() => {
    if (!data) { return; }
    const root = document.documentElement;
    if (data.primaryColor) { root.style.setProperty('--brand-primary', data.primaryColor); }
    if (data.secondaryColor) { root.style.setProperty('--brand-secondary', data.secondaryColor); }
    if (data.accentColor) { root.style.setProperty('--brand-accent', data.accentColor); }
    if (data.logo) { root.style.setProperty('--brand-logo', `url(${data.logo})`); }
    if (data.dashboard?.appName) { root.style.setProperty('--brand-app-name', `"${data.dashboard.appName}"`); }
    if (data.dashboard?.appTitle) { document.title = data.dashboard.appTitle; }
    if (data.favicon) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) { link.href = data.favicon; }
    }
  }, [data]);

  return <>{children}</>;
}
