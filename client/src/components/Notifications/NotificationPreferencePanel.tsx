import { useState, useEffect, useCallback } from 'react';
import { useLocalize } from '~/hooks';
import {
  useGetNotificationPreferences,
  useUpdateNotificationPreferencesMutation,
  useSubscribePushNotificationMutation,
  useUnsubscribePushNotificationMutation,
  useSendNotificationDigestMutation,
} from '~/data-provider/Notifications/queries';
import type { TNotificationType } from 'librechat-data-provider';

const NOTIFICATION_TYPES: { key: TNotificationType; labelKey: string }[] = [
  { key: 'system_announcement', labelKey: 'com_notifications_type_system_announcement' },
  { key: 'billing_alert', labelKey: 'com_notifications_type_billing_alert' },
  { key: 'low_credit', labelKey: 'com_notifications_type_low_credit' },
  { key: 'subscription_expiring', labelKey: 'com_notifications_type_subscription_expiring' },
  { key: 'mention', labelKey: 'com_notifications_type_mention' },
  { key: 'welcome', labelKey: 'com_notifications_type_welcome' },
  { key: 'integration', labelKey: 'com_notifications_type_integration' },
  { key: 'team_invite', labelKey: 'com_notifications_type_team_invite' },
  { key: 'workflow_finished', labelKey: 'com_notifications_type_workflow_finished' },
  { key: 'image_finished', labelKey: 'com_notifications_type_image_finished' },
  { key: 'video_finished', labelKey: 'com_notifications_type_video_finished' },
];

const CHANNELS = ['email', 'inApp', 'push', 'slack', 'discord'] as const;

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
        enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function NotificationPreferencePanel() {
  const localize = useLocalize();
  const { data, isLoading } = useGetNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferencesMutation();
  const subscribePush = useSubscribePushNotificationMutation();
  const unsubscribePush = useUnsubscribePushNotificationMutation();
  const sendDigest = useSendNotificationDigestMutation();

  const [digest, setDigest] = useState<'none' | 'daily' | 'weekly'>('none');
  const [digestTime, setDigestTime] = useState('09:00');
  const [channels, setChannels] = useState<Record<string, boolean>>({
    email: false,
    inApp: true,
    push: false,
    slack: false,
    discord: false,
  });
  const [typePrefs, setTypePrefs] = useState<Record<string, Record<string, boolean>>>({});
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [digestResult, setDigestResult] = useState('');

  useEffect(() => {
    if (data?.preferences) {
      const p = data.preferences;
      setDigest(p.digest || 'none');
      setDigestTime(p.digestTime || '09:00');
      setChannels(p.channels || { email: false, inApp: true, push: false, slack: false, discord: false });
      setTypePrefs(p.types || {});
    }
  }, [data]);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setPushSubscribed(!!sub);
        });
      });
    }
  }, []);

  const handleChannelToggle = useCallback((channel: string) => {
    setChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  }, []);

  const handleTypeToggle = useCallback((type: string, channel: string) => {
    setTypePrefs((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: !(prev[type]?.[channel] ?? channels[channel]) },
    }));
  }, [channels]);

  const handleSave = useCallback(() => {
    updatePrefs.mutate(
      { digest, digestTime, channels, types: typePrefs },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  }, [digest, digestTime, channels, typePrefs, updatePrefs]);

  const handlePushToggle = useCallback(async () => {
    if (pushSubscribed) {
      unsubscribePush.mutate(undefined, { onSuccess: () => setPushSubscribed(false) });
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          (window as unknown as Record<string, string>).VAPID_PUBLIC_KEY || '',
        ),
      });
      subscribePush.mutate(sub.toJSON(), { onSuccess: () => setPushSubscribed(true) });
    } catch {
      // push not granted
    }
  }, [pushSubscribed, subscribePush, unsubscribePush]);

  const handleSendDigest = useCallback(() => {
    sendDigest.mutate(undefined, {
      onSuccess: (res) => {
        setDigestResult(res.sent ? localize('com_notifications_digest_sent') : res.reason || '');
        setTimeout(() => setDigestResult(''), 3000);
      },
    });
  }, [sendDigest, localize]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-gray-500">{localize('com_ui_loading')}</div>
      </div>
    );
  }

  const channelEnabled = (type: string, channel: string) =>
    typePrefs[type]?.[channel] ?? channels[channel];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {localize('com_notifications_preferences')}
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {localize('com_notifications_preferences_description')}
      </p>

      {/* Default Channels */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-gray-800 dark:text-gray-200">
          Default Notification Channels
        </h2>
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          {CHANNELS.map((ch) => (
            <div key={ch} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {localize(`com_notifications_channel_${ch}`)}
              </span>
              <Toggle enabled={channels[ch]} onChange={() => handleChannelToggle(ch)} />
            </div>
          ))}
        </div>
      </section>

      {/* Per-Type Overrides */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-gray-800 dark:text-gray-200">
          Per-Type Overrides
        </h2>
        <div className="space-y-3">
          {NOTIFICATION_TYPES.map((nt) => (
            <div
              key={nt.key}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <p className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                {localize(nt.labelKey)}
              </p>
              <div className="flex flex-wrap gap-3">
                {CHANNELS.map((ch) => (
                  <label
                    key={ch}
                    className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <input
                      type="checkbox"
                      checked={channelEnabled(nt.key, ch)}
                      onChange={() => handleTypeToggle(nt.key, ch)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600"
                    />
                    {localize(`com_notifications_channel_${ch}`)}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Push Notifications */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-gray-800 dark:text-gray-200">
          Push Notifications
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          {pushSupported ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {localize('com_notifications_push_supported')}
              </span>
              <button
                onClick={handlePushToggle}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                  pushSubscribed
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {pushSubscribed
                  ? localize('com_notifications_push_unsubscribe')
                  : localize('com_notifications_push_subscribe')}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{localize('com_notifications_push_unsupported')}</p>
          )}
        </div>
      </section>

      {/* Digest Settings */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-gray-800 dark:text-gray-200">
          {localize('com_notifications_digest')}
        </h2>
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {localize('com_notifications_digest')}
            </span>
            <select
              value={digest}
              onChange={(e) => setDigest(e.target.value as 'none' | 'daily' | 'weekly')}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="none">{localize('com_notifications_digest_none')}</option>
              <option value="daily">{localize('com_notifications_digest_daily')}</option>
              <option value="weekly">{localize('com_notifications_digest_weekly')}</option>
            </select>
          </div>
          {digest !== 'none' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {localize('com_notifications_digest_time')}
              </span>
              <input
                type="time"
                value={digestTime}
                onChange={(e) => setDigestTime(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSendDigest}
              disabled={sendDigest.isLoading}
              className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              {localize('com_notifications_digest_send')}
            </button>
            {digestResult && (
              <span className="text-xs text-green-600 dark:text-green-400">{digestResult}</span>
            )}
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            {localize('com_notifications_saved')}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={updatePrefs.isLoading}
          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
        >
          {localize('com_notifications_save')}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
