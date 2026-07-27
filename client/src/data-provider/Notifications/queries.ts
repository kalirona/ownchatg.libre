import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions, UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetNotifications = (
  params?: t.TNotificationQueryParams,
  config?: UseQueryOptions<t.TNotificationListResponse>,
): QueryObserverResult<t.TNotificationListResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TNotificationListResponse>(
    [QueryKeys.notificationsList, params],
    () => dataService.getNotifications(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetNotificationsUnreadCount = (
  config?: UseQueryOptions<t.TUnreadCountResponse>,
): QueryObserverResult<t.TUnreadCountResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TUnreadCountResponse>(
    [QueryKeys.notificationsUnreadCount],
    () => dataService.getNotificationsUnreadCount(),
    {
      refetchInterval: 30000,
      ...config,
      enabled: queriesEnabled,
    },
  );
};

export const useMarkNotificationAsReadMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['markNotificationAsRead'],
    (id: string) => dataService.markNotificationAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.notificationsList]);
        queryClient.invalidateQueries([QueryKeys.notificationsUnreadCount]);
      },
    },
  );
};

export const useMarkAllNotificationsAsReadMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  void
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['markAllNotificationsAsRead'],
    () => dataService.markAllNotificationsAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.notificationsList]);
        queryClient.invalidateQueries([QueryKeys.notificationsUnreadCount]);
      },
    },
  );
};

export const useDeleteNotificationMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['deleteNotification'],
    (id: string) => dataService.deleteNotification(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.notificationsList]);
        queryClient.invalidateQueries([QueryKeys.notificationsUnreadCount]);
      },
    },
  );
};

export const useGetNotificationPreferences = (
  config?: UseQueryOptions<{ preferences: t.TNotificationPreference }>,
): QueryObserverResult<{ preferences: t.TNotificationPreference }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ preferences: t.TNotificationPreference }>(
    [QueryKeys.notificationPreferences],
    () => dataService.getNotificationPreferences(),
    {
      ...config,
      enabled: queriesEnabled,
    },
  );
};

export const useUpdateNotificationPreferencesMutation = (): UseMutationResult<
  { preferences: t.TNotificationPreference },
  Error,
  Partial<t.TNotificationPreference>
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['updateNotificationPreferences'],
    (data: Partial<t.TNotificationPreference>) => dataService.updateNotificationPreferences(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.notificationPreferences]);
      },
    },
  );
};

export const useSubscribePushNotificationMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  PushSubscriptionJSON
> => {
  return useMutation(
    ['subscribePushNotification'],
    (subscription: PushSubscriptionJSON) => dataService.subscribePushNotification(subscription),
  );
};

export const useUnsubscribePushNotificationMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  void
> => {
  return useMutation(
    ['unsubscribePushNotification'],
    () => dataService.unsubscribePushNotification(),
  );
};

export const useSendNotificationDigestMutation = (): UseMutationResult<
  t.TNotificationDigestResponse,
  Error,
  void
> => {
  return useMutation(
    ['sendNotificationDigest'],
    () => dataService.sendNotificationDigest(),
  );
};
