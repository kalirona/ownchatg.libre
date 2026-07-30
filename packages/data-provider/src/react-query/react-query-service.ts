import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UseQueryOptions,
  UseMutationResult,
  QueryObserverResult,
} from '@tanstack/react-query';
import { MCPServerConnectionStatusResponse } from '../types/queries';
import { Constants, initialModelsConfig } from '../config';
import { defaultOrderQuery } from '../types/assistants';
import * as permissions from '../accessPermissions';
import { ResourceType } from '../accessPermissions';
import * as dataService from '../data-service';
import * as m from '../types/mutations';
import * as q from '../types/queries';
import { QueryKeys, MutationKeys } from '../keys';
import * as s from '../schemas';
import * as t from '../types';
import * as prov from '../types/providers';

export { hasPermissions } from '../accessPermissions';

export const useGetSharedMessages = (
  shareId: string,
  config?: UseQueryOptions<t.TSharedMessagesResponse>,
): QueryObserverResult<t.TSharedMessagesResponse> => {
  return useQuery<t.TSharedMessagesResponse>(
    [QueryKeys.sharedMessages, shareId],
    () => dataService.getSharedMessages(shareId),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
    },
  );
};

export const useGetSharedLinkQuery = (
  conversationId: string,
  config?: UseQueryOptions<t.TSharedLinkGetResponse>,
): QueryObserverResult<t.TSharedLinkGetResponse> => {
  const queryClient = useQueryClient();
  return useQuery<t.TSharedLinkGetResponse>(
    [QueryKeys.sharedLinks, conversationId],
    () => dataService.getSharedLink(conversationId),
    {
      enabled:
        !!conversationId &&
        conversationId !== Constants.NEW_CONVO &&
        conversationId !== Constants.PENDING_CONVO,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      onSuccess: (data) => {
        queryClient.setQueryData([QueryKeys.sharedLinks, conversationId], data);
      },
      ...config,
    },
  );
};

export const useGetConversationByIdQuery = (
  id: string,
  config?: UseQueryOptions<s.TConversation>,
): QueryObserverResult<s.TConversation> => {
  return useQuery<s.TConversation>(
    [QueryKeys.conversation, id],
    () => dataService.getConversationById(id),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
    },
  );
};

//This isn't ideal because its just a query and we're using mutation, but it was the only way
//to make it work with how the Chat component is structured
export const useGetConversationByIdMutation = (id: string): UseMutationResult<s.TConversation> => {
  const queryClient = useQueryClient();
  return useMutation(() => dataService.getConversationById(id), {
    // onSuccess: (res: s.TConversation) => {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.conversation, id]);
    },
  });
};

export const useUpdateMessageMutation = (
  id: string,
): UseMutationResult<unknown, unknown, t.TUpdateMessageRequest, unknown> => {
  const queryClient = useQueryClient();
  return useMutation((payload: t.TUpdateMessageRequest) => dataService.updateMessage(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.messages, id]);
    },
  });
};

export const useUpdateMessageContentMutation = (
  conversationId: string,
): UseMutationResult<unknown, unknown, t.TUpdateMessageContent, unknown> => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: t.TUpdateMessageContent) => dataService.updateMessageContent(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.messages, conversationId]);
      },
    },
  );
};

export const useUpdateUserKeysMutation = (): UseMutationResult<
  t.TUser,
  unknown,
  t.TUpdateUserKeyRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation((payload: t.TUpdateUserKeyRequest) => dataService.updateUserKey(payload), {
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([QueryKeys.name, variables.name]);
      queryClient.invalidateQueries([QueryKeys.models]);
      /** token-config is derived from the same per-user model fetch */
      queryClient.invalidateQueries([QueryKeys.tokenConfig]);
    },
  });
};

export const useClearConversationsMutation = (): UseMutationResult<unknown> => {
  const queryClient = useQueryClient();
  return useMutation(() => dataService.clearAllConversations(), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.allConversations]);
      queryClient.invalidateQueries([QueryKeys.conversationTags]);
    },
  });
};

export const useRevokeUserKeyMutation = (name: string): UseMutationResult<unknown> => {
  const queryClient = useQueryClient();
  return useMutation(() => dataService.revokeUserKey(name), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.name, name]);
      queryClient.invalidateQueries([QueryKeys.models]);
      queryClient.invalidateQueries([QueryKeys.tokenConfig]);
      if (s.isAssistantsEndpoint(name)) {
        queryClient.invalidateQueries([QueryKeys.assistants, name, defaultOrderQuery]);
        queryClient.invalidateQueries([QueryKeys.assistantDocs]);
        queryClient.invalidateQueries([QueryKeys.assistants]);
        queryClient.invalidateQueries([QueryKeys.assistant]);
        queryClient.invalidateQueries([QueryKeys.mcpTools]);
        queryClient.invalidateQueries([QueryKeys.actions]);
        queryClient.invalidateQueries([QueryKeys.tools]);
      }
    },
  });
};

export const useRevokeAllUserKeysMutation = (): UseMutationResult<unknown> => {
  const queryClient = useQueryClient();
  return useMutation(() => dataService.revokeAllUserKeys(), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.name]);
      queryClient.invalidateQueries([QueryKeys.tokenConfig]);
      queryClient.invalidateQueries([
        QueryKeys.assistants,
        s.EModelEndpoint.assistants,
        defaultOrderQuery,
      ]);
      queryClient.invalidateQueries([
        QueryKeys.assistants,
        s.EModelEndpoint.azureAssistants,
        defaultOrderQuery,
      ]);
      queryClient.invalidateQueries([QueryKeys.assistantDocs]);
      queryClient.invalidateQueries([QueryKeys.assistants]);
      queryClient.invalidateQueries([QueryKeys.assistant]);
      queryClient.invalidateQueries([QueryKeys.mcpTools]);
      queryClient.invalidateQueries([QueryKeys.actions]);
      queryClient.invalidateQueries([QueryKeys.tools]);
      queryClient.invalidateQueries([QueryKeys.models]);
    },
  });
};

export const useGetModelsQuery = (
  config?: UseQueryOptions<t.TModelsConfig>,
): QueryObserverResult<t.TModelsConfig> => {
  return useQuery<t.TModelsConfig>([QueryKeys.models], () => dataService.getModels(), {
    initialData: initialModelsConfig,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    ...config,
  });
};

export const useCreatePresetMutation = (): UseMutationResult<
  s.TPreset,
  unknown,
  s.TPreset,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation((payload: s.TPreset) => dataService.createPreset(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.presets]);
    },
  });
};

export const useDeletePresetMutation = (): UseMutationResult<
  m.PresetDeleteResponse,
  unknown,
  s.TPreset | undefined,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation((payload: s.TPreset | undefined) => dataService.deletePreset(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.presets]);
    },
  });
};

export const useUpdateTokenCountMutation = (): UseMutationResult<
  t.TUpdateTokenCountResponse,
  unknown,
  { text: string },
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(({ text }: { text: string }) => dataService.updateTokenCount(text), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.tokenCount]);
    },
  });
};

export const useRegisterUserMutation = (
  options?: m.RegistrationOptions,
): UseMutationResult<t.TError, unknown, t.TRegisterUser, unknown> => {
  const queryClient = useQueryClient();
  return useMutation<t.TRegisterUserResponse, t.TError, t.TRegisterUser>(
    (payload: t.TRegisterUser) => dataService.register(payload),
    {
      ...options,
      onSuccess: (...args) => {
        queryClient.invalidateQueries([QueryKeys.user]);
        if (options?.onSuccess) {
          options.onSuccess(...args);
        }
      },
    },
  );
};

export const useUserKeyQuery = (
  name: string,
  config?: UseQueryOptions<t.TCheckUserKeyResponse>,
): QueryObserverResult<t.TCheckUserKeyResponse> => {
  return useQuery<t.TCheckUserKeyResponse>(
    [QueryKeys.name, name],
    () => {
      if (!name) {
        return Promise.resolve({ expiresAt: '' });
      }
      return dataService.userKeyQuery(name);
    },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
      ...config,
    },
  );
};

export const useRequestPasswordResetMutation = (): UseMutationResult<
  t.TRequestPasswordResetResponse,
  unknown,
  t.TRequestPasswordReset,
  unknown
> => {
  return useMutation((payload: t.TRequestPasswordReset) =>
    dataService.requestPasswordReset(payload),
  );
};

export const useResetPasswordMutation = (): UseMutationResult<
  unknown,
  unknown,
  t.TResetPassword,
  unknown
> => {
  return useMutation((payload: t.TResetPassword) => dataService.resetPassword(payload));
};

export const useAvailablePluginsQuery = <TData = s.TPlugin[]>(
  config?: UseQueryOptions<s.TPlugin[], unknown, TData>,
): QueryObserverResult<TData> => {
  return useQuery<s.TPlugin[], unknown, TData>(
    [QueryKeys.availablePlugins],
    () => dataService.getAvailablePlugins(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
    },
  );
};

export const useUpdateUserPluginsMutation = (
  _options?: m.UpdatePluginAuthOptions,
): UseMutationResult<t.TUser, unknown, t.TUpdateUserPlugins, unknown> => {
  const queryClient = useQueryClient();
  const { onSuccess, ...options } = _options ?? {};
  return useMutation((payload: t.TUpdateUserPlugins) => dataService.updateUserPlugins(payload), {
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries([QueryKeys.user]);
      onSuccess?.(...args);
      if (args[1]?.action === 'uninstall' && args[1]?.pluginKey?.startsWith(Constants.mcp_prefix)) {
        const serverName = args[1]?.pluginKey?.substring(Constants.mcp_prefix.length);
        queryClient.invalidateQueries([QueryKeys.mcpAuthValues, serverName]);
      }
    },
  });
};

export const useReinitializeMCPServerMutation = (): UseMutationResult<
  {
    success: boolean;
    message: string;
    serverName: string;
    oauthRequired?: boolean;
    oauthUrl?: string;
  },
  unknown,
  string,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation((serverName: string) => dataService.reinitializeMCPServer(serverName), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.mcpTools]);
    },
  });
};

export const useCancelMCPOAuthMutation = (): UseMutationResult<
  m.CancelMCPOAuthResponse,
  unknown,
  string,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation((serverName: string) => dataService.cancelMCPOAuth(serverName), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.mcpConnectionStatus]);
    },
  });
};

export const useGetCustomConfigSpeechQuery = (
  config?: UseQueryOptions<t.TCustomConfigSpeechResponse>,
): QueryObserverResult<t.TCustomConfigSpeechResponse> => {
  return useQuery<t.TCustomConfigSpeechResponse>(
    [QueryKeys.customConfigSpeech],
    () => dataService.getCustomConfigSpeech(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
    },
  );
};

export const useUpdateFeedbackMutation = (
  conversationId: string,
  messageId: string,
): UseMutationResult<t.TUpdateFeedbackResponse, Error, t.TUpdateFeedbackRequest> => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: t.TUpdateFeedbackRequest) =>
      dataService.updateFeedback(conversationId, messageId, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.messages, messageId]);
      },
    },
  );
};

export const useSearchPrincipalsQuery = (
  params: q.PrincipalSearchParams,
  config?: UseQueryOptions<q.PrincipalSearchResponse>,
): QueryObserverResult<q.PrincipalSearchResponse> => {
  return useQuery<q.PrincipalSearchResponse>(
    [QueryKeys.principalSearch, params],
    () => dataService.searchPrincipals(params),
    {
      enabled: !!params.q && params.q.length >= 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 30000,
      ...config,
    },
  );
};

export const useGetAccessRolesQuery = (
  resourceType: ResourceType,
  config?: UseQueryOptions<q.AccessRolesResponse>,
): QueryObserverResult<q.AccessRolesResponse> => {
  return useQuery<q.AccessRolesResponse>(
    [QueryKeys.accessRoles, resourceType],
    () => dataService.getAccessRoles(resourceType),
    {
      enabled: !!resourceType,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      ...config,
    },
  );
};

export const useGetResourcePermissionsQuery = (
  resourceType: ResourceType,
  resourceId: string,
  config?: UseQueryOptions<permissions.TGetResourcePermissionsResponse>,
): QueryObserverResult<permissions.TGetResourcePermissionsResponse> => {
  return useQuery<permissions.TGetResourcePermissionsResponse>(
    [QueryKeys.resourcePermissions, resourceType, resourceId],
    () => dataService.getResourcePermissions(resourceType, resourceId),
    {
      enabled: !!resourceType && !!resourceId,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 2 * 60 * 1000, // Cache for 2 minutes
      ...config,
    },
  );
};

export const useUpdateResourcePermissionsMutation = (): UseMutationResult<
  permissions.TUpdateResourcePermissionsResponse,
  Error,
  {
    resourceType: ResourceType;
    resourceId: string;
    data: permissions.TUpdateResourcePermissionsRequest;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resourceType, resourceId, data }) =>
      dataService.updateResourcePermissions(resourceType, resourceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.accessRoles, variables.resourceType],
      });

      queryClient.invalidateQueries({
        queryKey: [QueryKeys.resourcePermissions, variables.resourceType, variables.resourceId],
      });

      queryClient.invalidateQueries({
        queryKey: [QueryKeys.effectivePermissions, variables.resourceType, variables.resourceId],
      });
    },
  });
};

export const useGetEffectivePermissionsQuery = (
  resourceType: ResourceType,
  resourceId: string,
  config?: UseQueryOptions<permissions.TEffectivePermissionsResponse>,
): QueryObserverResult<permissions.TEffectivePermissionsResponse> => {
  return useQuery<permissions.TEffectivePermissionsResponse>({
    queryKey: [QueryKeys.effectivePermissions, resourceType, resourceId],
    queryFn: () => dataService.getEffectivePermissions(resourceType, resourceId),
    enabled: !!resourceType && !!resourceId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    ...config,
  });
};

export const useGetAllEffectivePermissionsQuery = (
  resourceType: ResourceType,
  config?: UseQueryOptions<permissions.TAllEffectivePermissionsResponse>,
): QueryObserverResult<permissions.TAllEffectivePermissionsResponse> => {
  return useQuery<permissions.TAllEffectivePermissionsResponse>({
    queryKey: [QueryKeys.effectivePermissions, 'all', resourceType],
    queryFn: () => dataService.getAllEffectivePermissions(resourceType),
    enabled: !!resourceType,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    ...config,
  });
};

export const useMCPServerConnectionStatusQuery = (
  serverName: string,
  config?: UseQueryOptions<MCPServerConnectionStatusResponse>,
): QueryObserverResult<MCPServerConnectionStatusResponse> => {
  return useQuery<MCPServerConnectionStatusResponse>(
    [QueryKeys.mcpConnectionStatus, serverName],
    () => dataService.getMCPServerConnectionStatus(serverName),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 10000, // 10 seconds
      enabled: !!serverName,
      ...config,
    },
  );
};

export const useGetAgentApiKeysQuery = (
  config?: UseQueryOptions<t.TAgentApiKeyListResponse>,
): QueryObserverResult<t.TAgentApiKeyListResponse> => {
  return useQuery<t.TAgentApiKeyListResponse>(
    [QueryKeys.agentApiKeys],
    () => dataService.getAgentApiKeys(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
    },
  );
};

export const useCreateAgentApiKeyMutation = (): UseMutationResult<
  t.TAgentApiKeyCreateResponse,
  unknown,
  t.TAgentApiKeyCreateRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: t.TAgentApiKeyCreateRequest) => dataService.createAgentApiKey(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.agentApiKeys]);
      },
    },
  );
};

export const useDeleteAgentApiKeyMutation = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();
  return useMutation((id: string) => dataService.deleteAgentApiKey(id), {
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.agentApiKeys]);
    },
  });
};

/* Image Generation */
export const useGetImageGenProviders = (
  config?: UseQueryOptions<t.TImageGenProvider[]>,
): QueryObserverResult<t.TImageGenProvider[]> => {
  return useQuery<t.TImageGenProvider[]>(
    [QueryKeys.imageGenProviders],
    () => dataService.getImageGenProviders(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
    },
  );
};

export const useGetImageGenHistory = (
  params?: { page?: number; limit?: number; favorite?: string },
  config?: UseQueryOptions<t.TImageGenHistoryResponse>,
): QueryObserverResult<t.TImageGenHistoryResponse> => {
  return useQuery<t.TImageGenHistoryResponse>(
    [QueryKeys.imageGenHistory, params],
    () => dataService.getImageGenHistory(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
    },
  );
};

export const useGenerateImagesMutation = (): UseMutationResult<
  t.TImageGenResponse,
  Error,
  t.TImageGenRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.generateImages],
    (payload: t.TImageGenRequest) => dataService.generateImages(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.imageGenHistory]);
      },
    },
  );
};

export const useDeleteImageGenHistoryMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteImageGenHistory],
    (id: string) => dataService.deleteImageGenHistoryEntry(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.imageGenHistory]);
      },
    },
  );
};

export const useToggleImageGenFavoriteMutation = (): UseMutationResult<
  { favorite: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.toggleImageGenFavorite],
    (id: string) => dataService.toggleImageGenFavorite(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.imageGenHistory]);
      },
    },
  );
};

/* Video Generation */
export const useGetVideoGenProviders = (
  config?: UseQueryOptions<t.TVideoGenProvider[]>,
): QueryObserverResult<t.TVideoGenProvider[]> => {
  return useQuery<t.TVideoGenProvider[]>(
    [QueryKeys.videoGenProviders],
    () => dataService.getVideoGenProviders(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
    },
  );
};

export const useGetVideoGenDurationLimits = (
  params: { provider: string; model?: string },
  config?: UseQueryOptions<t.TVideoGenDurationLimits>,
): QueryObserverResult<t.TVideoGenDurationLimits> => {
  return useQuery<t.TVideoGenDurationLimits>(
    [QueryKeys.videoGenProviders, params],
    () => dataService.getVideoGenDurationLimits(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!params.provider,
      ...config,
    },
  );
};

export const useGetVideoGenHistory = (
  params?: { page?: number; limit?: number; status?: string; favorite?: string },
  config?: UseQueryOptions<t.TVideoGenHistoryResponse>,
): QueryObserverResult<t.TVideoGenHistoryResponse> => {
  return useQuery<t.TVideoGenHistoryResponse>(
    [QueryKeys.videoGenHistory, params],
    () => dataService.getVideoGenHistory(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
    },
  );
};

export const useGetVideoGenStatus = (
  id: string | null,
  config?: UseQueryOptions<t.TVideoGenStatusResponse>,
): QueryObserverResult<t.TVideoGenStatusResponse> => {
  return useQuery<t.TVideoGenStatusResponse>(
    [QueryKeys.videoGenStatus, id],
    () => dataService.getVideoGenStatus(id!),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!id,
      refetchInterval: (data) => {
        if (data?.status === 'completed' || data?.status === 'failed') {
          return false;
        }
        return 3000;
      },
      ...config,
    },
  );
};

export const useGenerateVideoMutation = (): UseMutationResult<
  t.TVideoGenResponse,
  Error,
  t.TVideoGenRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.generateVideo],
    (payload: t.TVideoGenRequest) => dataService.generateVideo(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.videoGenHistory]);
      },
    },
  );
};

export const useDeleteVideoGenHistoryMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteVideoGenHistory],
    (id: string) => dataService.deleteVideoGenHistoryEntry(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.videoGenHistory]);
      },
    },
  );
};

export const useToggleVideoGenFavoriteMutation = (): UseMutationResult<
  { favorite: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.toggleVideoGenFavorite],
    (id: string) => dataService.toggleVideoGenFavorite(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.videoGenHistory]);
      },
    },
  );
};

/* ── Provider Management (AI Infrastructure) ─────────────────────────── */

export const useGetProviderOverview = (
  config?: UseQueryOptions<prov.TProviderOverview>,
): QueryObserverResult<prov.TProviderOverview> => {
  return useQuery<prov.TProviderOverview>(
    [QueryKeys.providerOverview],
    () => dataService.getProviderOverview(),
    { ...config },
  );
};

export const useGetProvidersList = (
  category?: string,
  config?: UseQueryOptions<prov.TAIProvider[]>,
): QueryObserverResult<prov.TAIProvider[]> => {
  return useQuery<prov.TAIProvider[]>(
    [QueryKeys.providersList, category],
    () => dataService.getProvidersList(category),
    { ...config },
  );
};

export const useGetProviderById = (
  id: string,
  config?: UseQueryOptions<prov.TAIProvider>,
): QueryObserverResult<prov.TAIProvider> => {
  return useQuery<prov.TAIProvider>(
    [QueryKeys.providerDetail, id],
    () => dataService.getProviderById(id),
    { enabled: !!id, ...config },
  );
};

export const useGetProviderKeys = (
  providerId: string,
  config?: UseQueryOptions<prov.TProviderKey[]>,
): QueryObserverResult<prov.TProviderKey[]> => {
  return useQuery<prov.TProviderKey[]>(
    [QueryKeys.providerKeys, providerId],
    () => dataService.getProviderKeys(providerId),
    { enabled: !!providerId, ...config },
  );
};

export const useGetProviderModels = (
  providerId: string,
  config?: UseQueryOptions<prov.TProviderModel[]>,
): QueryObserverResult<prov.TProviderModel[]> => {
  return useQuery<prov.TProviderModel[]>(
    [QueryKeys.providerModels, providerId],
    () => dataService.getProviderModels(providerId),
    { enabled: !!providerId, ...config },
  );
};

export const useGetRoutingRules = (
  category?: string,
  config?: UseQueryOptions<prov.TRoutingRule[]>,
): QueryObserverResult<prov.TRoutingRule[]> => {
  return useQuery<prov.TRoutingRule[]>(
    [QueryKeys.routingRules, category],
    () => dataService.getRoutingRules(category),
    { ...config },
  );
};

export const useGetProviderUsage = (
  providerId?: string,
  days?: number,
  config?: UseQueryOptions<prov.TProviderUsage[]>,
): QueryObserverResult<prov.TProviderUsage[]> => {
  return useQuery<prov.TProviderUsage[]>(
    [QueryKeys.providerUsage, providerId, days],
    () => dataService.getProviderUsage(providerId, days),
    { ...config },
  );
};

export const useGetProviderCosts = (
  days?: number,
  config?: UseQueryOptions<prov.TProviderCostSummary[]>,
): QueryObserverResult<prov.TProviderCostSummary[]> => {
  return useQuery<prov.TProviderCostSummary[]>(
    [QueryKeys.providerCosts, days],
    () => dataService.getProviderCosts(days),
    { ...config },
  );
};

export const useGetProviderHealthHistory = (
  providerId: string,
  days?: number,
  config?: UseQueryOptions<prov.TProviderHealthEntry[]>,
): QueryObserverResult<prov.TProviderHealthEntry[]> => {
  return useQuery<prov.TProviderHealthEntry[]>(
    [QueryKeys.providerHealthHistory, providerId, days],
    () => dataService.getProviderHealthHistory(providerId, days),
    { enabled: !!providerId, ...config },
  );
};

export const useGetSystemDefaults = (
  config?: UseQueryOptions<prov.TSystemDefault[]>,
): QueryObserverResult<prov.TSystemDefault[]> => {
  return useQuery<prov.TSystemDefault[]>(
    [QueryKeys.systemDefaults],
    () => dataService.getSystemDefaults(),
    { ...config },
  );
};

/* ── Provider Management Mutations ───────────────────────────────────── */

export const useCreateProviderMutation = (): UseMutationResult<
  prov.TAIProvider,
  Error,
  Partial<prov.TAIProvider>
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.createProvider],
    (data) => dataService.createProvider(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.providersList]);
      },
    },
  );
};

export const useUpdateProviderMutation = (): UseMutationResult<
  prov.TAIProvider,
  Error,
  { id: string; data: Partial<prov.TAIProvider> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.updateProvider],
    ({ id, data }) => dataService.updateProvider(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.providersList]);
        queryClient.invalidateQueries([QueryKeys.providerDetail]);
      },
    },
  );
};

export const useDeleteProviderMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteProvider],
    (id) => dataService.deleteProvider(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.providersList]);
      },
    },
  );
};

export const useCreateProviderKeyMutation = (): UseMutationResult<
  prov.TProviderKey,
  Error,
  { providerId: string; data: prov.TProviderKeyCreate }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.createProviderKey],
    ({ providerId, data }) => dataService.createProviderKey(providerId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.providerKeys]);
      },
    },
  );
};

export const useTestProviderKeyMutation = (): UseMutationResult<
  { healthy: boolean; latencyMs: number; errorMessage?: string },
  Error,
  string
> => {
  return useMutation(
    [MutationKeys.testProviderKey],
    (keyId) => dataService.testProviderKey(keyId),
  );
};

export const useDeleteProviderKeyMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteProviderKey],
    (keyId) => dataService.deleteProviderKey(keyId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.providerKeys]);
      },
    },
  );
};

export const useCreateProviderModelMutation = (): UseMutationResult<
  prov.TProviderModel,
  Error,
  { providerId: string; data: Partial<prov.TProviderModel> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.createProviderModel],
    ({ providerId, data }) => dataService.createProviderModel(providerId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.providerModels]);
      },
    },
  );
};

export const useUpdateProviderModelMutation = (): UseMutationResult<
  prov.TProviderModel,
  Error,
  { modelId: string; data: Partial<prov.TProviderModel> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.updateProviderModel],
    ({ modelId, data }) => dataService.updateProviderModel(modelId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.providerModels]);
      },
    },
  );
};

export const useDeleteProviderModelMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteProviderModel],
    (modelId) => dataService.deleteProviderModel(modelId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.providerModels]);
      },
    },
  );
};

export const useCreateRoutingRuleMutation = (): UseMutationResult<
  prov.TRoutingRule,
  Error,
  Partial<prov.TRoutingRule>
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.createRoutingRule],
    (data) => dataService.createRoutingRule(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.routingRules]);
      },
    },
  );
};

export const useUpdateRoutingRuleMutation = (): UseMutationResult<
  prov.TRoutingRule,
  Error,
  { id: string; data: Partial<prov.TRoutingRule> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.updateRoutingRule],
    ({ id, data }) => dataService.updateRoutingRule(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.routingRules]);
      },
    },
  );
};

export const useDeleteRoutingRuleMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteRoutingRule],
    (id) => dataService.deleteRoutingRule(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.routingRules]);
      },
    },
  );
};

export const useUpsertSystemDefaultMutation = (): UseMutationResult<
  prov.TSystemDefault,
  Error,
  prov.TSystemDefault
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.upsertSystemDefault],
    (data) => dataService.upsertSystemDefault(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.systemDefaults]);
      },
    },
  );
};
