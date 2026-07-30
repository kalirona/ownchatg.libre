import type { AxiosResponse } from 'axios';
import type { TFileConfig } from './file-config';
import type * as t from './types';
import * as permissions from './accessPermissions';
import * as endpoints from './api-endpoints';
import * as mcp from './types/mcpServers';
import * as a from './types/assistants';
import * as m from './types/mutations';
import * as ag from './types/agents';
import * as q from './types/queries';
import * as sk from './types/skills';
import * as f from './types/files';
import * as config from './config';
import request from './request';
import * as s from './schemas';
import * as r from './roles';
import * as prov from './types/providers';
import * as media from './types/media';

export function revokeUserKey(name: string): Promise<unknown> {
  return request.delete(endpoints.revokeUserKey(name));
}

export function revokeAllUserKeys(): Promise<unknown> {
  return request.delete(endpoints.revokeAllUserKeys());
}

export function deleteUser(payload?: t.TDeleteUserRequest): Promise<unknown> {
  return request.deleteWithOptions(endpoints.deleteUser(), { data: payload });
}

export function getFavorites(): Promise<q.TUserFavorite[]> {
  return request.get(`${endpoints.apiBaseUrl()}/api/user/settings/favorites`);
}

export function updateFavorites(favorites: q.TUserFavorite[]): Promise<q.TUserFavorite[]> {
  return request.post(`${endpoints.apiBaseUrl()}/api/user/settings/favorites`, { favorites });
}

/** Tool favorites — starred marketplace items (builtins, tools, MCP servers, skills). */
export function getToolFavorites(): Promise<q.TToolFavorite[]> {
  return request.get(endpoints.toolFavorites());
}

export function addToolFavorite(favorite: q.TToolFavorite): Promise<q.TToolFavorite> {
  return request.put(endpoints.toolFavorite(favorite.itemType, favorite.itemId));
}

export function removeToolFavorite(favorite: q.TToolFavorite): Promise<{ ok: boolean }> {
  return request.delete(endpoints.toolFavorite(favorite.itemType, favorite.itemId));
}

/** Per-user skill active/inactive overrides. */
export function getSkillStates(): Promise<sk.TSkillStatesResponse> {
  return request.get(endpoints.skillStates());
}

export function updateSkillStates(
  skillStates: sk.TSkillStatesResponse,
): Promise<sk.TSkillStatesResponse> {
  return request.post(endpoints.skillStates(), { skillStates });
}

export function getSharedMessages(shareId: string): Promise<t.TSharedMessagesResponse> {
  return request.get(endpoints.shareMessages(shareId));
}

export function getSharedStartupConfig(shareId: string): Promise<config.TSharedLinkStartupConfig> {
  return request.get(endpoints.sharedStartupConfig(shareId));
}

export const listSharedLinks = async (
  params: q.SharedLinksListParams,
): Promise<q.SharedLinksResponse> => {
  const { pageSize, sortBy, sortDirection, search, cursor } = params;

  return request.get(endpoints.getSharedLinks(pageSize, sortBy, sortDirection, search, cursor));
};

export function getSharedLink(conversationId: string): Promise<t.TSharedLinkGetResponse> {
  return request.get(endpoints.getSharedLink(conversationId));
}

export function createSharedLink(
  conversationId: string,
  targetMessageId?: string,
  snapshotFiles?: boolean,
): Promise<t.TSharedLinkResponse> {
  return request.post(endpoints.createSharedLink(conversationId), {
    targetMessageId,
    snapshotFiles,
  });
}

export function updateSharedLink(
  shareId: string,
  targetMessageId?: string,
  snapshotFiles?: boolean,
): Promise<t.TSharedLinkResponse> {
  return request.patch(endpoints.updateSharedLink(shareId), { targetMessageId, snapshotFiles });
}

export function deleteSharedLink(shareId: string): Promise<m.TDeleteSharedLinkResponse> {
  return request.delete(endpoints.shareMessages(shareId));
}

export function updateUserKey(payload: t.TUpdateUserKeyRequest) {
  const { value } = payload;
  if (!value) {
    throw new Error('value is required');
  }

  return request.put(endpoints.keys(), payload);
}

export function getAgentApiKeys(): Promise<t.TAgentApiKeyListResponse> {
  return request.get(endpoints.apiKeys());
}

export function createAgentApiKey(
  payload: t.TAgentApiKeyCreateRequest,
): Promise<t.TAgentApiKeyCreateResponse> {
  return request.post(endpoints.apiKeys(), payload);
}

export function deleteAgentApiKey(id: string): Promise<void> {
  return request.delete(endpoints.apiKeyById(id));
}

export function getPresets(): Promise<s.TPreset[]> {
  return request.get(endpoints.presets());
}

export function createPreset(payload: s.TPreset): Promise<s.TPreset> {
  return request.post(endpoints.presets(), payload);
}

export function updatePreset(payload: s.TPreset): Promise<s.TPreset> {
  return request.post(endpoints.presets(), payload);
}

export function deletePreset(arg: s.TPreset | undefined): Promise<m.PresetDeleteResponse> {
  return request.post(endpoints.deletePreset(), arg);
}

export function getSearchEnabled(): Promise<boolean> {
  return request.get(endpoints.searchEnabled());
}

export function getUser(): Promise<t.TUser> {
  return request.get(endpoints.user());
}

export function updateUserProfile(payload: t.TUpdateUserProfile): Promise<t.TUser> {
  return request.put(endpoints.userProfile(), payload);
}

export function getUserBalance(): Promise<t.TBalanceResponse> {
  return request.get(endpoints.balance());
}

export const updateTokenCount = (text: string) => {
  return request.post(endpoints.tokenizer(), { arg: text });
};

export const login = (payload: t.TLoginUser): Promise<t.TLoginResponse> => {
  return request.post(endpoints.login(), payload);
};

export const logout = (): Promise<m.TLogoutResponse> => {
  return request.post(endpoints.logout());
};

export const register = (payload: t.TRegisterUser) => {
  return request.post(endpoints.register(), payload);
};

export const userKeyQuery = (name: string): Promise<t.TCheckUserKeyResponse> =>
  request.get(endpoints.userKeyQuery(name));

export const getLoginGoogle = () => {
  return request.get(endpoints.loginGoogle());
};

export const requestPasswordReset = (
  payload: t.TRequestPasswordReset,
): Promise<t.TRequestPasswordResetResponse> => {
  return request.post(endpoints.requestPasswordReset(), payload);
};

export const resetPassword = (payload: t.TResetPassword) => {
  return request.post(endpoints.resetPassword(), payload);
};

export const verifyEmail = (payload: t.TVerifyEmail): Promise<t.VerifyEmailResponse> => {
  return request.post(endpoints.verifyEmail(), payload);
};

export const resendVerificationEmail = (
  payload: t.TResendVerificationEmail,
): Promise<t.VerifyEmailResponse> => {
  return request.post(endpoints.resendVerificationEmail(), payload);
};

export const getAvailablePlugins = (): Promise<s.TPlugin[]> => {
  return request.get(endpoints.plugins());
};

/* Billing */
export const getBillingPlans = (): Promise<t.TSubscriptionPlan[]> => {
  return request.get(endpoints.billingPlans());
};

export const getBillingCreditPacks = (): Promise<t.TCreditPack[]> => {
  return request.get(endpoints.billingCreditPacks());
};

export const createBillingCheckout = (
  payload: t.TCreateCheckoutRequest,
): Promise<t.TCreateCheckoutResponse> => {
  return request.post(endpoints.billingCreateCheckout(), payload);
};

export const createBillingPortal = (): Promise<t.TCreatePortalResponse> => {
  return request.post(endpoints.billingCreatePortal());
};

export const getUserSubscription = (): Promise<t.TUserSubscription | null> => {
  return request.get(endpoints.billingSubscription());
};

export const cancelBillingSubscription = (): Promise<{ message: string }> => {
  return request.post(endpoints.billingSubscriptionCancel());
};

export const getPaymentTransactions = (): Promise<t.TPaymentTransaction[]> => {
  return request.get(endpoints.billingTransactions());
};

export const updateUserPlugins = (payload: t.TUpdateUserPlugins) => {
  return request.post(endpoints.userPlugins(), payload);
};

export const reinitializeMCPServer = (serverName: string) => {
  return request.post(endpoints.mcpReinitialize(serverName));
};

export const bindMCPOAuth = (serverName: string): Promise<{ success: boolean }> => {
  return request.post(endpoints.mcpOAuthBind(serverName));
};

export const bindActionOAuth = (actionId: string): Promise<{ success: boolean }> => {
  return request.post(endpoints.actionOAuthBind(actionId));
};

export const getMCPConnectionStatus = (): Promise<q.MCPConnectionStatusResponse> => {
  return request.get(endpoints.mcpConnectionStatus());
};

export const getMCPServerConnectionStatus = (
  serverName: string,
): Promise<q.MCPServerConnectionStatusResponse> => {
  return request.get(endpoints.mcpServerConnectionStatus(serverName));
};

export const getMCPAuthValues = (serverName: string): Promise<q.MCPAuthValuesResponse> => {
  return request.get(endpoints.mcpAuthValues(serverName));
};

export function cancelMCPOAuth(serverName: string): Promise<m.CancelMCPOAuthResponse> {
  return request.post(endpoints.cancelMCPOAuth(serverName), {});
}

/* Config */

export type StartupConfigOptions = {
  context?: config.StartupConfigContext;
};

export const getStartupConfig = (
  options?: StartupConfigOptions,
): Promise<
  config.TStartupConfig & {
    mcpCustomUserVars?: Record<string, { title: string; description: string }>;
  }
> => {
  return request.get(endpoints.config(options?.context));
};

export const getAIEndpoints = (): Promise<t.TEndpointsConfig> => {
  return request.get(endpoints.aiEndpoints());
};

export const getTokenConfig = (): Promise<t.TTokenConfigMap> => {
  return request.get(endpoints.tokenConfig());
};

export const getModels = async (): Promise<t.TModelsConfig> => {
  return request.get(endpoints.models());
};

/* Assistants */

export const createAssistant = ({
  version,
  ...data
}: a.AssistantCreateParams): Promise<a.Assistant> => {
  return request.post(endpoints.assistants({ version }), data);
};

export const getAssistantById = ({
  endpoint,
  assistant_id,
  version,
}: {
  endpoint: s.AssistantsEndpoint;
  assistant_id: string;
  version: number | string | number;
}): Promise<a.Assistant> => {
  return request.get(
    endpoints.assistants({
      path: assistant_id,
      endpoint,
      version,
    }),
  );
};

export const updateAssistant = ({
  assistant_id,
  data,
  version,
}: {
  assistant_id: string;
  data: a.AssistantUpdateParams;
  version: number | string;
}): Promise<a.Assistant> => {
  return request.patch(
    endpoints.assistants({
      path: assistant_id,
      version,
    }),
    data,
  );
};

export const deleteAssistant = ({
  assistant_id,
  model,
  endpoint,
  version,
}: m.DeleteAssistantBody & { version: number | string }): Promise<void> => {
  return request.delete(
    endpoints.assistants({
      path: assistant_id,
      options: { model, endpoint },
      version,
    }),
  );
};

export const listAssistants = (
  params: a.AssistantListParams,
  version: number | string,
): Promise<a.AssistantListResponse> => {
  return request.get(
    endpoints.assistants({
      version,
      options: params,
    }),
  );
};

export function getAssistantDocs({
  endpoint,
  version,
}: {
  endpoint: s.AssistantsEndpoint | string;
  version: number | string;
}): Promise<a.AssistantDocument[]> {
  if (!s.isAssistantsEndpoint(endpoint)) {
    return Promise.resolve([]);
  }
  return request.get(
    endpoints.assistants({
      path: 'documents',
      version,
      options: { endpoint },
      endpoint: endpoint as s.AssistantsEndpoint,
    }),
  );
}

/* Tools */

export const getAvailableTools = (
  _endpoint: s.AssistantsEndpoint | s.EModelEndpoint.agents,
  version?: number | string,
): Promise<s.TPlugin[]> => {
  let path = '';
  if (s.isAssistantsEndpoint(_endpoint)) {
    const endpoint = _endpoint as s.AssistantsEndpoint;
    path = endpoints.assistants({
      path: 'tools',
      endpoint: endpoint,
      version: version ?? config.defaultAssistantsVersion[endpoint],
    });
  } else {
    path = endpoints.agents({
      path: 'tools',
    });
  }

  return request.get(path);
};

/* MCP Tools - Decoupled from regular tools */

export const getMCPTools = (): Promise<q.MCPServersResponse> => {
  return request.get(endpoints.mcp.tools);
};

export const getVerifyAgentToolAuth = (
  params: q.VerifyToolAuthParams,
): Promise<q.VerifyToolAuthResponse> => {
  return request.get(
    endpoints.agents({
      path: `tools/${params.toolId}/auth`,
    }),
  );
};

export const callTool = <T extends m.ToolId>({
  toolId,
  toolParams,
}: {
  toolId: T;
  toolParams: m.ToolParams<T>;
}): Promise<m.ToolCallResponse> => {
  return request.post(
    endpoints.agents({
      path: `tools/${toolId}/call`,
    }),
    toolParams,
  );
};

export const getToolCalls = (params: q.GetToolCallParams): Promise<q.ToolCallResults> => {
  return request.get(
    endpoints.agents({
      path: 'tools/calls',
      options: params,
    }),
  );
};

/* Files */

export const getFiles = (): Promise<f.TFile[]> => {
  return request.get(endpoints.files());
};

/**
 * Poll the lifecycle of an inline file preview. Returns the smallest
 * shape needed to drive the UI:
 *   - `status` always present (defaults to `'ready'` server-side for
 *     legacy records that pre-date the field).
 *   - `text` and `textFormat` only when `status === 'ready'` and text
 *     was extracted (preserves the HTML-or-null security contract).
 *   - `previewError` only when `status === 'failed'`.
 *
 * Called from `useFilePreview`; React Query's `refetchInterval`
 * polls while `status === 'pending'` and stops on terminal status.
 */
export const getFilePreview = (fileId: string): Promise<f.TFilePreview> => {
  return request.get(endpoints.filePreview(fileId));
};

/** Preview status for a snapshotted file served through a shared link. */
export const getSharedFilePreview = (shareId: string, fileId: string): Promise<f.TFilePreview> => {
  return request.get(endpoints.sharedFilePreview(shareId, fileId));
};

export const getAgentFiles = (agentId: string): Promise<f.TFile[]> => {
  return request.get(endpoints.agentFiles(agentId));
};

export const getFileConfig = (): Promise<TFileConfig> => {
  return request.get(`${endpoints.files()}/config`);
};

export const uploadImage = (
  data: FormData,
  signal?: AbortSignal | null,
): Promise<f.TFileUpload> => {
  const requestConfig = signal ? { signal } : undefined;
  return request.postMultiPart(endpoints.images(), data, requestConfig);
};

export const uploadFile = (data: FormData, signal?: AbortSignal | null): Promise<f.TFileUpload> => {
  const requestConfig = signal ? { signal } : undefined;
  return request.postMultiPart(endpoints.files(), data, requestConfig);
};

/* actions */

export const updateAction = (data: m.UpdateActionVariables): Promise<m.UpdateActionResponse> => {
  const { assistant_id, version, ...body } = data;
  return request.post(
    endpoints.assistants({
      path: `actions/${assistant_id}`,
      version,
    }),
    body,
  );
};

export function getActions(): Promise<ag.Action[]> {
  return request.get(
    endpoints.agents({
      path: 'actions',
    }),
  );
}

export const deleteAction = async ({
  assistant_id,
  action_id,
  model,
  version,
  endpoint,
}: m.DeleteActionVariables & { version: number | string }): Promise<void> =>
  request.delete(
    endpoints.assistants({
      path: `actions/${assistant_id}/${action_id}/${model}`,
      version,
      endpoint,
    }),
  );

/**
 * Agents
 */

export const createAgent = ({ ...data }: a.AgentCreateParams): Promise<a.Agent> => {
  return request.post(endpoints.agents({}), data);
};

export const getAgentById = ({ agent_id }: { agent_id: string }): Promise<a.Agent> => {
  return request.get(
    endpoints.agents({
      path: agent_id,
    }),
  );
};

export const getExpandedAgentById = ({ agent_id }: { agent_id: string }): Promise<a.Agent> => {
  return request.get(
    endpoints.agents({
      path: `${agent_id}/expanded`,
    }),
  );
};

export const getAgentVersions = ({ agent_id }: { agent_id: string }): Promise<a.Agent[]> => {
  return request.get(
    endpoints.agents({
      path: `${agent_id}/versions`,
    }),
  );
};

export const updateAgent = ({
  agent_id,
  data,
}: {
  agent_id: string;
  data: a.AgentUpdateParams;
}): Promise<a.Agent> => {
  return request.patch(
    endpoints.agents({
      path: agent_id,
    }),
    data,
  );
};

export const duplicateAgent = ({
  agent_id,
}: m.DuplicateAgentBody): Promise<{ agent: a.Agent; actions: ag.Action[] }> => {
  return request.post(
    endpoints.agents({
      path: `${agent_id}/duplicate`,
    }),
  );
};

export const deleteAgent = ({ agent_id }: m.DeleteAgentBody): Promise<void> => {
  return request.delete(
    endpoints.agents({
      path: agent_id,
    }),
  );
};

export const listAgents = (params: a.AgentListParams): Promise<a.AgentListResponse> => {
  return request.get(
    endpoints.agents({
      options: params,
    }),
  );
};

export const revertAgentVersion = ({
  agent_id,
  version_index,
}: {
  agent_id: string;
  version_index: number;
}): Promise<a.Agent> => request.post(endpoints.revertAgentVersion(agent_id), { version_index });

/* Marketplace */

/**
 * Get agent categories with counts for marketplace tabs
 */
export const getAgentCategories = (): Promise<t.TMarketplaceCategory[]> => {
  return request.get(endpoints.agents({ path: 'categories' }));
};

/**
 * Unified marketplace agents endpoint with query string controls
 */
export const getMarketplaceAgents = (params: {
  requiredPermission: number;
  category?: string;
  search?: string;
  limit?: number;
  cursor?: string;
  promoted?: 0 | 1;
}): Promise<a.AgentListResponse> => {
  return request.get(
    endpoints.agents({
      // path: 'marketplace',
      options: params,
    }),
  );
};

/* Tools */

export const getAvailableAgentTools = (): Promise<s.TPlugin[]> => {
  return request.get(
    endpoints.agents({
      path: 'tools',
    }),
  );
};

/* Actions */

export const updateAgentAction = (
  data: m.UpdateAgentActionVariables,
): Promise<m.UpdateAgentActionResponse> => {
  const { agent_id, ...body } = data;
  return request.post(
    endpoints.agents({
      path: `actions/${agent_id}`,
    }),
    body,
  );
};

export const deleteAgentAction = async ({
  agent_id,
  action_id,
}: m.DeleteAgentActionVariables): Promise<void> =>
  request.delete(
    endpoints.agents({
      path: `actions/${agent_id}/${action_id}`,
    }),
  );

/**
 * MCP Servers
 */

/**
 *
 * Ensure and List loaded mcp server configs from the cache Enriched with effective permissions.
 */
export const getMCPServers = async (): Promise<mcp.MCPServersListResponse> => {
  return request.get(endpoints.mcp.servers);
};

/**
 * Get a single MCP server by ID
 */
export const getMCPServer = async (serverName: string): Promise<mcp.MCPServerDBObjectResponse> => {
  return request.get(endpoints.mcpServer(serverName));
};

/**
 * Create a new MCP server
 */
export const createMCPServer = async (
  data: mcp.MCPServerCreateParams,
): Promise<mcp.MCPServerDBObjectResponse> => {
  return request.post(endpoints.mcp.servers, data);
};

/**
 * Update an existing MCP server
 */
export const updateMCPServer = async (
  serverName: string,
  data: mcp.MCPServerUpdateParams,
): Promise<mcp.MCPServerDBObjectResponse> => {
  return request.patch(endpoints.mcpServer(serverName), data);
};

/**
 * Delete an MCP server
 */
export const deleteMCPServer = async (serverName: string): Promise<{ success: boolean }> => {
  return request.delete(endpoints.mcpServer(serverName));
};

/**
 * Imports a conversations file.
 *
 * @param data - The FormData containing the file to import.
 * @returns A Promise that resolves to the import start response.
 */
export const importConversationsFile = (data: FormData): Promise<t.TImportResponse> => {
  return request.postMultiPart(endpoints.importConversation(), data);
};

export const uploadAvatar = (data: FormData): Promise<f.AvatarUploadResponse> => {
  return request.postMultiPart(endpoints.avatar(), data);
};

export const uploadAssistantAvatar = (data: m.AssistantAvatarVariables): Promise<a.Assistant> => {
  return request.postMultiPart(
    endpoints.assistants({
      isAvatar: true,
      path: `${data.assistant_id}/avatar`,
      options: { model: data.model, endpoint: data.endpoint },
      version: data.version,
    }),
    data.formData,
  );
};

export const uploadAgentAvatar = (data: m.AgentAvatarVariables): Promise<a.Agent> => {
  return request.postMultiPart(
    `${endpoints.images()}/agents/${data.agent_id}/avatar`,
    data.formData,
  );
};

export const getFileDownload = async (userId: string, file_id: string): Promise<AxiosResponse> => {
  return request.getResponse(`${endpoints.files()}/download/${userId}/${file_id}`, {
    responseType: 'blob',
    headers: {
      Accept: 'application/octet-stream',
    },
  });
};

export const getFileDownloadURL = async (
  userId: string,
  file_id: string,
): Promise<f.FileDownloadURLResponse> => {
  return request.get(`${endpoints.files()}/download-url/${userId}/${file_id}`);
};

/** Blob download for a snapshotted file served through a shared link. */
export const getSharedFileDownload = async (
  shareId: string,
  file_id: string,
): Promise<AxiosResponse> => {
  return request.getResponse(endpoints.sharedFileDownload(shareId, file_id), {
    responseType: 'blob',
    headers: {
      Accept: 'application/octet-stream',
    },
  });
};

export const getCodeOutputDownload = async (url: string): Promise<AxiosResponse> => {
  return request.getResponse(url, {
    responseType: 'blob',
    headers: {
      Accept: 'application/octet-stream',
    },
  });
};

export const deleteFiles = async (payload: {
  files: f.BatchFile[];
  agent_id?: string;
  assistant_id?: string;
  tool_resource?: a.EToolResources;
}): Promise<f.DeleteFilesResponse> =>
  request.deleteWithOptions(endpoints.files(), {
    data: payload,
  });

/* Speech */

export const speechToText = (data: FormData): Promise<f.SpeechToTextResponse> => {
  return request.postMultiPart(endpoints.speechToText(), data);
};

export const textToSpeech = (data: FormData): Promise<ArrayBuffer> => {
  return request.postTTS(endpoints.textToSpeechManual(), data);
};

export const getVoices = (): Promise<f.VoiceResponse> => {
  return request.get(endpoints.textToSpeechVoices());
};

export const getCustomConfigSpeech = (): Promise<t.TCustomConfigSpeechResponse> => {
  return request.get(endpoints.getCustomConfigSpeech());
};

/* conversations */

export function duplicateConversation(
  payload: t.TDuplicateConvoRequest,
): Promise<t.TDuplicateConvoResponse> {
  return request.post(endpoints.duplicateConversation(), payload);
}

export function forkConversation(payload: t.TForkConvoRequest): Promise<t.TForkConvoResponse> {
  return request.post(endpoints.forkConversation(), payload);
}

export function forkSharedConversation(
  shareId: string,
  targetMessageIndex?: number,
): Promise<t.TForkConvoResponse> {
  return request.post(endpoints.forkSharedMessages(shareId), { targetMessageIndex });
}

export function deleteConversation(payload: t.TDeleteConversationRequest) {
  return request.deleteWithOptions(endpoints.deleteConversation(), { data: { arg: payload } });
}

export function clearAllConversations(): Promise<unknown> {
  return request.delete(endpoints.deleteAllConversation());
}

export const listConversations = (
  params?: q.ConversationListParams,
): Promise<q.ConversationListResponse> => {
  return request.get(endpoints.conversations(params ?? {}));
};

export function getConversations(cursor: string): Promise<t.TGetConversationsResponse> {
  return request.get(endpoints.conversations({ cursor }));
}

export function getConversationById(id: string): Promise<s.TConversation> {
  return request.get(endpoints.conversationById(id));
}

export function updateConversation(
  payload: t.TUpdateConversationRequest,
): Promise<t.TUpdateConversationResponse> {
  return request.post(endpoints.updateConversation(), { arg: payload });
}

export function archiveConversation(
  payload: t.TArchiveConversationRequest,
): Promise<t.TArchiveConversationResponse> {
  return request.post(endpoints.archiveConversation(), { arg: payload });
}

export function listProjects(params?: q.ProjectListParams): Promise<q.ProjectListResponse> {
  return request.get(endpoints.projects(params ?? {}));
}

export function createProject(payload: t.TCreateChatProjectRequest): Promise<t.TChatProject> {
  return request.post(endpoints.projects(), payload);
}

export function getProjectById(projectId: string): Promise<t.TChatProject> {
  return request.get(endpoints.projectById(projectId));
}

export function updateProject(payload: t.TUpdateChatProjectRequest): Promise<t.TChatProject> {
  const { projectId, ...data } = payload;
  return request.patch(endpoints.projectById(projectId), data);
}

export function deleteProject(projectId: string): Promise<t.TDeleteChatProjectResponse> {
  return request.delete(endpoints.projectById(projectId));
}

export function assignConversationToProject(
  payload: t.TAssignConversationToProjectRequest,
): Promise<t.TAssignConversationToProjectResponse> {
  const { conversationId, projectId } = payload;
  return request.put(endpoints.projectConversation(conversationId), { projectId });
}

export function pinConversation(
  payload: t.TPinConversationRequest,
): Promise<t.TPinConversationResponse> {
  return request.post(endpoints.pinConversation(), { arg: payload });
}

export function genTitle(payload: m.TGenTitleRequest): Promise<m.TGenTitleResponse> {
  return request.get(endpoints.genTitle(payload.conversationId));
}

export const listMessages = (params?: q.MessagesListParams): Promise<q.MessagesListResponse> => {
  return request.get(endpoints.messages(params ?? {}));
};

export function updateMessage(payload: t.TUpdateMessageRequest): Promise<unknown> {
  const { conversationId, messageId, text } = payload;
  if (!conversationId) {
    throw new Error('conversationId is required');
  }

  return request.put(endpoints.messages({ conversationId, messageId }), { text });
}

export function updateMessageContent(payload: t.TUpdateMessageContent): Promise<unknown> {
  const { conversationId, messageId, index, text } = payload;
  if (!conversationId) {
    throw new Error('conversationId is required');
  }

  return request.put(endpoints.messages({ conversationId, messageId }), { text, index });
}

export const editArtifact = async ({
  messageId,
  ...params
}: m.TEditArtifactRequest): Promise<m.TEditArtifactResponse> => {
  return request.post(endpoints.messagesArtifacts(messageId), params);
};

export const branchMessage = async (
  payload: m.TBranchMessageRequest,
): Promise<m.TBranchMessageResponse> => {
  return request.post(endpoints.messagesBranch(), payload);
};

export function getMessagesByConvoId(conversationId: string): Promise<s.TMessage[]> {
  if (
    conversationId === config.Constants.NEW_CONVO ||
    conversationId === config.Constants.PENDING_CONVO
  ) {
    return Promise.resolve([]);
  }
  return request.get(endpoints.messages({ conversationId }));
}

export function getPrompt(id: string): Promise<{ prompt: t.TPrompt }> {
  return request.get(endpoints.getPrompt(id));
}

export function getPrompts(filter: t.TPromptsWithFilterRequest): Promise<t.TPrompt[]> {
  return request.get(endpoints.getPromptsWithFilters(filter));
}

export function getAllPromptGroups(): Promise<q.AllPromptGroupsResponse> {
  return request.get(endpoints.getAllPromptGroups());
}

export function getPromptGroups(
  filter: t.TPromptGroupsWithFilterRequest,
): Promise<t.PromptGroupListResponse> {
  return request.get(endpoints.getPromptGroupsWithFilters(filter));
}

export function getPromptGroup(id: string): Promise<t.TPromptGroup> {
  return request.get(endpoints.getPromptGroup(id));
}

export function createPrompt(payload: t.TCreatePrompt): Promise<t.TCreatePromptResponse> {
  return request.post(endpoints.postPrompt(), payload);
}

export function addPromptToGroup(
  groupId: string,
  payload: t.TCreatePrompt,
): Promise<t.TCreatePromptResponse> {
  return request.post(endpoints.addPromptToGroup(groupId), payload);
}

export function updatePromptGroup(
  variables: t.TUpdatePromptGroupVariables,
): Promise<t.TUpdatePromptGroupResponse> {
  return request.patch(endpoints.updatePromptGroup(variables.id), variables.payload);
}

export function recordPromptGroupUsage(groupId: string): Promise<{ numberOfGenerations: number }> {
  return request.post(endpoints.recordPromptGroupUsage(groupId));
}

export function deletePrompt(payload: t.TDeletePromptVariables): Promise<t.TDeletePromptResponse> {
  return request.delete(endpoints.deletePrompt(payload));
}

export function makePromptProduction(id: string): Promise<t.TMakePromptProductionResponse> {
  return request.patch(endpoints.updatePromptTag(id));
}

export function updatePromptLabels(
  variables: t.TUpdatePromptLabelsRequest,
): Promise<t.TUpdatePromptLabelsResponse> {
  return request.patch(endpoints.updatePromptLabels(variables.id), variables.payload);
}

export function deletePromptGroup(id: string): Promise<t.TDeletePromptGroupResponse> {
  return request.delete(endpoints.deletePromptGroup(id));
}

export function getCategories(): Promise<t.TGetCategoriesResponse> {
  return request.get(endpoints.getCategories());
}

export function getRandomPrompts(
  variables: t.TGetRandomPromptsRequest,
): Promise<t.TGetRandomPromptsResponse> {
  return request.get(endpoints.getRandomPrompts(variables.limit, variables.skip));
}

/* Skills */

export function listSkills(params?: sk.TSkillListRequest): Promise<sk.TSkillListResponse> {
  return request.get(endpoints.listSkillsWithFilters(params ?? {}));
}

export function getSkill(id: string): Promise<sk.TSkill> {
  return request.get(endpoints.getSkill(id));
}

export function createSkill(payload: sk.TCreateSkill): Promise<sk.TSkill> {
  return request.post(endpoints.skills(), payload);
}

export function updateSkill(variables: sk.TUpdateSkillVariables): Promise<sk.TUpdateSkillResponse> {
  return request.patch(endpoints.getSkill(variables.id), {
    expectedVersion: variables.expectedVersion,
    ...variables.payload,
  });
}

export function deleteSkill(id: string): Promise<sk.TDeleteSkillResponse> {
  return request.delete(endpoints.getSkill(id));
}

export function listSkillFiles(skillId: string): Promise<sk.TListSkillFilesResponse> {
  return request.get(endpoints.skillFiles(skillId));
}

export function uploadSkillFile(skillId: string, formData: FormData): Promise<sk.TSkillFile> {
  return request.postMultiPart(endpoints.skillFiles(skillId), formData);
}

/**
 * Import a skill from a .md, .zip, or .skill file. The backend extracts the
 * archive, creates the skill from SKILL.md, and persists all additional files.
 * Single HTTP request — no client-side zip processing needed.
 */
export function importSkill(formData: FormData): Promise<sk.TSkill> {
  return request.postMultiPart(endpoints.importSkill(), formData);
}

export function getSkillFileContent(
  skillId: string,
  relativePath: string,
): Promise<sk.TSkillFileContentResponse> {
  return request.get(endpoints.skillFile(skillId, relativePath));
}

export function deleteSkillFile(
  skillId: string,
  relativePath: string,
): Promise<sk.TDeleteSkillFileResponse> {
  return request.delete(endpoints.skillFile(skillId, relativePath));
}

/* -------------------------------------------------------------------------- */
/* Skill Tree (nodes) — phase 2 backend                                       */
/* -------------------------------------------------------------------------- */
/* These were introduced by the original UI PR and are shipped as stubs in    */
/* phase 1 so the tree UI compiles. Each resolves with empty/no-op data until */
/* the backend persists a folder hierarchy. The call surface matches what the */
/* tree hooks expect so wiring real endpoints later is a one-line swap.       */

export const getSkillTree = (_skillId: string): Promise<t.TSkillTreeResponse> => {
  return Promise.resolve({ nodes: [] });
};

export const createSkillNode = (
  skillId: string,
  data: FormData | t.TCreateSkillNodeRequest,
): Promise<t.TSkillNode> => {
  const name = data instanceof FormData ? (data.get('name') as string) || 'untitled' : data.name;
  const type = data instanceof FormData ? 'file' : data.type;
  const now = new Date().toISOString();
  return Promise.resolve({
    _id: `pending-${now}`,
    skillId,
    parentId: null,
    type,
    name,
    order: 0,
    author: '',
    createdAt: now,
    updatedAt: now,
  });
};

export const updateSkillNode = (variables: {
  skillId: string;
  nodeId: string;
  data: t.TUpdateSkillNodeRequest;
}): Promise<t.TSkillNode> => {
  const now = new Date().toISOString();
  return Promise.resolve({
    _id: variables.nodeId,
    skillId: variables.skillId,
    parentId: variables.data.parentId ?? null,
    type: 'file',
    name: variables.data.name ?? '',
    order: variables.data.order ?? 0,
    author: '',
    createdAt: now,
    updatedAt: now,
  });
};

export const deleteSkillNode = (_variables: { skillId: string; nodeId: string }): Promise<void> => {
  return Promise.resolve();
};

export const getSkillNodeContent = (_variables: {
  skillId: string;
  nodeId: string;
}): Promise<{ content: string; mimeType: string }> => {
  return Promise.resolve({ content: '', mimeType: 'text/plain' });
};

export const updateSkillNodeContent = (variables: {
  skillId: string;
  nodeId: string;
  content: string;
}): Promise<t.TSkillNode> => {
  const now = new Date().toISOString();
  return Promise.resolve({
    _id: variables.nodeId,
    skillId: variables.skillId,
    parentId: null,
    type: 'file',
    name: '',
    order: 0,
    author: '',
    createdAt: now,
    updatedAt: now,
  });
};

export function getGitHubSkillSyncStatus(): Promise<sk.TGitHubSkillSyncStatusResponse> {
  return request.get(endpoints.adminSkillsSyncStatus());
}

export function runGitHubSkillSync(): Promise<sk.TGitHubSkillSyncManualRunResponse> {
  return request.post(endpoints.adminSkillsSyncRun());
}

export function setGitHubSkillSyncCredential(variables: {
  credentialKey: string;
  token: string;
}): Promise<sk.TGitHubSkillSyncCredentialSummary> {
  return request.put(endpoints.adminSkillsSyncCredential(variables.credentialKey), {
    token: variables.token,
  } satisfies sk.TGitHubSkillSyncCredentialUpdateRequest);
}

export function deleteGitHubSkillSyncCredential(
  credentialKey: string,
): Promise<{ credentialKey: string; deleted: boolean }> {
  return request.delete(endpoints.adminSkillsSyncCredential(credentialKey));
}

/* Roles */
export function listRoles(): Promise<q.ListRolesResponse> {
  return request.get(`${endpoints.adminRoles()}?limit=200`);
}

export function getRole(roleName: string): Promise<r.TRole> {
  return request.get(endpoints.getRole(roleName));
}

export function updatePromptPermissions(
  variables: m.UpdatePromptPermVars,
): Promise<m.UpdatePermResponse> {
  return request.put(endpoints.updatePromptPermissions(variables.roleName), variables.updates);
}

export function updateAgentPermissions(
  variables: m.UpdateAgentPermVars,
): Promise<m.UpdatePermResponse> {
  return request.put(endpoints.updateAgentPermissions(variables.roleName), variables.updates);
}

export function updateMemoryPermissions(
  variables: m.UpdateMemoryPermVars,
): Promise<m.UpdatePermResponse> {
  return request.put(endpoints.updateMemoryPermissions(variables.roleName), variables.updates);
}

export function updatePeoplePickerPermissions(
  variables: m.UpdatePeoplePickerPermVars,
): Promise<m.UpdatePermResponse> {
  return request.put(
    endpoints.updatePeoplePickerPermissions(variables.roleName),
    variables.updates,
  );
}

export function updateMCPServersPermissions(
  variables: m.UpdateMCPServersPermVars,
): Promise<m.UpdatePermResponse> {
  return request.put(endpoints.updateMCPServersPermissions(variables.roleName), variables.updates);
}

export function updateRemoteAgentsPermissions(
  variables: m.UpdateRemoteAgentsPermVars,
): Promise<m.UpdatePermResponse> {
  return request.put(
    endpoints.updateRemoteAgentsPermissions(variables.roleName),
    variables.updates,
  );
}

export function updateMarketplacePermissions(
  variables: m.UpdateMarketplacePermVars,
): Promise<m.UpdatePermResponse> {
  return request.put(endpoints.updateMarketplacePermissions(variables.roleName), variables.updates);
}

export function updateSkillPermissions(
  variables: m.UpdateSkillPermVars,
): Promise<m.UpdatePermResponse> {
  return request.put(endpoints.updateSkillPermissions(variables.roleName), variables.updates);
}

/* Tags */
export function getConversationTags(): Promise<t.TConversationTagsResponse> {
  return request.get(endpoints.conversationTags());
}

export function createConversationTag(
  payload: t.TConversationTagRequest,
): Promise<t.TConversationTagResponse> {
  return request.post(endpoints.conversationTags(), payload);
}

export function updateConversationTag(
  tag: string,
  payload: t.TConversationTagRequest,
): Promise<t.TConversationTagResponse> {
  return request.put(endpoints.conversationTags(tag), payload);
}
export function deleteConversationTag(tag: string): Promise<t.TConversationTagResponse> {
  return request.delete(endpoints.conversationTags(tag));
}

export function addTagToConversation(
  conversationId: string,
  payload: t.TTagConversationRequest,
): Promise<t.TTagConversationResponse> {
  return request.put(endpoints.addTagToConversation(conversationId), payload);
}
export function rebuildConversationTags(): Promise<t.TConversationTagsResponse> {
  return request.post(endpoints.conversationTags('rebuild'));
}

export function healthCheck(): Promise<string> {
  return request.get(endpoints.health());
}

export function getUserTerms(): Promise<t.TUserTermsResponse> {
  return request.get(endpoints.userTerms());
}

export function acceptTerms(): Promise<t.TAcceptTermsResponse> {
  return request.post(endpoints.acceptUserTerms());
}

export function getBanner(): Promise<t.TBannerResponse> {
  return request.get(endpoints.banner());
}

export function updateFeedback(
  conversationId: string,
  messageId: string,
  payload: t.TUpdateFeedbackRequest,
): Promise<t.TUpdateFeedbackResponse> {
  return request.put(endpoints.feedback(conversationId, messageId), payload);
}

// 2FA
export function enableTwoFactor(payload?: t.TEnable2FARequest): Promise<t.TEnable2FAResponse> {
  return request.post(endpoints.enableTwoFactor(), payload);
}

export function verifyTwoFactor(payload: t.TVerify2FARequest): Promise<t.TVerify2FAResponse> {
  return request.post(endpoints.verifyTwoFactor(), payload);
}

export function confirmTwoFactor(payload: t.TVerify2FARequest): Promise<t.TVerify2FAResponse> {
  return request.post(endpoints.confirmTwoFactor(), payload);
}

export function disableTwoFactor(payload?: t.TDisable2FARequest): Promise<t.TDisable2FAResponse> {
  return request.post(endpoints.disableTwoFactor(), payload);
}

export function regenerateBackupCodes(
  payload?: t.TRegenerateBackupCodesRequest,
): Promise<t.TRegenerateBackupCodesResponse> {
  return request.post(endpoints.regenerateBackupCodes(), payload);
}

export function verifyTwoFactorTemp(
  payload: t.TVerify2FATempRequest,
): Promise<t.TVerify2FATempResponse> {
  return request.post(endpoints.verifyTwoFactorTemp(), payload);
}

/* Memories */
export const getMemories = (): Promise<q.MemoriesResponse> => {
  return request.get(endpoints.memories());
};

export const deleteMemory = (key: string): Promise<void> => {
  return request.delete(endpoints.memory(key));
};

export const updateMemory = (
  key: string,
  value: string,
  originalKey?: string,
): Promise<q.TUserMemory> => {
  return request.patch(endpoints.memory(originalKey || key), { key, value });
};

export const updateMemoryPreferences = (preferences: {
  memories: boolean;
}): Promise<{ updated: boolean; preferences: { memories: boolean } }> => {
  return request.patch(endpoints.memoryPreferences(), preferences);
};

export const createMemory = (data: {
  key: string;
  value: string;
}): Promise<{ created: boolean; memory: q.TUserMemory }> => {
  return request.post(endpoints.memories(), data);
};

export function searchPrincipals(
  params: q.PrincipalSearchParams,
): Promise<q.PrincipalSearchResponse> {
  return request.get(endpoints.searchPrincipals(params));
}

export function getAccessRoles(
  resourceType: permissions.ResourceType,
): Promise<q.AccessRolesResponse> {
  return request.get(endpoints.getAccessRoles(resourceType));
}

export function getResourcePermissions(
  resourceType: permissions.ResourceType,
  resourceId: string,
): Promise<permissions.TGetResourcePermissionsResponse> {
  return request.get(endpoints.getResourcePermissions(resourceType, resourceId));
}

export function updateResourcePermissions(
  resourceType: permissions.ResourceType,
  resourceId: string,
  data: permissions.TUpdateResourcePermissionsRequest,
): Promise<permissions.TUpdateResourcePermissionsResponse> {
  return request.put(endpoints.updateResourcePermissions(resourceType, resourceId), data);
}

export function getEffectivePermissions(
  resourceType: permissions.ResourceType,
  resourceId: string,
): Promise<permissions.TEffectivePermissionsResponse> {
  return request.get(endpoints.getEffectivePermissions(resourceType, resourceId));
}

export function getAllEffectivePermissions(
  resourceType: permissions.ResourceType,
): Promise<permissions.TAllEffectivePermissionsResponse> {
  return request.get(endpoints.getAllEffectivePermissions(resourceType));
}

// SharePoint Graph API Token
export function getGraphApiToken(params: q.GraphTokenParams): Promise<q.GraphTokenResponse> {
  return request.get(endpoints.graphToken(params.scopes));
}

export function getDomainServerBaseUrl(): string {
  return `${endpoints.apiBaseUrl()}/api`;
}

/* Active Jobs */
export interface ActiveJobsResponse {
  activeJobIds: string[];
}

export const getActiveJobs = (): Promise<ActiveJobsResponse> => {
  return request.get(endpoints.activeJobs());
};

/* Image Generation */
export function getImageGenProviders(): Promise<t.TImageGenProvider[]> {
  return request.get(endpoints.imageGenProviders());
}

export function generateImages(payload: t.TImageGenRequest): Promise<t.TImageGenResponse> {
  return request.post(endpoints.imageGenGenerate(), payload);
}

export function getImageGenHistory(
  params?: { page?: number; limit?: number; favorite?: string },
): Promise<t.TImageGenHistoryResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.favorite) query.set('favorite', params.favorite);
  const qs = query.toString();
  return request.get(`${endpoints.imageGenHistory()}${qs ? `?${qs}` : ''}`);
}

export function deleteImageGenHistoryEntry(id: string): Promise<{ message: string }> {
  return request.delete(endpoints.imageGenHistoryEntry(id));
}

export function toggleImageGenFavorite(id: string): Promise<{ favorite: boolean }> {
  return request.patch(endpoints.imageGenToggleFavorite(id));
}

/* Video Generation */
export function getVideoGenProviders(): Promise<t.TVideoGenProvider[]> {
  return request.get(endpoints.videoGenProviders());
}

export function getVideoGenDurationLimits(
  params: { provider: string; model?: string },
): Promise<t.TVideoGenDurationLimits> {
  const query = new URLSearchParams({ provider: params.provider });
  if (params.model) query.set('model', params.model);
  return request.get(`${endpoints.videoGenDurationLimits()}?${query.toString()}`);
}

export function generateVideo(payload: t.TVideoGenRequest): Promise<t.TVideoGenResponse> {
  return request.post(endpoints.videoGenGenerate(), payload);
}

export function getVideoGenHistory(
  params?: { page?: number; limit?: number; status?: string; favorite?: string },
): Promise<t.TVideoGenHistoryResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  if (params?.favorite) query.set('favorite', params.favorite);
  const qs = query.toString();
  return request.get(`${endpoints.videoGenHistory()}${qs ? `?${qs}` : ''}`);
}

export function getVideoGenStatus(id: string): Promise<t.TVideoGenStatusResponse> {
  return request.get(endpoints.videoGenStatus(id));
}

export function deleteVideoGenHistoryEntry(id: string): Promise<{ message: string }> {
  return request.delete(endpoints.videoGenHistoryEntry(id));
}

export function toggleVideoGenFavorite(id: string): Promise<{ favorite: boolean }> {
  return request.patch(endpoints.videoGenToggleFavorite(id));
}

/* Knowledge / RAG Workspace */
export function getKnowledgeDocuments(
  params?: { embedded?: string; search?: string; limit?: number; offset?: number },
): Promise<t.TKnowledgeDocumentListResponse> {
  const query = new URLSearchParams();
  if (params?.embedded) query.set('embedded', params.embedded);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return request.get(`${endpoints.knowledgeDocuments()}${qs ? `?${qs}` : ''}`);
}

export function uploadKnowledgeDocument(formData: FormData): Promise<{ file: t.TKnowledgeDocument }> {
  return request.postMultiPart(endpoints.knowledgeUpload(), formData);
}

export function deleteKnowledgeDocument(id: string): Promise<{ message: string }> {
  return request.delete(endpoints.knowledgeDocument(id));
}

export function getKnowledgeCollections(): Promise<t.TKnowledgeCollectionListResponse> {
  return request.get(endpoints.knowledgeCollections());
}

export function createKnowledgeCollection(
  payload: t.TKnowledgeCreateCollectionRequest,
): Promise<{ collection: t.TKnowledgeCollection }> {
  return request.post(endpoints.knowledgeCollections(), payload);
}

export function updateKnowledgeCollection(
  id: string,
  payload: t.TKnowledgeUpdateCollectionRequest,
): Promise<{ collection: t.TKnowledgeCollection }> {
  return request.put(endpoints.knowledgeCollection(id), payload);
}

export function deleteKnowledgeCollection(id: string): Promise<{ message: string }> {
  return request.delete(endpoints.knowledgeCollection(id));
}

export function addFileToKnowledgeCollection(
  id: string,
  fileId: string,
): Promise<{ collection: t.TKnowledgeCollection }> {
  return request.post(endpoints.knowledgeCollectionFiles(id), { fileId });
}

export function removeFileFromKnowledgeCollection(
  id: string,
  fileId: string,
): Promise<{ collection: t.TKnowledgeCollection }> {
  return request.delete(endpoints.knowledgeCollectionFile(id, fileId));
}

export function knowledgeSearch(
  payload: t.TKnowledgeSearchRequest,
): Promise<t.TKnowledgeSearchResponse> {
  return request.post(endpoints.knowledgeSearch(), payload);
}

export function knowledgeChat(
  payload: t.TKnowledgeChatRequest,
): Promise<t.TKnowledgeChatResponse> {
  return request.post(endpoints.knowledgeChat(), payload);
}

export function getKnowledgeDocumentDetail(id: string): Promise<{ document: t.TKnowledgeDocumentDetail }> {
  return request.get(endpoints.knowledgeDocumentDetail(id));
}

export function renameKnowledgeDocument(id: string, name: string): Promise<{ document: t.TKnowledgeDocument }> {
  return request.put(endpoints.knowledgeDocumentRename(id), { name });
}

export function reindexKnowledgeDocument(id: string): Promise<{ document: t.TKnowledgeDocument }> {
  return request.post(endpoints.knowledgeDocumentReindex(id));
}

export function moveKnowledgeDocument(id: string, collectionId: string | null): Promise<{ document: t.TKnowledgeDocument }> {
  return request.post(endpoints.knowledgeDocumentMove(id), { collectionId });
}

export function getKnowledgeCollectionAnalytics(id: string): Promise<{ analytics: t.TKnowledgeCollectionAnalytics }> {
  return request.get(endpoints.knowledgeCollectionAnalytics(id));
}

export function quickKnowledgeAction(
  payload: { fileIds: string[]; action: t.TKnowledgeQuickAction },
): Promise<{ answer: string; sources: t.TKnowledgeSource[] }> {
  return request.post(endpoints.knowledgeQuickAction(), payload);
}

export function getKnowledgeAdminSettings(): Promise<{ settings: t.TKnowledgeAdminSettings }> {
  return request.get(endpoints.knowledgeAdminSettings());
}

export function updateKnowledgeAdminSettings(
  payload: Partial<t.TKnowledgeAdminSettings>,
): Promise<{ settings: t.TKnowledgeAdminSettings }> {
  return request.put(endpoints.knowledgeAdminSettings(), payload);
}

/* Import / Background Processing Jobs */
export function uploadKnowledgeDocumentAsync(formData: FormData): Promise<t.TImportJobResponse> {
  return request.postMultiPart(endpoints.knowledgeUploadAsync(), formData);
}

export function getKnowledgeImportJobs(
  params?: { status?: string; sourceType?: string; collectionId?: string; limit?: number; offset?: number },
): Promise<t.TImportJobListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.sourceType) query.set('sourceType', params.sourceType);
  if (params?.collectionId) query.set('collectionId', params.collectionId);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return request.get(`${endpoints.knowledgeImportJobs()}${qs ? `?${qs}` : ''}`);
}

export function getKnowledgeImportJob(id: string): Promise<t.TImportJobResponse> {
  return request.get(endpoints.knowledgeImportJob(id));
}

export function cancelKnowledgeImportJob(id: string): Promise<t.TImportJobResponse> {
  return request.post(endpoints.knowledgeImportJobCancel(id));
}

export function retryKnowledgeImportJob(id: string): Promise<t.TImportJobResponse> {
  return request.post(endpoints.knowledgeImportJobRetry(id));
}

export function reindexKnowledgeCollectionAsync(id: string): Promise<t.TImportJobResponse> {
  return request.post(endpoints.knowledgeCollectionReindex(id));
}

export function getKnowledgeAdminQueueStatus(): Promise<{
  available: boolean;
  queues?: Record<string, { name: string; waiting: number; active: number; completed: number; failed: number; delayed: number; paused: boolean }>;
  message?: string;
}> {
  return request.get(endpoints.knowledgeAdminQueueStatus());
}

/* Prompt Marketplace */
export function getMarketplacePrompts(
  params?: { search?: string; category?: string; sort?: string; page?: number },
): Promise<t.TMarketplaceListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.category) query.set('category', params.category);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  return request.get(`${endpoints.marketplacePrompts()}${qs ? `?${qs}` : ''}`);
}

export function getMarketplaceFeatured(): Promise<t.TMarketplaceFeaturedResponse> {
  return request.get(endpoints.marketplaceFeatured());
}

export function getMarketplaceCategories(): Promise<t.TMarketplaceCategoriesResponse> {
  return request.get(endpoints.marketplaceCategories());
}

export function getMarketplaceFavorites(
  params?: { page?: number },
): Promise<t.TMarketplaceListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  return request.get(`${endpoints.marketplaceFavorites()}${qs ? `?${qs}` : ''}`);
}

export function toggleMarketplaceFavorite(
  groupId: string,
): Promise<t.TMarketplaceToggleFavoriteResponse> {
  return request.post(endpoints.marketplaceToggleFavorite(groupId));
}

/* Admin / Super Admin */
export function getAdminDashboardStats(): Promise<t.TAdminDashboardStats> {
  return request.get(endpoints.adminDashboardStats());
}

export function getAdminUserDetail(id: string): Promise<t.TAdminUserDetail> {
  return request.get(endpoints.adminUserDetail(id));
}

export function updateAdminUserRole(
  id: string,
  payload: t.TAdminUpdateRoleRequest,
): Promise<{ user: t.TUser }> {
  return request.patch(endpoints.adminUpdateUserRole(id), payload);
}

export function adjustAdminCredits(
  payload: t.TAdminCreditsAdjustRequest,
): Promise<{ balance: unknown }> {
  return request.post(endpoints.adminAdjustCredits(), payload);
}

export function getAdminRevenue(
  params?: { page?: number; limit?: number },
): Promise<t.TAdminRevenueResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return request.get(`${endpoints.adminRevenue()}${qs ? `?${qs}` : ''}`);
}

export function getAdminSubscriptions(
  params?: { page?: number; limit?: number },
): Promise<t.TAdminSubscriptionsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return request.get(`${endpoints.adminSubscriptions()}${qs ? `?${qs}` : ''}`);
}

export function cancelAdminSubscription(id: string): Promise<{ subscription: t.TAdminSubscription }> {
  return request.post(endpoints.adminCancelSubscription(id));
}

export function getAdminProviders(): Promise<t.TAdminProvidersResponse> {
  return request.get(endpoints.adminProviders());
}

export function getAdminModels(): Promise<{ models: Record<string, unknown> }> {
  return request.get(endpoints.adminModels());
}

export function getAdminAnnouncements(): Promise<t.TAdminAnnouncementsResponse> {
  return request.get(endpoints.adminAnnouncements());
}

export function createAdminAnnouncement(
  payload: t.TAdminAnnouncementRequest,
): Promise<{ announcement: t.TAdminAnnouncement }> {
  return request.post(endpoints.adminAnnouncements(), payload);
}

export function updateAdminAnnouncement(
  id: string,
  payload: Partial<t.TAdminAnnouncementRequest>,
): Promise<{ announcement: t.TAdminAnnouncement }> {
  return request.put(endpoints.adminAnnouncement(id), payload);
}

export function deleteAdminAnnouncement(id: string): Promise<{ message: string }> {
  return request.delete(endpoints.adminAnnouncement(id));
}

export function getAdminHealth(): Promise<t.TAdminSystemHealth> {
  return request.get(endpoints.adminHealth());
}

export function getAdminFeatureFlags(): Promise<t.TAdminFeatureFlags> {
  return request.get(endpoints.adminFeatures());
}

export function getAdminAuditLog(
  params?: { page?: number; limit?: number; category?: string },
): Promise<unknown> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.category) query.set('category', params.category);
  const qs = query.toString();
  return request.get(`${endpoints.adminAuditLog()}${qs ? `?${qs}` : ''}`);
}

export function getAdminAnalytics(
  params?: t.TAnalyticsParams,
): Promise<t.TAnalyticsResponse> {
  const query = new URLSearchParams();
  if (params?.period) query.set('period', params.period);
  const qs = query.toString();
  return request.get(`${endpoints.adminAnalytics()}${qs ? `?${qs}` : ''}`);
}

export function getAdminLockedUsers(): Promise<{ users: Array<{ _id: string; name: string; email: string; loginLockedUntil: string; loginAttempts: number; lastFailedLoginAt: string }> }> {
  return request.get(endpoints.adminLockedUsers());
}

export function adminUnlockUser(id: string): Promise<{ success: boolean }> {
  return request.post(endpoints.adminUnlockUser(id));
}

/* Notifications */
export function getNotifications(
  params?: t.TNotificationQueryParams,
): Promise<t.TNotificationListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.unreadOnly) query.set('unreadOnly', 'true');
  if (params?.type) query.set('type', params.type);
  const qs = query.toString();
  return request.get(`${endpoints.notificationsList()}${qs ? `?${qs}` : ''}`);
}

export function getNotificationsUnreadCount(): Promise<t.TUnreadCountResponse> {
  return request.get(endpoints.notificationsUnreadCount());
}

export function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  return request.patch(endpoints.notificationRead(id));
}

export function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return request.patch(endpoints.notificationsReadAll());
}

export function deleteNotification(id: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.notificationDelete(id));
}

/* Notification Preferences */
export function getNotificationPreferences(): Promise<{ preferences: t.TNotificationPreference }> {
  return request.get(endpoints.notificationPreferences());
}

export function updateNotificationPreferences(
  data: Partial<t.TNotificationPreference>,
): Promise<{ preferences: t.TNotificationPreference }> {
  return request.put(endpoints.notificationPreferencesUpdate(), data);
}

export function subscribePushNotification(
  subscription: PushSubscriptionJSON,
): Promise<{ success: boolean }> {
  return request.post(endpoints.notificationPushSubscribe(), subscription);
}

export function unsubscribePushNotification(): Promise<{ success: boolean }> {
  return request.post(endpoints.notificationPushUnsubscribe());
}

export function sendNotificationDigest(): Promise<t.TNotificationDigestResponse> {
  return request.post(endpoints.notificationSendDigest());
}

/* Integrations */
export function getIntegrations(): Promise<t.TIntegrationListResponse> {
  return request.get(endpoints.integrationsList());
}

export function getIntegration(provider: string): Promise<t.TIntegration> {
  return request.get(endpoints.integrationGet(provider));
}

export function saveIntegrationConfig(
  provider: string,
  config: Record<string, unknown>,
): Promise<{ integration: t.TIntegration }> {
  return request.put(endpoints.integrationConfig(provider), config);
}

export function deleteIntegration(provider: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.integrationDelete(provider));
}

/* Integration OAuth */
export function getIntegrationOAuthAuthorize(provider: string): Promise<{ url: string; state: string }> {
  return request.get(endpoints.integrationOAuthAuthorize(provider));
}

export function getIntegrationOAuthStatus(provider: string): Promise<t.TIntegrationOAuthStatus> {
  return request.get(endpoints.integrationOAuthStatus(provider));
}

export function postIntegrationOAuthDisconnect(provider: string): Promise<{ success: boolean }> {
  return request.post(endpoints.integrationOAuthDisconnect(provider));
}

export function postIntegrationOAuthRefresh(provider: string): Promise<{ success: boolean; expiresAt?: string }> {
  return request.post(endpoints.integrationOAuthRefresh(provider));
}

/* Organizations */
export function getOrganizations(): Promise<{ organizations: t.TOrganization[] }> {
  return request.get(endpoints.orgsList());
}

export function createOrganization(data: {
  name: string;
  description?: string;
}): Promise<{ organization: t.TOrganization }> {
  return request.post(endpoints.orgCreate(), data);
}

export function getOrganization(id: string): Promise<{ organization: t.TOrganization }> {
  return request.get(endpoints.orgGet(id));
}

export function updateOrganization(
  id: string,
  data: Partial<t.TOrganization>,
): Promise<{ organization: t.TOrganization }> {
  return request.put(endpoints.orgUpdate(id), data);
}

export function deleteOrganization(id: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.orgDelete(id));
}

export function getOrgMembers(
  id: string,
): Promise<{ members: t.TOrgMember[] }> {
  return request.get(endpoints.orgMembers(id));
}

export function updateOrgMemberRole(
  id: string,
  userId: string,
  role: string,
): Promise<{ success: boolean }> {
  return request.put(endpoints.orgMemberRole(id), { userId, role });
}

export function removeOrgMember(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  return request.delete(endpoints.orgMemberRemove(id, userId));
}

export function getOrgInvites(
  id: string,
): Promise<{ invites: t.TOrgInvite[] }> {
  return request.get(endpoints.orgInvites(id));
}

export function createOrgInvite(
  id: string,
  email: string,
  role?: string,
): Promise<{ invite: t.TOrgInvite }> {
  return request.post(endpoints.orgInviteCreate(id), { email, role });
}

export function acceptOrgInvite(
  id: string,
  token: string,
): Promise<{ invite: t.TOrgInvite }> {
  return request.post(endpoints.orgInviteAccept(id), { token });
}

export function revokeOrgInvite(
  id: string,
  inviteId: string,
): Promise<{ success: boolean }> {
  return request.delete(endpoints.orgInviteRevoke(id, inviteId));
}

export function getOrgTeams(
  id: string,
): Promise<{ teams: t.TTeam[] }> {
  return request.get(endpoints.orgTeams(id));
}

export function createOrgTeam(
  id: string,
  data: { name: string; description?: string },
): Promise<{ team: t.TTeam }> {
  return request.post(endpoints.orgTeamCreate(id), data);
}

export function updateOrgTeam(
  id: string,
  teamId: string,
  data: Partial<t.TTeam>,
): Promise<{ team: t.TTeam }> {
  return request.put(endpoints.orgTeamUpdate(id, teamId), data);
}

export function deleteOrgTeam(
  id: string,
  teamId: string,
): Promise<{ success: boolean }> {
  return request.delete(endpoints.orgTeamDelete(id, teamId));
}

export function getOrgTeamMembers(
  id: string,
  teamId: string,
): Promise<{ members: t.TTeamMember[] }> {
  return request.get(endpoints.orgTeamMembers(id, teamId));
}

export function addOrgTeamMember(
  id: string,
  teamId: string,
  userId: string,
  role?: string,
): Promise<{ success: boolean }> {
  return request.post(endpoints.orgTeamMemberAdd(id, teamId), { userId, role });
}

export function removeOrgTeamMember(
  id: string,
  teamId: string,
  userId: string,
): Promise<{ success: boolean }> {
  return request.delete(endpoints.orgTeamMemberRemove(id, teamId, userId));
}

/* Branding */
export function getPublicBranding(): Promise<t.TWhiteLabel> {
  return request.get(endpoints.brandingPublic());
}

export function getBrandingConfig(): Promise<t.TWhiteLabelConfig> {
  return request.get(endpoints.brandingConfig());
}

export function updateBrandingConfig(
  data: Partial<t.TWhiteLabelConfig>,
): Promise<{ branding: t.TWhiteLabelConfig }> {
  return request.put(endpoints.brandingUpdate(), data);
}

export function resetBrandingConfig(
  organizationId: string,
): Promise<{ success: boolean }> {
  return request.delete(endpoints.brandingReset(organizationId));
}

export function uploadBrandingImage(
  type: string,
  file: File,
): Promise<t.TBrandingUploadResponse> {
  const form = new FormData();
  form.append('file', file);
  return request.postMultiPart(endpoints.brandingUpload(type), form);
}

export function verifyBrandingDomain(
  domain: string,
): Promise<t.TDomainVerificationResult> {
  return request.post(endpoints.brandingVerifyDomain(), { domain });
}

export function getBrandingSSLStatus(
  domain: string,
): Promise<t.TSSLStatusResult> {
  return request.get(`${endpoints.brandingSSLStatus()}?domain=${encodeURIComponent(domain)}`);
}

export function getBrandingStatus(): Promise<t.TAppStatus> {
  return request.get(endpoints.brandingStatus());
}

export function getBrandingApiDocs(): Promise<t.TApiDocs> {
  return request.get(endpoints.brandingDocs());
}

/* Workflows */
export function getWorkflows(): Promise<{ workflows: t.TWorkflow[] }> {
  return request.get(endpoints.workflowsList());
}

export function getWorkflow(id: string): Promise<{ workflow: t.TWorkflow }> {
  return request.get(endpoints.workflowGet(id));
}

export function createWorkflow(
  data: t.TWorkflowCreateRequest,
): Promise<{ workflow: t.TWorkflow }> {
  return request.post(endpoints.workflowCreate(), data);
}

export function updateWorkflow(
  id: string,
  data: Partial<t.TWorkflowCreateRequest>,
): Promise<{ workflow: t.TWorkflow }> {
  return request.put(endpoints.workflowUpdate(id), data);
}

export function deleteWorkflow(id: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.workflowDelete(id));
}

export function executeWorkflow(
  id: string,
  input?: Record<string, unknown>,
): Promise<{ execution: t.TWorkflowExecution }> {
  return request.post(endpoints.workflowExecute(id), { input });
}

export function getWorkflowExecutions(
  id: string,
): Promise<{ executions: t.TWorkflowExecution[] }> {
  return request.get(endpoints.workflowExecutions(id));
}

export function getWorkflowExecution(
  id: string,
  executionId: string,
): Promise<{ execution: t.TWorkflowExecution }> {
  return request.get(endpoints.workflowExecutionGet(id, executionId));
}

export function approveWorkflowExecution(
  id: string,
  executionId: string,
): Promise<{ success: boolean }> {
  return request.post(endpoints.workflowExecutionApprove(id, executionId));
}

export function rejectWorkflowExecution(
  id: string,
  executionId: string,
): Promise<{ success: boolean }> {
  return request.post(endpoints.workflowExecutionReject(id, executionId));
}

export function cancelWorkflowExecution(
  id: string,
  executionId: string,
): Promise<{ success: boolean }> {
  return request.post(endpoints.workflowExecutionCancel(id, executionId));
}

export function retryWorkflowExecution(
  id: string,
  executionId: string,
): Promise<{ success: boolean }> {
  return request.post(endpoints.workflowExecutionRetry(id, executionId));
}

export function getWorkflowQueueStatus(): Promise<{ available: boolean; active?: number; waiting?: number; failed?: number }> {
  return request.get(endpoints.workflowQueueStatus());
}

/* Invites */
export function getInviteInfo(token: string): Promise<{ invite: t.TInviteInfo }> {
  return request.get(endpoints.inviteInfo(token));
}

export function acceptInviteByToken(token: string): Promise<{ success: boolean; organization: string }> {
  return request.post(endpoints.inviteAccept(token));
}

/* Shared Folders */
export function getOrgFolders(orgId: string, teamId?: string): Promise<{ folders: t.TSharedFolder[] }> {
  const query = teamId ? `?teamId=${teamId}` : '';
  return request.get(`${endpoints.orgFoldersList(orgId)}${query}`);
}

export function createOrgFolder(
  orgId: string,
  data: { name: string; teamId?: string; parentId?: string },
): Promise<{ folder: t.TSharedFolder }> {
  return request.post(endpoints.orgFolderCreate(orgId), data);
}

export function updateOrgFolder(
  orgId: string,
  folderId: string,
  data: { name: string },
): Promise<{ folder: t.TSharedFolder }> {
  return request.put(endpoints.orgFolderUpdate(orgId, folderId), data);
}

export function deleteOrgFolder(orgId: string, folderId: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.orgFolderDelete(orgId, folderId));
}

/* Team Prompts */
export function getTeamPrompts(orgId: string, teamId?: string): Promise<{ prompts: t.TTeamPrompt[] }> {
  const query = teamId ? `?teamId=${teamId}` : '';
  return request.get(`${endpoints.orgTeamPromptsList(orgId)}${query}`);
}

export function shareTeamPrompt(
  orgId: string,
  promptGroupId: string,
  teamId?: string,
): Promise<{ teamPrompt: t.TTeamPrompt }> {
  return request.post(endpoints.orgTeamPromptShare(orgId), { promptGroupId, teamId });
}

export function unshareTeamPrompt(orgId: string, promptGroupId: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.orgTeamPromptUnshare(orgId, promptGroupId));
}

/* Team Agents */
export function getTeamAgents(orgId: string, teamId?: string): Promise<{ agents: t.TTeamAgent[] }> {
  const query = teamId ? `?teamId=${teamId}` : '';
  return request.get(`${endpoints.orgTeamAgentsList(orgId)}${query}`);
}

export function shareTeamAgent(
  orgId: string,
  agentId: string,
  teamId?: string,
): Promise<{ teamAgent: t.TTeamAgent }> {
  return request.post(endpoints.orgTeamAgentShare(orgId), { agentId, teamId });
}

export function unshareTeamAgent(orgId: string, agentId: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.orgTeamAgentUnshare(orgId, agentId));
}

/* Org Billing */
export function getOrgSubscription(orgId: string): Promise<{ subscription: t.TOrgSubscription | null }> {
  return request.get(endpoints.orgBillingSubscription(orgId));
}

export function getOrgBalance(orgId: string): Promise<{ balance: t.TOrgBalance }> {
  return request.get(endpoints.orgBillingBalance(orgId));
}

export function getOrgTransactions(orgId: string): Promise<{ transactions: t.TOrgTransaction[] }> {
  return request.get(endpoints.orgBillingTransactions(orgId));
}

export function allocateOrgCredits(
  orgId: string,
  credits: number,
  description?: string,
): Promise<{ balance: t.TOrgBalance }> {
  return request.post(endpoints.orgBillingCreditsAllocate(orgId), { credits, description });
}

export function getOrgCreditSummary(orgId: string): Promise<t.TOrgCreditSummary> {
  return request.get(endpoints.orgBillingCreditSummary(orgId));
}

export function initializeOrgBilling(orgId: string): Promise<{ success: boolean }> {
  return request.post(endpoints.orgBillingInitialize(orgId));
}

/* ── Cost Optimizer ─────────────────────────────────────────── */

export function suggestOptimization(
  payload: t.TOptimizationSuggestRequest,
): Promise<t.TOptimizationSuggestion> {
  return request.post(endpoints.costOptimizerSuggest(), payload);
}

export function applyOptimization(
  payload: t.TOptimizationApplyRequest,
): Promise<t.TOptimizationResult> {
  return request.post(endpoints.costOptimizerApply(), payload);
}

export function getOptimizationSavings(params?: {
  days?: number;
  groupBy?: string;
  userId?: string;
}): Promise<t.TSavingsSummary> {
  return request.get(endpoints.costOptimizerSavings(), { params });
}

export function getRecentOptimizations(limit?: number): Promise<{ optimizations: t.TOptimizationLog[] }> {
  return request.get(endpoints.costOptimizerRecent(), { params: { limit } });
}

export function getCostOptimizerModels(params?: {
  provider?: string;
  minContext?: number;
  tier?: string;
}): Promise<{ models: t.TModelCostEntry[] }> {
  return request.get(endpoints.costOptimizerModels(), { params });
}

export function getCostOptimizerProviders(): Promise<{
  providers: Array<{ key: string; label: string; modelCount: number }>;
}> {
  return request.get(endpoints.costOptimizerProviders());
}

/* ── Prompt Optimizer ───────────────────────────────────────── */

export function optimizePrompt(
  payload: t.TPromptOptimizeRequest,
): Promise<t.TPromptOptimizeResponse> {
  return request.post(endpoints.promptOptimizerOptimize(), payload);
}

export function batchOptimizePrompts(payload: {
  prompts: string[];
  mode?: string;
}): Promise<{ results: t.TPromptOptimizeResponse[] }> {
  return request.post(endpoints.promptOptimizerBatch(), payload);
}

export function getPromptOptimizerModes(): Promise<{ modes: string[] }> {
  return request.get(endpoints.promptOptimizerModes());
}

/* ── Agent Marketplace ──────────────────────────────────────── */

export function getAgentMarketplaceListings(params?: {
  search?: string;
  category?: string;
  tags?: string;
  sort?: string;
  page?: number;
  sellerId?: string;
  featured?: string;
}): Promise<t.TAgentListingListResponse> {
  return request.get(endpoints.agentMarketplaceList(), { params });
}

export function getAgentMarketplaceListing(id: string): Promise<{ listing: t.TAgentListing }> {
  return request.get(endpoints.agentMarketplaceById(id));
}

export function createAgentMarketplaceListing(
  payload: Partial<t.TAgentListing>,
): Promise<{ listing: t.TAgentListing }> {
  return request.post(endpoints.agentMarketplaceCreate(), payload);
}

export function updateAgentMarketplaceListing(
  id: string,
  payload: Partial<t.TAgentListing>,
): Promise<{ listing: t.TAgentListing }> {
  return request.put(endpoints.agentMarketplaceUpdate(id), payload);
}

export function deleteAgentMarketplaceListing(id: string): Promise<{ deleted: boolean }> {
  return request.delete(endpoints.agentMarketplaceDelete(id));
}

export function installAgentMarketplaceListing(id: string): Promise<{ success: boolean; installed: boolean }> {
  return request.post(endpoints.agentMarketplaceInstall(id));
}

export function uninstallAgentMarketplaceListing(id: string): Promise<{ uninstalled: boolean }> {
  return request.post(endpoints.agentMarketplaceUninstall(id));
}

export function getInstalledAgentMarketplaceListings(): Promise<{ agents: Array<{ purchaseId: string; installedAt: string; listing: t.TAgentListing }> }> {
  return request.get(endpoints.agentMarketplaceInstalled());
}

export function getAgentMarketplaceReviews(id: string, params?: { page?: number }): Promise<t.TAgentReviewListResponse> {
  return request.get(endpoints.agentMarketplaceReviews(id), { params });
}

export function createAgentMarketplaceReview(
  id: string,
  payload: { rating: number; title?: string; review?: string; pros?: string; cons?: string },
): Promise<{ success: boolean }> {
  return request.post(endpoints.agentMarketplaceCreateReview(id), payload);
}

export function followAgentMarketplaceCreator(userId: string): Promise<{ success: boolean; following: boolean }> {
  return request.post(endpoints.agentMarketplaceFollow(userId));
}

export function unfollowAgentMarketplaceCreator(userId: string): Promise<{ success: boolean; following: boolean }> {
  return request.delete(endpoints.agentMarketplaceUnfollow(userId));
}

export function getAgentMarketplaceFollowers(
  userId: string,
  params?: { page?: number },
): Promise<{ followers: unknown[]; total: number; page: number; pages: number }> {
  return request.get(endpoints.agentMarketplaceFollowers(userId), { params });
}

export function getAgentMarketplaceFollowing(
  params?: { page?: number },
): Promise<{ following: unknown[]; total: number; page: number; pages: number }> {
  return request.get(endpoints.agentMarketplaceFollowing(), { params });
}

export function getAgentMarketplaceRevenue(
  params?: { status?: string },
): Promise<t.TAgentRevenueResponse> {
  return request.get(endpoints.agentMarketplaceRevenue(), { params });
}

export function getAgentMarketplaceCreatorProfile(userId: string): Promise<t.TCreatorProfile> {
  return request.get(endpoints.agentMarketplaceCreatorProfile(userId));
}

/* ── Provider Management (AI Infrastructure) ─────────────────────────── */

export function getProviderOverview(): Promise<prov.TProviderOverview> {
  return request.get(endpoints.adminAiProviderOverview());
}

export function getProvidersList(category?: string): Promise<prov.TAIProvider[]> {
  const params = category ? { category } : undefined;
  return request.get(endpoints.adminAiProviders(), { params });
}

export function getProviderById(id: string): Promise<prov.TAIProvider> {
  return request.get(endpoints.adminAiProviderById(id));
}

export function createProvider(data: Partial<prov.TAIProvider>): Promise<prov.TAIProvider> {
  return request.post(endpoints.adminAiProviders(), data);
}

export function updateProvider(id: string, data: Partial<prov.TAIProvider>): Promise<prov.TAIProvider> {
  return request.put(endpoints.adminAiProviderById(id), data);
}

export function deleteProvider(id: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.adminAiProviderById(id));
}

export function getProviderKeys(providerId: string): Promise<prov.TProviderKey[]> {
  return request.get(endpoints.adminAiProviderKeys(providerId));
}

export function createProviderKey(providerId: string, data: prov.TProviderKeyCreate): Promise<prov.TProviderKey> {
  return request.post(endpoints.adminAiProviderKeys(providerId), data);
}

export function testProviderKey(keyId: string): Promise<{ healthy: boolean; latencyMs: number; errorMessage?: string }> {
  return request.post(endpoints.adminAiProviderKeyTest(keyId));
}

export function deleteProviderKey(keyId: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.adminAiProviderKeyById(keyId));
}

export function getProviderModels(providerId: string): Promise<prov.TProviderModel[]> {
  return request.get(endpoints.adminAiProviderModels(providerId));
}

export function createProviderModel(providerId: string, data: Partial<prov.TProviderModel>): Promise<prov.TProviderModel> {
  return request.post(endpoints.adminAiProviderModels(providerId), data);
}

export function updateProviderModel(modelId: string, data: Partial<prov.TProviderModel>): Promise<prov.TProviderModel> {
  return request.put(endpoints.adminAiProviderModelById(modelId), data);
}

export function deleteProviderModel(modelId: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.adminAiProviderModelById(modelId));
}

export function getRoutingRules(category?: string): Promise<prov.TRoutingRule[]> {
  const params = category ? { category } : undefined;
  return request.get(endpoints.adminAiRoutingRules(), { params });
}

export function createRoutingRule(data: Partial<prov.TRoutingRule>): Promise<prov.TRoutingRule> {
  return request.post(endpoints.adminAiRoutingRules(), data);
}

export function updateRoutingRule(id: string, data: Partial<prov.TRoutingRule>): Promise<prov.TRoutingRule> {
  return request.put(endpoints.adminAiRoutingRuleById(id), data);
}

export function deleteRoutingRule(id: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.adminAiRoutingRuleById(id));
}

export function getProviderUsage(providerId?: string, days?: number): Promise<prov.TProviderUsage[]> {
  const params: Record<string, any> = {};
  if (providerId) { params.providerId = providerId; }
  if (days) { params.days = days; }
  return request.get(endpoints.adminAiProviderUsage(), { params });
}

export function getProviderCosts(days?: number): Promise<prov.TProviderCostSummary[]> {
  const params = days ? { days } : undefined;
  return request.get(endpoints.adminAiProviderCosts(), { params });
}

export function getProviderHealthHistory(providerId: string, days?: number): Promise<prov.TProviderHealthEntry[]> {
  const params = days ? { days } : undefined;
  return request.get(endpoints.adminAiProviderHealthHistory(providerId), { params });
}

export function getSystemDefaults(): Promise<prov.TSystemDefault[]> {
  return request.get(endpoints.adminAiSystemDefaults());
}

export function upsertSystemDefault(data: prov.TSystemDefault): Promise<prov.TSystemDefault> {
  return request.put(endpoints.adminAiSystemDefaults(), data);
}

/* ── Media (Image/Video unified) ─────────────────────────────────────── */

export function getMediaPresets(): Promise<media.MediaPreset[]> {
  return request.get(endpoints.mediaPresets());
}

export function getMediaCreditCosts(): Promise<Record<string, media.CreditCost>> {
  return request.get(endpoints.mediaCreditCosts());
}

export function generateMedia(type: string, payload: media.ImageGenerationRequest | media.VideoGenerationRequest): Promise<{ images?: media.MediaResultImage[]; videos?: media.MediaResultVideo[]; historyId: string; status: string }> {
  return request.post(endpoints.mediaGenerate(type), payload);
}

export function getMediaHistory(params?: { page?: number; limit?: number; type?: string; favorite?: string; search?: string }): Promise<media.MediaHistoryResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.type) query.set('type', params.type);
  if (params?.favorite) query.set('favorite', params.favorite);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return request.get(`${endpoints.mediaHistory()}${qs ? `?${qs}` : ''}`);
}

export function deleteMediaHistoryEntry(id: string): Promise<{ message: string }> {
  return request.delete(endpoints.mediaHistoryEntry(id));
}

export function toggleMediaFavorite(id: string): Promise<{ favorite: boolean }> {
  return request.patch(endpoints.mediaToggleFavorite(id));
}

export function retryMediaGeneration(id: string): Promise<media.MediaHistoryEntry> {
  return request.post(endpoints.mediaRetry(id));
}

export function cancelMediaGeneration(id: string): Promise<{ message: string }> {
  return request.post(endpoints.mediaCancel(id));
}

export function upscaleImage(historyId: string, imageId: string): Promise<{ filepath: string; fileId: string }> {
  return request.post(endpoints.imageGenUpscale(historyId), { imageId });
}

export function removeImageBackground(historyId: string, imageId: string): Promise<{ filepath: string; fileId: string }> {
  return request.post(endpoints.imageGenRemoveBg(historyId), { imageId });
}

export function createImageVariations(historyId: string, imageId: string): Promise<{ images: media.MediaResultImage[] }> {
  return request.post(endpoints.imageGenVariations(historyId), { imageId });
}

/* ── Admin Media Models ──────────────────────────────────────────────── */

export function getAdminMediaModels(type?: string): Promise<media.AdminMediaModel[]> {
  return request.get(endpoints.adminMediaModels(type));
}

export function createAdminMediaModel(data: Partial<media.AdminMediaModel>): Promise<media.AdminMediaModel> {
  return request.post(endpoints.adminMediaModels(), data);
}

export function updateAdminMediaModel(id: string, data: Partial<media.AdminMediaModel>): Promise<media.AdminMediaModel> {
  return request.put(endpoints.adminMediaModelById(id), data);
}

export function deleteAdminMediaModel(id: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.adminMediaModelById(id));
}

export function getAdminMediaRoutingRules(type?: string): Promise<media.MediaRoutingRule[]> {
  const params = type ? { type } : undefined;
  return request.get(endpoints.adminMediaRoutingRules(), { params });
}

export function createAdminMediaRoutingRule(data: Partial<media.MediaRoutingRule>): Promise<media.MediaRoutingRule> {
  return request.post(endpoints.adminMediaRoutingRules(), data);
}

export function updateAdminMediaRoutingRule(id: string, data: Partial<media.MediaRoutingRule>): Promise<media.MediaRoutingRule> {
  return request.put(endpoints.adminMediaRoutingRuleById(id), data);
}

export function deleteAdminMediaRoutingRule(id: string): Promise<{ success: boolean }> {
  return request.delete(endpoints.adminMediaRoutingRuleById(id));
}

export function getAdminMediaAnalytics(): Promise<media.MediaAnalytics> {
  return request.get(endpoints.adminMediaAnalytics());
}
