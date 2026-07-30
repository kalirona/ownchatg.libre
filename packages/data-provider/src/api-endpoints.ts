import type { StartupConfigContext } from './config';
import type { AssistantsEndpoint } from './schemas';
import { ResourceType } from './accessPermissions';
import * as q from './types/queries';

let BASE_URL = '';
if (
  typeof process === 'undefined' ||
  (process as typeof process & { browser?: boolean }).browser === true
) {
  // process is only available in node context, or process.browser is true in client-side code
  // This is to ensure that the BASE_URL is set correctly based on the <base>
  // element in the HTML document, if it exists.
  const baseEl = document.querySelector('base');
  BASE_URL = baseEl?.getAttribute('href') || '/';
}

if (BASE_URL && BASE_URL.endsWith('/')) {
  BASE_URL = BASE_URL.slice(0, -1);
}

export const apiBaseUrl = () => BASE_URL;

// Testing this buildQuery function
const buildQuery = (params: Record<string, unknown>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    })
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`).join('&');
      }
      return `${key}=${encodeURIComponent(String(value))}`;
    })
    .join('&');
  return query ? `?${query}` : '';
};

export const health = () => `${BASE_URL}/health`;
export const user = () => `${BASE_URL}/api/user`;

export const balance = () => `${BASE_URL}/api/balance`;

export const userPlugins = () => `${BASE_URL}/api/user/plugins`;
export const userProfile = () => `${BASE_URL}/api/user/profile`;

export const deleteUser = () => `${BASE_URL}/api/user/delete`;

const messagesRoot = `${BASE_URL}/api/messages`;

export const messages = (params: q.MessagesListParams) => {
  const { conversationId, messageId, ...rest } = params;

  if (conversationId && messageId) {
    return `${messagesRoot}/${conversationId}/${messageId}`;
  }

  if (conversationId) {
    return `${messagesRoot}/${conversationId}`;
  }

  return `${messagesRoot}${buildQuery(rest)}`;
};

export const messagesArtifacts = (messageId: string) => `${messagesRoot}/artifact/${messageId}`;

export const messagesBranch = () => `${messagesRoot}/branch`;

const shareRoot = `${BASE_URL}/api/share`;
export const shareMessages = (shareId: string) => `${shareRoot}/${shareId}`;
export const forkSharedMessages = (shareId: string) => `${shareRoot}/${shareId}/fork`;
export const sharedStartupConfig = (shareId: string) => `${shareMessages(shareId)}/config`;
export const getSharedLink = (conversationId: string) => `${shareRoot}/link/${conversationId}`;
export const getSharedLinks = (
  pageSize: number,
  sortBy: 'title' | 'createdAt',
  sortDirection: 'asc' | 'desc',
  search?: string,
  cursor?: string,
) =>
  `${shareRoot}?pageSize=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}${
    search ? `&search=${search}` : ''
  }${cursor ? `&cursor=${cursor}` : ''}`;
export const createSharedLink = (conversationId: string) => `${shareRoot}/${conversationId}`;
export const updateSharedLink = (shareId: string) => `${shareRoot}/${shareId}`;
/** Share-scoped file routes: serve snapshotted files via shared-link permission. */
export const sharedFile = (shareId: string, fileId: string) =>
  `${shareRoot}/${shareId}/files/${encodeURIComponent(fileId)}`;
export const sharedFileDownload = (shareId: string, fileId: string) =>
  `${sharedFile(shareId, fileId)}/download`;
export const sharedFilePreview = (shareId: string, fileId: string) =>
  `${sharedFile(shareId, fileId)}/preview`;

const keysEndpoint = `${BASE_URL}/api/keys`;

export const keys = () => keysEndpoint;

export const userKeyQuery = (name: string) => `${keysEndpoint}?name=${name}`;

export const revokeUserKey = (name: string) => `${keysEndpoint}/${name}`;

export const revokeAllUserKeys = () => `${keysEndpoint}?all=true`;

const apiKeysEndpoint = `${BASE_URL}/api/api-keys`;

export const apiKeys = () => apiKeysEndpoint;

export const apiKeyById = (id: string) => `${apiKeysEndpoint}/${id}`;

export const conversationsRoot = `${BASE_URL}/api/convos`;

export const conversations = (params: q.ConversationListParams) => {
  return `${conversationsRoot}${buildQuery(params)}`;
};

export const conversationById = (id: string) => `${conversationsRoot}/${id}`;

export const genTitle = (conversationId: string) =>
  `${conversationsRoot}/gen_title/${encodeURIComponent(conversationId)}`;

export const updateConversation = () => `${conversationsRoot}/update`;

export const archiveConversation = () => `${conversationsRoot}/archive`;
export const pinConversation = () => `${conversationsRoot}/pin`;

export const deleteConversation = () => `${conversationsRoot}`;

export const deleteAllConversation = () => `${conversationsRoot}/all`;

export const importConversation = () => `${conversationsRoot}/import`;

export const forkConversation = () => `${conversationsRoot}/fork`;

export const duplicateConversation = () => `${conversationsRoot}/duplicate`;

export const projectsRoot = `${BASE_URL}/api/projects`;

export const projects = (params: q.ProjectListParams = {}) => {
  return `${projectsRoot}${buildQuery(params)}`;
};

export const projectById = (id: string) => `${projectsRoot}/${encodeURIComponent(id)}`;

export const projectConversation = (conversationId: string) =>
  `${projectsRoot}/conversations/${encodeURIComponent(conversationId)}`;

export const search = (q: string, cursor?: string | null) =>
  `${BASE_URL}/api/search?q=${q}${cursor ? `&cursor=${cursor}` : ''}`;

export const searchEnabled = () => `${BASE_URL}/api/search/enable`;

export const presets = () => `${BASE_URL}/api/presets`;

export const deletePreset = () => `${BASE_URL}/api/presets/delete`;

export const aiEndpoints = () => `${BASE_URL}/api/endpoints`;

export const tokenConfig = () => `${BASE_URL}/api/endpoints/token-config`;

export const models = () => `${BASE_URL}/api/models`;

export const tokenizer = () => `${BASE_URL}/api/tokenizer`;

export const login = () => `${BASE_URL}/api/auth/login`;

export const logout = () => `${BASE_URL}/api/auth/logout`;

export const register = () => `${BASE_URL}/api/auth/register`;

export const loginFacebook = () => `${BASE_URL}/api/auth/facebook`;

export const loginGoogle = () => `${BASE_URL}/api/auth/google`;

export const refreshToken = (retry?: boolean) =>
  `${BASE_URL}/api/auth/refresh${retry === true ? '?retry=true' : ''}`;

export const requestPasswordReset = () => `${BASE_URL}/api/auth/requestPasswordReset`;

export const resetPassword = () => `${BASE_URL}/api/auth/resetPassword`;

export const verifyEmail = () => `${BASE_URL}/api/user/verify`;

// Auth page URLs (for client-side navigation and redirects)
export const loginPage = () => `${BASE_URL}/login`;
export const registerPage = () => `${BASE_URL}/register`;

const REDIRECT_PARAM = 'redirect_to';
const LOGIN_PATH_RE = /(?:^|\/)login(?:\/|$)/;

/**
 * Builds a `/login?redirect_to=...` URL from the given or current location.
 * Returns plain `/login` (no param) when already on a login route to prevent recursive nesting.
 */
export function buildLoginRedirectUrl(pathname?: string, search?: string, hash?: string): string {
  const p = pathname ?? window.location.pathname;
  if (LOGIN_PATH_RE.test(p)) {
    return '/login';
  }
  const s = search ?? window.location.search;
  const h = hash ?? window.location.hash;

  const stripped =
    BASE_URL && (p === BASE_URL || p.startsWith(BASE_URL + '/'))
      ? p.slice(BASE_URL.length) || '/'
      : p;
  const currentPath = `${stripped}${s}${h}`;
  if (!currentPath || currentPath === '/') {
    return '/login';
  }
  return `/login?${REDIRECT_PARAM}=${encodeURIComponent(currentPath)}`;
}

export const resendVerificationEmail = () => `${BASE_URL}/api/user/verify/resend`;

export const plugins = () => `${BASE_URL}/api/plugins`;

export const mcpReinitialize = (serverName: string) =>
  `${BASE_URL}/api/mcp/${serverName}/reinitialize`;
export const mcpConnectionStatus = () => `${BASE_URL}/api/mcp/connection/status`;
export const mcpServerConnectionStatus = (serverName: string) =>
  `${BASE_URL}/api/mcp/connection/status/${serverName}`;
export const mcpAuthValues = (serverName: string) => {
  return `${BASE_URL}/api/mcp/${serverName}/auth-values`;
};

export const cancelMCPOAuth = (serverName: string) => {
  return `${BASE_URL}/api/mcp/oauth/cancel/${serverName}`;
};

export const mcpOAuthBind = (serverName: string) => `${BASE_URL}/api/mcp/${serverName}/oauth/bind`;

export const actionOAuthBind = (actionId: string) =>
  `${BASE_URL}/api/actions/${actionId}/oauth/bind`;

export const config = (context?: StartupConfigContext) =>
  `${BASE_URL}/api/config${buildQuery({ context })}`;

export const prompts = () => `${BASE_URL}/api/prompts`;

export const addPromptToGroup = (groupId: string) =>
  `${BASE_URL}/api/prompts/groups/${groupId}/prompts`;

export const assistants = ({
  path = '',
  options,
  version,
  endpoint,
  isAvatar,
}: {
  path?: string;
  options?: object;
  endpoint?: AssistantsEndpoint;
  version: number | string;
  isAvatar?: boolean;
}) => {
  let url = isAvatar === true ? `${images()}/assistants` : `${BASE_URL}/api/assistants/v${version}`;

  if (path && path !== '') {
    url += `/${path}`;
  }

  if (endpoint) {
    options = {
      ...(options ?? {}),
      endpoint,
    };
  }

  if (options && Object.keys(options).length > 0) {
    const queryParams = new URLSearchParams(options as Record<string, string>).toString();
    url += `?${queryParams}`;
  }

  return url;
};

export const agents = ({ path = '', options }: { path?: string; options?: object }) => {
  let url = `${BASE_URL}/api/agents`;

  if (path && path !== '') {
    url += `/${path}`;
  }

  if (options && Object.keys(options).length > 0) {
    const queryParams = new URLSearchParams(options as Record<string, string>).toString();
    url += `?${queryParams}`;
  }

  return url;
};

export const activeJobs = () => `${BASE_URL}/api/agents/chat/active`;

export const mcp = {
  tools: `${BASE_URL}/api/mcp/tools`,
  servers: `${BASE_URL}/api/mcp/servers`,
};

export const mcpServer = (serverName: string) => `${BASE_URL}/api/mcp/servers/${serverName}`;

export const revertAgentVersion = (agent_id: string) => `${agents({ path: `${agent_id}/revert` })}`;

export const files = () => `${BASE_URL}/api/files`;
export const fileUpload = () => `${BASE_URL}/api/files`;
export const fileDelete = () => `${BASE_URL}/api/files`;
export const fileDownload = (userId: string, fileId: string) =>
  `${BASE_URL}/api/files/download/${userId}/${fileId}`;
/* Deferred-preview lifecycle endpoint. Returns
 * `{ status, text?, textFormat?, previewError? }` so the frontend can
 * poll while background HTML extraction is in flight. See PR #12957. */
export const filePreview = (fileId: string) =>
  `${BASE_URL}/api/files/${encodeURIComponent(fileId)}/preview`;
export const fileConfig = () => `${BASE_URL}/api/files/config`;
export const agentFiles = (agentId: string) => `${BASE_URL}/api/files/agent/${agentId}`;

export const images = () => `${files()}/images`;

export const avatar = () => `${images()}/avatar`;

export const speech = () => `${files()}/speech`;

export const speechToText = () => `${speech()}/stt`;

export const textToSpeech = () => `${speech()}/tts`;

export const textToSpeechManual = () => `${textToSpeech()}/manual`;

export const textToSpeechVoices = () => `${textToSpeech()}/voices`;

export const getCustomConfigSpeech = () => `${speech()}/config/get`;

export const getPromptGroup = (_id: string) => `${prompts()}/groups/${_id}`;

export const getPromptGroupsWithFilters = (filter: object) => {
  let url = `${prompts()}/groups`;
  // Filter out undefined/null values
  const cleanedFilter = Object.entries(filter).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  if (Object.keys(cleanedFilter).length > 0) {
    const queryParams = new URLSearchParams(cleanedFilter).toString();
    url += `?${queryParams}`;
  }
  return url;
};

export const getPromptsWithFilters = (filter: object) => {
  let url = prompts();
  if (Object.keys(filter).length > 0) {
    const queryParams = new URLSearchParams(filter as Record<string, string>).toString();
    url += `?${queryParams}`;
  }
  return url;
};

export const getPrompt = (_id: string) => `${prompts()}/${_id}`;

export const getRandomPrompts = (limit: number, skip: number) =>
  `${prompts()}/random?limit=${limit}&skip=${skip}`;

export const postPrompt = prompts;

export const updatePromptGroup = getPromptGroup;

export const recordPromptGroupUsage = (groupId: string) => `${prompts()}/groups/${groupId}/use`;

export const updatePromptLabels = (_id: string) => `${getPrompt(_id)}/labels`;

export const updatePromptTag = (_id: string) => `${getPrompt(_id)}/tags/production`;

export const deletePromptGroup = getPromptGroup;

export const deletePrompt = ({ _id, groupId }: { _id: string; groupId: string }) => {
  return `${prompts()}/${_id}?groupId=${groupId}`;
};

export const getCategories = () => `${BASE_URL}/api/categories`;

export const getAllPromptGroups = () => `${prompts()}/all`;

/* Skills */
export const skills = () => `${BASE_URL}/api/skills`;
export const importSkill = () => `${skills()}/import`;

export const getSkill = (id: string) => `${skills()}/${encodeURIComponent(id)}`;

export const listSkillsWithFilters = (
  filter: Record<string, string | number | undefined | null>,
) => {
  const cleaned = Object.entries(filter).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = String(value);
      }
      return acc;
    },
    {} as Record<string, string>,
  );
  const query =
    Object.keys(cleaned).length > 0 ? `?${new URLSearchParams(cleaned).toString()}` : '';
  return `${skills()}${query}`;
};

export const skillFiles = (id: string) => `${getSkill(id)}/files`;

export const skillFile = (id: string, relativePath: string) =>
  `${skillFiles(id)}/${encodeURIComponent(relativePath)}`;

export const adminSkillsSync = () => `${BASE_URL}/api/admin/skills/sync`;
export const adminSkillsSyncStatus = () => `${adminSkillsSync()}/status`;
export const adminSkillsSyncRun = () => `${adminSkillsSync()}/run`;
export const adminSkillsSyncCredential = (credentialKey: string) =>
  `${adminSkillsSync()}/credentials/${encodeURIComponent(credentialKey)}`;

/**
 * Skill filesystem tree (phase 2). URL shape mirrors the original UI PR so
 * the tree hooks keep their call surface. `path` is pre-encoded by the
 * caller (e.g. `${nodeId}/content`).
 */
export const skillTree = ({ skillId, path = '' }: { skillId: string; path?: string }) => {
  let url = `${BASE_URL}/api/skills/${encodeURIComponent(skillId)}/tree`;
  if (path) {
    url += `/${path}`;
  }
  return url;
};

/* Skill active states (per-user overrides) */
export const skillStates = () => `${BASE_URL}/api/user/settings/skills/active`;

/* Tool favorites (starred marketplace items) */
export const toolFavorites = () => `${BASE_URL}/api/user/settings/favorites/tools`;
export const toolFavorite = (itemType: string, itemId: string) =>
  `${toolFavorites()}/${itemType}/${encodeURIComponent(itemId)}`;

/* Roles */
export const roles = () => `${BASE_URL}/api/roles`;
export const adminRoles = () => `${BASE_URL}/api/admin/roles`;
export const getRole = (roleName: string) => `${roles()}/${encodeURIComponent(roleName)}`;
export const updatePromptPermissions = (roleName: string) => `${getRole(roleName)}/prompts`;
export const updateMemoryPermissions = (roleName: string) => `${getRole(roleName)}/memories`;
export const updateAgentPermissions = (roleName: string) => `${getRole(roleName)}/agents`;
export const updatePeoplePickerPermissions = (roleName: string) =>
  `${getRole(roleName)}/people-picker`;
export const updateMCPServersPermissions = (roleName: string) => `${getRole(roleName)}/mcp-servers`;
export const updateRemoteAgentsPermissions = (roleName: string) =>
  `${getRole(roleName)}/remote-agents`;

export const updateMarketplacePermissions = (roleName: string) =>
  `${getRole(roleName)}/marketplace`;
export const updateSkillPermissions = (roleName: string) => `${getRole(roleName)}/skills`;

/* Conversation Tags */
export const conversationTags = (tag?: string) =>
  `${BASE_URL}/api/tags${tag != null && tag ? `/${encodeURIComponent(tag)}` : ''}`;

export const conversationTagsList = (pageNumber: string, sort?: string, order?: string) =>
  `${conversationTags()}/list?pageNumber=${pageNumber}${sort ? `&sort=${sort}` : ''}${
    order ? `&order=${order}` : ''
  }`;

export const addTagToConversation = (conversationId: string) =>
  `${conversationTags()}/convo/${conversationId}`;

export const userTerms = () => `${BASE_URL}/api/user/terms`;

/* Billing endpoints */
export const billingPlans = () => `${BASE_URL}/api/billing/plans`;
export const billingCreditPacks = () => `${BASE_URL}/api/billing/credit-packs`;
export const billingCreateCheckout = () => `${BASE_URL}/api/billing/create-checkout`;
export const billingCreatePortal = () => `${BASE_URL}/api/billing/create-portal`;
export const billingSubscription = () => `${BASE_URL}/api/billing/subscription`;
export const billingSubscriptionCancel = () => `${BASE_URL}/api/billing/subscription/cancel`;
export const billingTransactions = () => `${BASE_URL}/api/billing/transactions`;
export const acceptUserTerms = () => `${BASE_URL}/api/user/terms/accept`;
export const banner = () => `${BASE_URL}/api/banner`;

// Message Feedback
export const feedback = (conversationId: string, messageId: string) =>
  `${BASE_URL}/api/messages/${conversationId}/${messageId}/feedback`;

// Two-Factor Endpoints
export const enableTwoFactor = () => `${BASE_URL}/api/auth/2fa/enable`;
export const verifyTwoFactor = () => `${BASE_URL}/api/auth/2fa/verify`;
export const confirmTwoFactor = () => `${BASE_URL}/api/auth/2fa/confirm`;
export const disableTwoFactor = () => `${BASE_URL}/api/auth/2fa/disable`;
export const regenerateBackupCodes = () => `${BASE_URL}/api/auth/2fa/backup/regenerate`;
export const verifyTwoFactorTemp = () => `${BASE_URL}/api/auth/2fa/verify-temp`;

/* Memories */
export const memories = () => `${BASE_URL}/api/memories`;
export const memory = (key: string) => `${memories()}/${encodeURIComponent(key)}`;
export const memoryPreferences = () => `${memories()}/preferences`;

export const searchPrincipals = (params: q.PrincipalSearchParams) => {
  const { q: query, limit, types } = params;
  let url = `${BASE_URL}/api/permissions/search-principals?q=${encodeURIComponent(query)}`;

  if (limit !== undefined) {
    url += `&limit=${limit}`;
  }

  if (types && types.length > 0) {
    url += `&types=${types.join(',')}`;
  }

  return url;
};

export const getAccessRoles = (resourceType: ResourceType) =>
  `${BASE_URL}/api/permissions/${resourceType}/roles`;

export const getResourcePermissions = (resourceType: ResourceType, resourceId: string) =>
  `${BASE_URL}/api/permissions/${resourceType}/${resourceId}`;

export const updateResourcePermissions = (resourceType: ResourceType, resourceId: string) =>
  `${BASE_URL}/api/permissions/${resourceType}/${resourceId}`;

export const getEffectivePermissions = (resourceType: ResourceType, resourceId: string) =>
  `${BASE_URL}/api/permissions/${resourceType}/${resourceId}/effective`;

export const getAllEffectivePermissions = (resourceType: ResourceType) =>
  `${BASE_URL}/api/permissions/${resourceType}/effective/all`;

// SharePoint Graph API Token
export const graphToken = (scopes: string) =>
  `${BASE_URL}/api/auth/graph-token?scopes=${encodeURIComponent(scopes)}`;

/* Image Generation */
const imageGenRoot = `${BASE_URL}/api/images`;
export const imageGenProviders = () => `${imageGenRoot}/providers`;
export const imageGenGenerate = () => `${imageGenRoot}/generate`;
export const imageGenHistory = () => `${imageGenRoot}/history`;
export const imageGenHistoryEntry = (id: string) => `${imageGenRoot}/history/${id}`;
export const imageGenToggleFavorite = (id: string) => `${imageGenRoot}/history/${id}/favorite`;
export const imageGenUpscale = (id: string) => `${imageGenRoot}/upscale/${id}`;
export const imageGenRemoveBg = (id: string) => `${imageGenRoot}/remove-bg/${id}`;
export const imageGenVariations = (id: string) => `${imageGenRoot}/variations/${id}`;

/* Video Generation */
const videoGenRoot = `${BASE_URL}/api/video`;
export const videoGenProviders = () => `${videoGenRoot}/providers`;
export const videoGenDurationLimits = () => `${videoGenRoot}/duration-limits`;
export const videoGenGenerate = () => `${videoGenRoot}/generate`;
export const videoGenHistory = () => `${videoGenRoot}/history`;
export const videoGenStatus = (id: string) => `${videoGenRoot}/history/${id}/status`;
export const videoGenHistoryEntry = (id: string) => `${videoGenRoot}/history/${id}`;
export const videoGenToggleFavorite = (id: string) => `${videoGenRoot}/history/${id}/favorite`;

/* Media (shared) */
const mediaRoot = `${BASE_URL}/api/media`;
export const mediaGenerate = (type: string) => `${mediaRoot}/generate/${type}`;
export const mediaHistory = () => `${mediaRoot}/history`;
export const mediaHistoryEntry = (id: string) => `${mediaRoot}/history/${id}`;
export const mediaToggleFavorite = (id: string) => `${mediaRoot}/history/${id}/favorite`;
export const mediaRetry = (id: string) => `${mediaRoot}/history/${id}/retry`;
export const mediaCancel = (id: string) => `${mediaRoot}/history/${id}/cancel`;
export const mediaCreditCosts = () => `${mediaRoot}/credit-costs`;
export const mediaPresets = () => `${mediaRoot}/presets`;

/* Admin Media Models */
const adminMediaRoot = `${BASE_URL}/api/admin/media`;
export const adminMediaModels = (type?: string) => type ? `${adminMediaRoot}/models/${type}` : `${adminMediaRoot}/models`;
export const adminMediaModelById = (id: string) => `${adminMediaRoot}/models/${id}`;
export const adminMediaRoutingRules = () => `${adminMediaRoot}/routing`;
export const adminMediaRoutingRuleById = (id: string) => `${adminMediaRoot}/routing/${id}`;
export const adminMediaAnalytics = () => `${adminMediaRoot}/analytics`;

/* Knowledge / RAG Workspace */
const knowledgeRoot = `${BASE_URL}/api/knowledge`;
export const knowledgeDocuments = () => `${knowledgeRoot}/documents`;
export const knowledgeUpload = () => `${knowledgeRoot}/upload`;
export const knowledgeDocument = (id: string) => `${knowledgeRoot}/documents/${id}`;
export const knowledgeDocumentDetail = (id: string) => `${knowledgeRoot}/documents/${id}/detail`;
export const knowledgeDocumentRename = (id: string) => `${knowledgeRoot}/documents/${id}/rename`;
export const knowledgeDocumentReindex = (id: string) => `${knowledgeRoot}/documents/${id}/reindex`;
export const knowledgeDocumentMove = (id: string) => `${knowledgeRoot}/documents/${id}/move`;
export const knowledgeCollections = () => `${knowledgeRoot}/collections`;
export const knowledgeCollection = (id: string) => `${knowledgeRoot}/collections/${id}`;
export const knowledgeCollectionAnalytics = (id: string) => `${knowledgeRoot}/collections/${id}/analytics`;
export const knowledgeCollectionFiles = (id: string) => `${knowledgeRoot}/collections/${id}/files`;
export const knowledgeCollectionFile = (id: string, fileId: string) => `${knowledgeRoot}/collections/${id}/files/${fileId}`;
export const knowledgeSearch = () => `${knowledgeRoot}/search`;
export const knowledgeChat = () => `${knowledgeRoot}/chat`;
export const knowledgeQuickAction = () => `${knowledgeRoot}/quick-action`;
export const knowledgeAdminSettings = () => `${knowledgeRoot}/admin/settings`;
export const knowledgeUploadAsync = () => `${knowledgeRoot}/upload/async`;
export const knowledgeImportJobs = () => `${knowledgeRoot}/jobs`;
export const knowledgeImportJob = (id: string) => `${knowledgeRoot}/jobs/${id}`;
export const knowledgeImportJobCancel = (id: string) => `${knowledgeRoot}/jobs/${id}/cancel`;
export const knowledgeImportJobRetry = (id: string) => `${knowledgeRoot}/jobs/${id}/retry`;
export const knowledgeImportJobSSE = (id: string) => `${knowledgeRoot}/jobs/${id}/sse`;
export const knowledgeCollectionReindex = (id: string) => `${knowledgeRoot}/collections/${id}/reindex`;
export const knowledgeAdminQueueStatus = () => `${knowledgeRoot}/admin/queue/status`;
export const knowledgeAdminQueueFailed = () => `${knowledgeRoot}/admin/queue/failed`;

/* Prompt Marketplace */
const marketplaceRoot = `${BASE_URL}/api/marketplace`;
export const marketplacePrompts = () => `${marketplaceRoot}/prompts`;
export const marketplaceFeatured = () => `${marketplaceRoot}/featured`;
export const marketplaceCategories = () => `${marketplaceRoot}/categories`;
export const marketplaceFavorites = () => `${marketplaceRoot}/favorites`;
export const marketplaceToggleFavorite = (groupId: string) => `${marketplaceRoot}/favorites/${groupId}`;

/* Admin / Super Admin */
const adminSuperRoot = `${BASE_URL}/api/admin/super`;
export const adminDashboardStats = () => `${adminSuperRoot}/dashboard`;
export const adminUserDetail = (id: string) => `${adminSuperRoot}/users/${id}`;
export const adminUpdateUserRole = (id: string) => `${adminSuperRoot}/users/${id}/role`;
export const adminAdjustCredits = () => `${adminSuperRoot}/credits/adjust`;
export const adminRevenue = () => `${adminSuperRoot}/revenue`;
export const adminSubscriptions = () => `${adminSuperRoot}/subscriptions`;
export const adminCancelSubscription = (id: string) => `${adminSuperRoot}/subscriptions/${id}/cancel`;
export const adminProviders = () => `${adminSuperRoot}/providers`;
export const adminModels = () => `${adminSuperRoot}/models`;
export const adminAnnouncements = () => `${adminSuperRoot}/announcements`;
export const adminAnnouncement = (id: string) => `${adminSuperRoot}/announcements/${id}`;
export const adminHealth = () => `${adminSuperRoot}/health`;
export const adminFeatures = () => `${adminSuperRoot}/features`;
export const adminAuditLog = () => `${adminSuperRoot}/audit`;
export const adminAnalytics = () => `${adminSuperRoot}/analytics`;
export const adminLockedUsers = () => `${adminSuperRoot}/locked-users`;
export const adminUnlockUser = (id: string) => `${adminSuperRoot}/users/${id}/unlock`;

/* Notifications */
const notificationsRoot = `${BASE_URL}/api/notifications`;
export const notificationsList = () => `${notificationsRoot}`;
export const notificationsUnreadCount = () => `${notificationsRoot}/unread-count`;
export const notificationRead = (id: string) => `${notificationsRoot}/${id}/read`;
export const notificationsReadAll = () => `${notificationsRoot}/read-all`;
export const notificationDelete = (id: string) => `${notificationsRoot}/${id}`;
export const notificationPreferences = () => `${notificationsRoot}/preferences`;
export const notificationPreferencesUpdate = () => `${notificationsRoot}/preferences`;
export const notificationPushSubscribe = () => `${notificationsRoot}/preferences/push/subscribe`;
export const notificationPushUnsubscribe = () => `${notificationsRoot}/preferences/push/unsubscribe`;
export const notificationSendDigest = () => `${notificationsRoot}/digest/send`;

/* Integrations */
const integrationsRoot = `${BASE_URL}/api/integrations`;
export const integrationsList = () => `${integrationsRoot}`;
export const integrationGet = (provider: string) => `${integrationsRoot}/${provider}`;
export const integrationConfig = (provider: string) => `${integrationsRoot}/${provider}/config`;
export const integrationDelete = (provider: string) => `${integrationsRoot}/${provider}`;
export const integrationOAuthAuthorize = (provider: string) => `${integrationsRoot}/oauth/${provider}/auth`;
export const integrationOAuthCallback = (provider: string) => `${integrationsRoot}/oauth/${provider}/callback`;
export const integrationOAuthStatus = (provider: string) => `${integrationsRoot}/oauth/${provider}/status`;
export const integrationOAuthDisconnect = (provider: string) => `${integrationsRoot}/oauth/${provider}/disconnect`;
export const integrationOAuthRefresh = (provider: string) => `${integrationsRoot}/oauth/${provider}/refresh`;

/* Organizations */
const orgsRoot = `${BASE_URL}/api/organizations`;
export const orgsList = () => `${orgsRoot}`;
export const orgCreate = () => `${orgsRoot}`;
export const orgGet = (id: string) => `${orgsRoot}/${id}`;
export const orgUpdate = (id: string) => `${orgsRoot}/${id}`;
export const orgDelete = (id: string) => `${orgsRoot}/${id}`;
export const orgMembers = (id: string) => `${orgsRoot}/${id}/members`;
export const orgMemberRole = (id: string) => `${orgsRoot}/${id}/members/role`;
export const orgMemberRemove = (id: string, userId: string) => `${orgsRoot}/${id}/members/${userId}`;
export const orgInvites = (id: string) => `${orgsRoot}/${id}/invites`;
export const orgInviteCreate = (id: string) => `${orgsRoot}/${id}/invites`;
export const orgInviteAccept = (id: string) => `${orgsRoot}/${id}/invites/accept`;
export const orgInviteRevoke = (id: string, inviteId: string) => `${orgsRoot}/${id}/invites/${inviteId}`;
export const orgTeams = (id: string) => `${orgsRoot}/${id}/teams`;
export const orgTeamCreate = (id: string) => `${orgsRoot}/${id}/teams`;
export const orgTeamUpdate = (id: string, teamId: string) => `${orgsRoot}/${id}/teams/${teamId}`;
export const orgTeamDelete = (id: string, teamId: string) => `${orgsRoot}/${id}/teams/${teamId}`;
export const orgTeamMembers = (id: string, teamId: string) => `${orgsRoot}/${id}/teams/${teamId}/members`;
export const orgTeamMemberAdd = (id: string, teamId: string) => `${orgsRoot}/${id}/teams/${teamId}/members`;
export const orgTeamMemberRemove = (id: string, teamId: string, userId: string) => `${orgsRoot}/${id}/teams/${teamId}/members/${userId}`;

/* Branding */
const brandingRoot = `${BASE_URL}/api/branding`;
export const brandingPublic = () => `${brandingRoot}/public`;
export const brandingConfig = () => `${brandingRoot}`;
export const brandingUpdate = () => `${brandingRoot}`;
export const brandingUpload = (type: string) => `${brandingRoot}/upload/${type}`;
export const brandingVerifyDomain = () => `${brandingRoot}/verify-domain`;
export const brandingSSLStatus = () => `${brandingRoot}/ssl-status`;
export const brandingStatus = () => `${brandingRoot}/status`;
export const brandingDocs = () => `${brandingRoot}/docs`;
export const brandingReset = (organizationId: string) => `${brandingRoot}/${organizationId}`;

/* Workflows */
const workflowsRoot = `${BASE_URL}/api/workflows`;
export const workflowsList = () => `${workflowsRoot}`;
export const workflowCreate = () => `${workflowsRoot}`;
export const workflowGet = (id: string) => `${workflowsRoot}/${id}`;
export const workflowUpdate = (id: string) => `${workflowsRoot}/${id}`;
export const workflowDelete = (id: string) => `${workflowsRoot}/${id}`;
export const workflowExecute = (id: string) => `${workflowsRoot}/${id}/execute`;
export const workflowExecutions = (id: string) => `${workflowsRoot}/${id}/executions`;
export const workflowExecutionGet = (id: string, executionId: string) => `${workflowsRoot}/${id}/executions/${executionId}`;
export const workflowExecutionApprove = (id: string, executionId: string) => `${workflowsRoot}/${id}/executions/${executionId}/approve`;
export const workflowExecutionReject = (id: string, executionId: string) => `${workflowsRoot}/${id}/executions/${executionId}/reject`;
export const workflowExecutionCancel = (id: string, executionId: string) => `${workflowsRoot}/${id}/executions/${executionId}/cancel`;
export const workflowExecutionRetry = (id: string, executionId: string) => `${workflowsRoot}/${id}/executions/${executionId}/retry`;
export const workflowQueueStatus = () => `${workflowsRoot}/queue/status`;

/* Invites */
const invitesRoot = `${BASE_URL}/api/invites`;
export const inviteInfo = (token: string) => `${invitesRoot}/${token}`;
export const inviteAccept = (token: string) => `${invitesRoot}/${token}/accept`;

/* Shared Folders (mounted under /api/organizations) */
const orgFolderRoot = (id: string) => `${orgsRoot}/${id}/folders`;
export const orgFoldersList = (id: string) => `${orgFolderRoot(id)}`;
export const orgFolderCreate = (id: string) => `${orgFolderRoot(id)}`;
export const orgFolderUpdate = (id: string, folderId: string) => `${orgFolderRoot(id)}/${folderId}`;
export const orgFolderDelete = (id: string, folderId: string) => `${orgFolderRoot(id)}/${folderId}`;

/* Team Prompts (mounted under /api/organizations) */
const orgTeamPromptRoot = (id: string) => `${orgsRoot}/${id}/prompts`;
export const orgTeamPromptsList = (id: string) => `${orgTeamPromptRoot(id)}`;
export const orgTeamPromptShare = (id: string) => `${orgTeamPromptRoot(id)}`;
export const orgTeamPromptUnshare = (id: string, promptGroupId: string) => `${orgTeamPromptRoot(id)}/${promptGroupId}`;

/* Team Agents (mounted under /api/organizations) */
const orgTeamAgentRoot = (id: string) => `${orgsRoot}/${id}/agents`;
export const orgTeamAgentsList = (id: string) => `${orgTeamAgentRoot(id)}`;
export const orgTeamAgentShare = (id: string) => `${orgTeamAgentRoot(id)}`;
export const orgTeamAgentUnshare = (id: string, agentId: string) => `${orgTeamAgentRoot(id)}/${agentId}`;

/* Org Billing (mounted under /api/organizations) */
const orgBillingRoot = (id: string) => `${orgsRoot}/${id}/billing`;
export const orgBillingSubscription = (id: string) => `${orgBillingRoot(id)}/subscription`;
export const orgBillingBalance = (id: string) => `${orgBillingRoot(id)}/balance`;
export const orgBillingTransactions = (id: string) => `${orgBillingRoot(id)}/transactions`;
export const orgBillingCreditsAllocate = (id: string) => `${orgBillingRoot(id)}/credits/allocate`;
export const orgBillingCreditSummary = (id: string) => `${orgBillingRoot(id)}/summary`;
export const orgBillingInitialize = (id: string) => `${orgBillingRoot(id)}/initialize`;

/* Cost Optimizer */
const costOptimizerRoot = () => `${BASE_URL}/api/cost-optimizer`;
export const costOptimizerSuggest = () => `${costOptimizerRoot()}/suggest`;
export const costOptimizerApply = () => `${costOptimizerRoot()}/apply`;
export const costOptimizerSavings = () => `${costOptimizerRoot()}/savings`;
export const costOptimizerRecent = () => `${costOptimizerRoot()}/recent`;
export const costOptimizerModels = () => `${costOptimizerRoot()}/models`;
export const costOptimizerProviders = () => `${costOptimizerRoot()}/providers`;

/* Prompt Optimizer */
const promptOptimizerRoot = () => `${BASE_URL}/api/prompt-optimizer`;
export const promptOptimizerOptimize = () => `${promptOptimizerRoot()}/optimize`;
export const promptOptimizerBatch = () => `${promptOptimizerRoot()}/batch`;
export const promptOptimizerModes = () => `${promptOptimizerRoot()}/modes`;

/* Agent Marketplace */
const agentMarketplaceRoot = () => `${BASE_URL}/api/agent-marketplace`;
export const agentMarketplaceList = () => `${agentMarketplaceRoot()}/`;
export const agentMarketplaceById = (id: string) => `${agentMarketplaceRoot()}/${id}`;
export const agentMarketplaceCreate = () => `${agentMarketplaceRoot()}/`;
export const agentMarketplaceUpdate = (id: string) => `${agentMarketplaceRoot()}/${id}`;
export const agentMarketplaceDelete = (id: string) => `${agentMarketplaceRoot()}/${id}`;
export const agentMarketplaceInstall = (id: string) => `${agentMarketplaceRoot()}/${id}/install`;
export const agentMarketplaceUninstall = (id: string) => `${agentMarketplaceRoot()}/${id}/uninstall`;
export const agentMarketplaceInstalled = () => `${agentMarketplaceRoot()}/installed`;
export const agentMarketplaceReviews = (id: string) => `${agentMarketplaceRoot()}/${id}/reviews`;
export const agentMarketplaceCreateReview = (id: string) => `${agentMarketplaceRoot()}/${id}/reviews`;
export const agentMarketplaceFollow = (userId: string) => `${agentMarketplaceRoot()}/follow/${userId}`;
export const agentMarketplaceUnfollow = (userId: string) => `${agentMarketplaceRoot()}/follow/${userId}`;
export const agentMarketplaceFollowers = (userId: string) => `${agentMarketplaceRoot()}/${userId}/followers`;
export const agentMarketplaceFollowing = () => `${agentMarketplaceRoot()}/user/following`;
export const agentMarketplaceRevenue = () => `${agentMarketplaceRoot()}/user/revenue`;
export const agentMarketplaceCreatorProfile = (userId: string) => `${agentMarketplaceRoot()}/creator/${userId}`;

/* ── Provider Management (AI Infrastructure) ─────────────────────────── */
const adminAiProvidersRoot = () => `${BASE_URL}/api/admin/providers/manage`;

export const adminAiProviderOverview = () => `${adminAiProvidersRoot()}/overview`;

export const adminAiProviders = () => `${adminAiProvidersRoot()}/providers`;
export const adminAiProviderById = (id: string) => `${adminAiProvidersRoot()}/providers/${id}`;

export const adminAiProviderKeys = (providerId: string) => `${adminAiProvidersRoot()}/providers/${providerId}/keys`;
export const adminAiProviderKeyTest = (keyId: string) => `${adminAiProvidersRoot()}/keys/${keyId}/test`;
export const adminAiProviderKeyById = (keyId: string) => `${adminAiProvidersRoot()}/keys/${keyId}`;

export const adminAiProviderModels = (providerId: string) => `${adminAiProvidersRoot()}/providers/${providerId}/models`;
export const adminAiProviderModelById = (modelId: string) => `${adminAiProvidersRoot()}/models/${modelId}`;

export const adminAiRoutingRules = () => `${adminAiProvidersRoot()}/rules`;
export const adminAiRoutingRuleById = (id: string) => `${adminAiProvidersRoot()}/rules/${id}`;

export const adminAiProviderUsage = () => `${adminAiProvidersRoot()}/usage`;
export const adminAiProviderCosts = () => `${adminAiProvidersRoot()}/costs`;
export const adminAiProviderHealthHistory = (providerId: string) => `${adminAiProvidersRoot()}/providers/${providerId}/health`;

export const adminAiSystemDefaults = () => `${adminAiProvidersRoot()}/defaults`;
