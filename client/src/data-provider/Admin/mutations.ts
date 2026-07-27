import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MutationKeys, QueryKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';

export const useAdminUnlockUserMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.unlockAdminUser],
    (id: string) => dataService.adminUnlockUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminLockedUsers]);
        queryClient.invalidateQueries([QueryKeys.adminUserDetail]);
      },
    },
  );
};

export const useUpdateAdminUserRoleMutation = (): UseMutationResult<
  { user: t.TUser },
  Error,
  { id: string; role: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.updateAdminUserRole],
    ({ id, role }: { id: string; role: string }) =>
      dataService.updateAdminUserRole(id, { role }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminUserDetail]);
      },
    },
  );
};

export const useAdjustAdminCreditsMutation = (): UseMutationResult<
  { balance: unknown },
  Error,
  t.TAdminCreditsAdjustRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.adjustAdminCredits],
    (payload: t.TAdminCreditsAdjustRequest) => dataService.adjustAdminCredits(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminUserDetail]);
        queryClient.invalidateQueries([QueryKeys.adminDashboardStats]);
      },
    },
  );
};

export const useCancelAdminSubscriptionMutation = (): UseMutationResult<
  { subscription: t.TAdminSubscription },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.cancelAdminSubscription],
    (id: string) => dataService.cancelAdminSubscription(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminSubscriptions]);
      },
    },
  );
};

export const useCreateAdminAnnouncementMutation = (): UseMutationResult<
  { announcement: t.TAdminAnnouncement },
  Error,
  t.TAdminAnnouncementRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.createAdminAnnouncement],
    (payload: t.TAdminAnnouncementRequest) => dataService.createAdminAnnouncement(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminAnnouncements]);
      },
    },
  );
};

export const useUpdateAdminAnnouncementMutation = (): UseMutationResult<
  { announcement: t.TAdminAnnouncement },
  Error,
  { id: string; payload: Partial<t.TAdminAnnouncementRequest> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.updateAdminAnnouncement],
    ({ id, payload }: { id: string; payload: Partial<t.TAdminAnnouncementRequest> }) =>
      dataService.updateAdminAnnouncement(id, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminAnnouncements]);
      },
    },
  );
};

export const useDeleteAdminAnnouncementMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteAdminAnnouncement],
    (id: string) => dataService.deleteAdminAnnouncement(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminAnnouncements]);
      },
    },
  );
};
