import { useRecoilValue } from 'recoil';
import { QueryKeys, MutationKeys, dataService } from 'librechat-data-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryObserverResult, UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetIntegrations = (): QueryObserverResult<t.TIntegrationListResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TIntegrationListResponse>(
    [QueryKeys.integrationsList],
    () => dataService.getIntegrations(),
    { enabled: queriesEnabled },
  );
};

export const useSaveIntegrationConfigMutation = (): UseMutationResult<
  { integration: t.TIntegration },
  Error,
  { provider: string; config: Record<string, unknown> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.saveIntegrationConfig],
    ({ provider, config }) => dataService.saveIntegrationConfig(provider, config),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.integrationsList]);
      },
    },
  );
};

export const useDeleteIntegrationMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteIntegration],
    (provider: string) => dataService.deleteIntegration(provider),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.integrationsList]);
      },
    },
  );
};

export const useGetIntegrationOAuthAuthorize = (): UseMutationResult<
  { url: string; state: string },
  Error,
  string
> => {
  return useMutation(
    ['integrationOAuthAuthorize'],
    (provider: string) => dataService.getIntegrationOAuthAuthorize(provider),
  );
};

export const useGetIntegrationOAuthStatus = (
  provider: string,
): QueryObserverResult<t.TIntegrationOAuthStatus> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TIntegrationOAuthStatus>(
    [QueryKeys.integrationOAuthStatus, provider],
    () => dataService.getIntegrationOAuthStatus(provider),
    { enabled: queriesEnabled && !!provider },
  );
};

export const useIntegrationOAuthDisconnectMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.integrationOAuthDisconnect],
    (provider: string) => dataService.postIntegrationOAuthDisconnect(provider),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.integrationsList]);
        queryClient.invalidateQueries([QueryKeys.integrationOAuthStatus]);
      },
    },
  );
};

export const useIntegrationOAuthRefreshMutation = (): UseMutationResult<
  { success: boolean; expiresAt?: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.integrationOAuthRefresh],
    (provider: string) => dataService.postIntegrationOAuthRefresh(provider),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.integrationOAuthStatus]);
      },
    },
  );
};
