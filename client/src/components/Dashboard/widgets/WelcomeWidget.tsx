import { useMemo } from 'react';
import type { TUser, TStartupConfig } from 'librechat-data-provider';
import { BRAND_NAME } from 'librechat-data-provider';
import { useLocalize, type TranslationKeys } from '~/hooks';

function getGreeting(localize: (key: TranslationKeys) => string, userName?: string): string {
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());

  let timeGreeting: string;
  if (hour < 6) {
    timeGreeting = localize('com_ui_weekend_morning');
  } else if (hour < 12) {
    timeGreeting = localize('com_ui_good_morning');
  } else if (hour < 18) {
    timeGreeting = localize('com_ui_good_afternoon');
  } else {
    timeGreeting = localize('com_ui_good_evening');
  }

  if (isWeekend && hour >= 6) {
    timeGreeting = localize('com_ui_weekend_morning');
  }

  if (userName) {
    return `${timeGreeting}, ${userName}`;
  }
  return timeGreeting;
}

export default function WelcomeWidget({
  user,
  startupConfig,
}: {
  user: TUser | undefined;
  startupConfig: TStartupConfig | undefined;
}) {
  const localize = useLocalize();

  const greeting = useMemo(() => {
    const name = user?.name || user?.username || '';
    return getGreeting(localize, name);
  }, [user, localize]);

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-text-primary">
        <span aria-hidden="true" className="mr-2">👋</span>
        {greeting}
      </h1>
      <p className="text-sm text-text-secondary">
        Welcome back to {startupConfig?.appTitle || BRAND_NAME}. What would you like to create today?
      </p>
    </div>
  );
}
