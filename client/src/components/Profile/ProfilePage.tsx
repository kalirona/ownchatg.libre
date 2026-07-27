import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useSetRecoilState, useRecoilState } from 'recoil';
import { Mail, Globe, Check } from 'lucide-react';
import type { TUser } from 'librechat-data-provider';
import { Button, Spinner } from '@librechat/client';
import { ThemeContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { useLocalize } from '~/hooks';
import { useGetUserQuery, useUpdateUserProfileMutation } from '~/data-provider';
import { ThemeSelector, LangSelector } from '~/components/Nav/SettingsTabs/General/Selectors';
import AvatarUpload from '~/components/Nav/SettingsTabs/Account/Avatar';
import { cn } from '~/utils';
import store from '~/store';
import Cookies from 'js-cookie';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

export default function ProfilePage() {
  const localize = useLocalize();
  const { isAuthenticated } = useAuthContext();
  const { data: user } = useGetUserQuery({ enabled: isAuthenticated });
  const { theme, setTheme } = useContext(ThemeContext);
  const [langcode, setLangcode] = useRecoilState(store.lang);
  const setUser = useSetRecoilState(store.user);

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [savedName, setSavedName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(() => {
    return user?.timezone || localStorage.getItem('profile:timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  const browserTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
      setSavedName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (user?.timezone) {
      setTimezone(user.timezone);
    }
  }, [user?.timezone]);

  const { mutate: updateProfile, isLoading: isSaving } = useUpdateUserProfileMutation({
    onSuccess: (data) => {
      setUser(data);
      setSavedName(data.name);
    },
  });

  const handleSaveName = useCallback(() => {
    const trimmed = displayName.trim();
    if (trimmed && trimmed !== savedName) {
      updateProfile({ name: trimmed });
    }
  }, [displayName, savedName, updateProfile]);

  const handleTimezoneChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTimezone(value);
    localStorage.setItem('profile:timezone', value);
    updateProfile({ timezone: value });
  }, [updateProfile]);

  const handleLangChange = useCallback(
    (value: string) => {
      const userLang = value === 'auto' ? navigator.language || navigator.languages?.[0] || 'en-US' : value;
      requestAnimationFrame(() => {
        document.documentElement.lang = userLang;
      });
      setLangcode(userLang);
      Cookies.set('lang', userLang, { expires: 365 });
    },
    [setLangcode],
  );

  const nameChanged = displayName.trim() !== savedName && displayName.trim().length > 0;

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">{localize('com_ui_account')}</h1>

      <div className="flex flex-col gap-6">
        {/* Avatar + Name section */}
        <div className="rounded-xl border border-border-light bg-surface-primary-alt px-5 py-4">
          <div className="flex items-start gap-4">
            <AvatarUpload />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label className="text-xs text-text-secondary">
                {localize('com_ui_name')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                  className={cn(
                    'flex-1 rounded-lg border border-border-light bg-surface-tertiary px-3 py-1.5 text-sm text-text-primary',
                    'placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white',
                  )}
                  placeholder={user.name || user.username}
                />
                <Button
                  variant={nameChanged ? 'default' : 'ghost'}
                  size="sm"
                  disabled={!nameChanged || isSaving}
                  onClick={handleSaveName}
                  className="h-8 shrink-0"
                >
                  {isSaving ? (
                    <Spinner className="h-4 w-4" />
                  ) : nameChanged ? (
                    localize('com_ui_save')
                  ) : (
                    <Check className="h-4 w-4 text-text-secondary" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Email section */}
        <div className="rounded-xl border border-border-light bg-surface-primary-alt px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-tertiary">
              <Mail className="h-3.5 w-3.5 text-text-secondary" />
            </div>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
              <span className="text-xs text-text-secondary">{localize('com_auth_email')}</span>
              <span className="truncate text-sm font-medium text-text-primary">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Preferences section */}
        <div className="rounded-xl border border-border-light bg-surface-primary-alt px-5 py-4">
          <h2 className="mb-4 text-sm font-semibold text-text-secondary">
            {localize('com_ui_preferences')}
          </h2>
          <div className="flex flex-col gap-4">
            {/* Timezone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-tertiary">
                  <Globe className="h-3.5 w-3.5 text-text-secondary" />
                </div>
                <span className="text-xs text-text-secondary">{localize('com_ui_timezone')}</span>
              </div>
              <select
                value={timezone}
                onChange={handleTimezoneChange}
                className={cn(
                  'w-[200px] rounded-lg border border-border-light bg-surface-tertiary px-3 py-1.5 text-sm text-text-primary',
                  'focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white',
                )}
              >
                <option value={browserTimezone}>
                  {browserTimezone} (auto)
                </option>
                <option disabled>──────────</option>
                {TIMEZONES.filter((tz) => tz !== browserTimezone).map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme */}
            <ThemeSelector theme={theme} onChange={setTheme} />

            {/* Language */}
            <LangSelector langcode={langcode} onChange={handleLangChange} />
          </div>
        </div>

        {/* Workspace preferences */}
        <div className="rounded-xl border border-border-light bg-surface-primary-alt px-5 py-4">
          <h3 className="mb-4 text-xs font-semibold text-text-secondary">
            {localize('com_ui_workspace_prefs')}
          </h3>
          <div className="flex flex-col gap-3">
            <WorkspaceToggle
              label={localize('com_ui_dashboard_default')}
              storageKey="pref:dashboard_default"
            />
            <WorkspaceToggle
              label={localize('com_ui_auto_collapse')}
              storageKey="pref:auto_collapse_sidebar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceToggle({ label, storageKey }: { label: string; storageKey: string }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(storageKey) === 'true');

  const handleToggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }, [storageKey]);

  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-text-primary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          enabled ? 'bg-blue-600' : 'bg-surface-tertiary',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            enabled && 'translate-x-4',
          )}
        />
      </button>
    </label>
  );
}
