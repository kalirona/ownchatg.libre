import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalize } from '~/hooks';
import {
  useGetNotificationsUnreadCount,
  useGetNotifications,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from '~/data-provider/Notifications/queries';

const TYPE_ICONS: Record<string, string> = {
  billing_alert: '💳',
  low_credit: '⚠️',
  subscription_expiring: '📅',
  system_announcement: '📢',
  mention: '💬',
  welcome: '👋',
  integration: '🔗',
  team_invite: '👥',
};

export default function NotificationBell() {
  const localize = useLocalize();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useGetNotificationsUnreadCount();
  const { data: notifData, refetch: refetchList } = useGetNotifications(
    { page: 1, limit: 20 },
    { enabled: open },
  );
  const markRead = useMarkNotificationAsReadMutation();
  const markAllRead = useMarkAllNotificationsAsReadMutation();
  const deleteNotif = useDeleteNotificationMutation();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = unreadData?.count ?? 0;

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate(undefined, { onSuccess: () => refetchList() });
  }, [markAllRead, refetchList]);

  const handleMarkRead = useCallback(
    (id: string) => {
      markRead.mutate(id, { onSuccess: () => refetchList() });
    },
    [markRead, refetchList],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNotif.mutate(id, { onSuccess: () => refetchList() });
    },
    [deleteNotif, refetchList],
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        aria-label={localize('com_notifications_title')}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {localize('com_notifications_title')}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-green-600 hover:underline dark:text-green-400"
              >
                {localize('com_notifications_mark_all_read')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {(!notifData?.notifications || notifData.notifications.length === 0) && (
              <p className="px-3 py-6 text-center text-xs text-gray-400">
                {localize('com_notifications_empty')}
              </p>
            )}

            {notifData?.notifications.map((n) => (
              <div
                key={n._id}
                className={`flex gap-2 border-b border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-750 ${
                  !n.read ? 'bg-green-50 dark:bg-green-900/10' : ''
                }`}
              >
                <span className="mt-0.5 shrink-0 text-sm">
                  {TYPE_ICONS[n.type] || '🔔'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="rounded p-0.5 text-gray-400 hover:text-green-500"
                      title={localize('com_notifications_mark_read')}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="rounded p-0.5 text-gray-400 hover:text-red-500"
                    title={localize('com_notifications_delete')}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <a
              href="/notifications/preferences"
              className="block px-3 py-2 text-center text-xs text-green-600 hover:underline dark:text-green-400"
            >
              {localize('com_notifications_preferences')}
            </a>
            {notifData && notifData.pages > 1 && (
              <a
                href="/notifications"
                className="block border-t border-gray-200 px-3 py-2 text-center text-xs text-green-600 hover:underline dark:border-gray-700 dark:text-green-400"
              >
                {localize('com_notifications_view_all')}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
