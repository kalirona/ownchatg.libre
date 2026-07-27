import type { InfiniteData } from '@tanstack/react-query';
import type {
  TConversationTag,
  EModelEndpoint,
  TConversation,
  TSharedLink,
  TAttachment,
  TMessage,
  TBanner,
  ReasoningResponseKey,
  ReasoningParameterFormat,
} from './schemas';
import type { RefillIntervalUnit } from './balance';
import type { SettingDefinition } from './generate';
import type { TMinimalFeedback } from './feedback';
import type { ContentTypes } from './types/runs';
import type { Agent } from './types/assistants';

export * from './schemas';

export type TMessages = TMessage[];

/* TODO: Cleanup EndpointOption types */
export type TEndpointOption = Pick<
  TConversation,
  // Core conversation fields
  | 'endpoint'
  | 'endpointType'
  | 'model'
  | 'modelLabel'
  | 'chatGptLabel'
  | 'promptPrefix'
  | 'temperature'
  | 'topP'
  | 'topK'
  | 'top_p'
  | 'frequency_penalty'
  | 'presence_penalty'
  | 'maxOutputTokens'
  | 'maxContextTokens'
  | 'max_tokens'
  | 'maxTokens'
  | 'resendFiles'
  | 'imageDetail'
  | 'reasoning_effort'
  | 'verbosity'
  | 'instructions'
  | 'additional_instructions'
  | 'append_current_datetime'
  | 'tools'
  | 'stop'
  | 'region'
  | 'additionalModelRequestFields'
  // Anthropic-specific
  | 'promptCache'
  | 'promptCacheTtl'
  | 'thinking'
  | 'thinkingBudget'
  | 'thinkingLevel'
  | 'effort'
  | 'thinkingDisplay'
  // Assistant/Agent fields
  | 'assistant_id'
  | 'agent_id'
  // UI/Display fields
  | 'iconURL'
  | 'greeting'
  | 'spec'
  // Artifacts
  | 'artifacts'
  // Files
  | 'file_ids'
  // System field
  | 'system'
  | 'chatProjectId'
  // Google examples
  | 'examples'
  // Context
  | 'context'
> & {
  // Fields specific to endpoint options that don't exist on TConversation
  modelDisplayLabel?: string;
  key?: string | null;
  /** @deprecated Assistants API */
  thread_id?: string;
  // Conversation identifiers for multi-response streams
  overrideConvoId?: string;
  overrideUserMessageId?: string;
  // Model parameters (used by different endpoints)
  modelOptions?: Record<string, unknown>;
  model_parameters?: Record<string, unknown>;
  // Configuration data (added by middleware)
  modelsConfig?: TModelsConfig;
  // File attachments (processed by middleware)
  attachments?: TAttachment[];
  // Generated prompts
  artifactsPrompt?: string;
  // Agent-specific fields
  agent?: Promise<Agent>;
  // Client-specific options
  clientOptions?: Record<string, unknown>;
};

export type TEphemeralAgent = {
  mcp?: string[];
  web_search?: boolean;
  file_search?: boolean;
  execute_code?: boolean;
  artifacts?: string;
  skills?: boolean;
  memory?: boolean;
  /** Equip the ephemeral agent with the `ask_user_question` HITL tool. */
  ask_user_question?: boolean;
};

export type TPayload = Partial<TMessage> &
  Partial<TEndpointOption> & {
    isContinued: boolean;
    isRegenerate?: boolean;
    conversationId: string | null;
    messages?: TMessages;
    isTemporary: boolean;
    ephemeralAgent?: TEphemeralAgent | null;
    editedContent?: TEditedContent | null;
    /** Added conversation for multi-convo feature */
    addedConvo?: TConversation;
    /**
     * Skills the user selected via the `$` popover for this turn. Names, not IDs
     * — the backend resolves them against the user's ACL-accessible skill set,
     * loads each SKILL.md body, and prepends one meta user message per skill
     * before the LLM turn runs.
     */
    manualSkills?: string[];
    /** Browser IANA timezone (e.g. `America/New_York`) used to resolve local-time prompt variables server-side. */
    timezone?: string;
  };

export type TEditedContent =
  | {
      index: number;
      type: ContentTypes.THINK;
      [ContentTypes.THINK]: string;
    }
  | {
      index: number;
      type: ContentTypes.TEXT;
      [ContentTypes.TEXT]: string;
    };

export type TSubmission = {
  userMessage: TMessage;
  isEdited?: boolean;
  isContinued?: boolean;
  isTemporary: boolean;
  messages: TMessage[];
  /** Client-only full message context used to restore branch siblings after scoped regenerate. */
  regenerateMessages?: TMessage[];
  isRegenerate?: boolean;
  initialResponse?: TMessage;
  conversation: Partial<TConversation>;
  endpointOption: TEndpointOption;
  clientTimestamp?: string;
  ephemeralAgent?: TEphemeralAgent | null;
  editedContent?: TEditedContent | null;
  /** Added conversation for multi-convo feature */
  addedConvo?: TConversation;
  /** Skills the user invoked via the `$` popover for this submission. */
  manualSkills?: string[];
};

export type EventSubmission = Omit<TSubmission, 'initialResponse'> & { initialResponse: TMessage };

export type TPluginAction = {
  pluginKey: string;
  action: 'install' | 'uninstall';
  auth?: Partial<Record<string, string>> | null;
  isEntityTool?: boolean;
};

export type GroupedConversations = [key: string, TConversation[]][];

export type TUpdateUserPlugins = {
  isEntityTool?: boolean;
  pluginKey: string;
  action: string;
  auth?: Partial<Record<string, string | null>> | null;
};

// TODO `label` needs to be changed to the proper `TranslationKeys`
export type TCategory = {
  id?: string;
  value: string;
  label: string;
  description?: string;
  custom?: boolean;
};

export type TMarketplaceCategory = TCategory & {
  count: number;
};

export type TError = {
  message: string;
  code?: number | string;
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
};

export type TBackupCode = {
  codeHash: string;
  used: boolean;
  usedAt: Date | null;
};

export type TUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
  provider: string;
  tenantId?: string;
  plugins?: string[];
  twoFactorEnabled?: boolean;
  backupCodes?: TBackupCode[];
  personalization?: {
    memories?: boolean;
  };
  timezone?: string;
  theme?: string;
  language?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type TUpdateUserProfile = {
  name?: string;
  timezone?: string;
  theme?: string;
  language?: string;
  preferences?: Record<string, unknown>;
};

export type TGetConversationsResponse = {
  conversations: TConversation[];
  pageNumber: string;
  pageSize: string | number;
  pages: string | number;
};

export type TUpdateMessageRequest = {
  conversationId: string;
  messageId: string;
  model: string;
  text: string;
};

export type TUpdateMessageContent = {
  conversationId: string;
  messageId: string;
  index: number;
  text: string;
};

export type TUpdateUserKeyRequest = {
  name: string;
  value: string;
  expiresAt: string;
};

export type TAgentApiKeyCreateRequest = {
  name: string;
  expiresAt?: string | null;
};

export type TAgentApiKeyCreateResponse = {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  createdAt: string;
  expiresAt?: string;
};

export type TAgentApiKeyListItem = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
};

export type TAgentApiKeyListResponse = {
  keys: TAgentApiKeyListItem[];
};

export type TUpdateConversationRequest = {
  conversationId: string;
  title: string;
};

export type TUpdateConversationResponse = TConversation;

export type TChatProject = {
  _id: string;
  name: string;
  description?: string;
  user?: string;
  conversationCount: number;
  lastConversationAt?: string | null;
  lastConversationId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TCreateChatProjectRequest = {
  name: string;
  description?: string;
};

export type TUpdateChatProjectRequest = Partial<TCreateChatProjectRequest> & {
  projectId: string;
};

export type TDeleteChatProjectResponse = {
  deletedCount: number;
  modifiedCount: number;
};

export type TAssignConversationToProjectRequest = {
  conversationId: string;
  projectId: string | null;
};

export type TAssignConversationToProjectResponse = {
  conversation: TConversation;
  previousProjectId: string | null;
  projectId: string | null;
};

export type TDeleteConversationRequest = {
  conversationId?: string;
  thread_id?: string;
  endpoint?: string;
  source?: string;
};

export type TDeleteConversationResponse = {
  acknowledged: boolean;
  deletedCount: number;
  messages: {
    acknowledged: boolean;
    deletedCount: number;
  };
};

export type TArchiveConversationRequest = {
  conversationId: string;
  isArchived: boolean;
};

export type TArchiveConversationResponse = TConversation;

export type TPinConversationRequest = {
  conversationId: string;
  pinned: boolean;
};

export type TPinConversationResponse = TConversation;

export type TSharedMessagesResponse = Omit<TSharedLink, 'messages'> & {
  messages: TMessage[];
};

export type TCreateShareLinkRequest = Pick<TConversation, 'conversationId'>;

export type TUpdateShareLinkRequest = Pick<TSharedLink, 'shareId' | 'targetMessageId'>;

export type TSharedLinkResponse = Pick<TSharedLink, 'shareId'> &
  Pick<TSharedLink, 'targetMessageId'> &
  Pick<TConversation, 'conversationId'> & {
    _id?: string;
  };

export type TSharedLinkGetResponse = Omit<TSharedLinkResponse, 'shareId'> & {
  shareId: string | null;
  success: boolean;
  /** Per-link "share files" choice; absent on legacy links (treated as enabled). */
  snapshotFiles?: boolean;
};

// type for getting conversation tags
export type TConversationTagsResponse = TConversationTag[];
// type for creating conversation tag
export type TConversationTagRequest = Partial<
  Omit<TConversationTag, 'createdAt' | 'updatedAt' | 'count' | 'user'>
> & {
  conversationId?: string;
  addToConversation?: boolean;
};

export type TConversationTagResponse = TConversationTag;

export type TTagConversationRequest = {
  tags: string[];
  tag: string;
};

export type TTagConversationResponse = string[];

export type TDuplicateConvoRequest = {
  conversationId?: string;
};

export type TDuplicateConvoResponse = {
  conversation: TConversation;
  messages: TMessage[];
};

export type TForkConvoRequest = {
  messageId: string;
  conversationId: string;
  option?: string;
  splitAtTarget?: boolean;
  latestMessageId?: string;
};

export type TForkConvoResponse = {
  conversation: TConversation;
  messages: TMessage[];
};

export type TForkSharedConvoRequest = {
  shareId: string;
  /** Index of the viewer's active message within the shared payload; reduces the
   *  fork to that branch. An index is used because shared ids are re-anonymized
   *  per request and `createdAt` can collide, while the payload order is stable. */
  targetMessageIndex?: number;
};

export type TSearchResults = {
  conversations: TConversation[];
  messages: TMessage[];
  pageNumber: string;
  pageSize: string | number;
  pages: string | number;
  filter: object;
};

export type TConfig = {
  order: number;
  type?: EModelEndpoint;
  azure?: boolean;
  availableTools?: [];
  availableRegions?: string[];
  allowedProviders?: (string | EModelEndpoint)[];
  plugins?: Record<string, string>;
  name?: string;
  iconURL?: string;
  version?: string;
  modelDisplayLabel?: string;
  userProvide?: boolean | null;
  userProvideURL?: boolean | null;
  userProvideAccessKeyId?: boolean;
  userProvideSecretAccessKey?: boolean;
  userProvideSessionToken?: boolean;
  userProvideBearerToken?: boolean;
  disableBuilder?: boolean;
  retrievalModels?: string[];
  capabilities?: string[];
  customParams?: {
    defaultParamsEndpoint?: string;
    reasoningFormat?: ReasoningParameterFormat;
    reasoningKey?: ReasoningResponseKey;
    includeReasoningContent?: boolean;
    includeReasoningHistory?: boolean;
    paramDefinitions?: Partial<SettingDefinition>[];
  };
};

export type TEndpointsConfig =
  | Record<EModelEndpoint | string, TConfig | null | undefined>
  | undefined;

export type TModelsConfig = Record<string, string[]>;

/** Server-resolved context window and pricing for one model. Rates are USD per 1M tokens. */
export type TModelTokenomics = {
  context?: number;
  prompt?: number;
  completion?: number;
  cacheWrite?: number;
  cacheRead?: number;
};

/** endpoint → model → resolved tokenomics, from GET /api/endpoints/token-config */
export type TTokenConfigMap = Record<string, Record<string, TModelTokenomics>>;

export type TUpdateTokenCountResponse = {
  count: number;
};

export type TMessageTreeNode = object;

export type TSearchMessage = object;

export type TSearchMessageTreeNode = object;

export type TRegisterUserResponse = {
  message: string;
};

export type TRegisterUser = {
  name: string;
  email: string;
  username: string;
  password: string;
  confirm_password?: string;
  token?: string;
};

export type TLoginUser = {
  email: string;
  password: string;
  token?: string;
  backupCode?: string;
};

export type TLoginResponse = {
  token?: string;
  user?: TUser;
  twoFAPending?: boolean;
  tempToken?: string;
};

/** Shared payload for any operation that requires OTP or backup-code verification. */
export type TOTPVerificationPayload = {
  token?: string;
  backupCode?: string;
};

export type TEnable2FARequest = TOTPVerificationPayload;

export type TEnable2FAResponse = {
  otpauthUrl: string;
  backupCodes: string[];
  message?: string;
};

export type TVerify2FARequest = TOTPVerificationPayload;

export type TVerify2FAResponse = {
  message: string;
};

/** For verifying 2FA during login with a temporary token. */
export type TVerify2FATempRequest = TOTPVerificationPayload & {
  tempToken: string;
};

export type TVerify2FATempResponse = {
  token?: string;
  user?: TUser;
  message?: string;
};

export type TDisable2FARequest = TOTPVerificationPayload;

export type TDisable2FAResponse = {
  message: string;
};

export type TRegenerateBackupCodesRequest = TOTPVerificationPayload;

export type TRegenerateBackupCodesResponse = {
  message?: string;
  backupCodes: string[];
  backupCodesHash: TBackupCode[];
};

export type TDeleteUserRequest = TOTPVerificationPayload;

export type TRequestPasswordReset = {
  email: string;
};

export type TResetPassword = {
  userId: string;
  token: string;
  password: string;
  confirm_password?: string;
};

export type VerifyEmailResponse = { message: string };

export type TVerifyEmail = {
  email: string;
  token: string;
};

export type TResendVerificationEmail = Omit<TVerifyEmail, 'token'>;

export type TRefreshTokenResponse = {
  token: string;
  user: TUser;
};

export type TCheckUserKeyResponse = {
  expiresAt: string;
};

export type TRequestPasswordResetResponse = {
  link?: string;
  message?: string;
};

/**
 * Represents the response from the import endpoint.
 */
export type TImportResponse = {
  /**
   * The message associated with the response.
   */
  message: string;
};

/** Prompts */

export type TPrompt = {
  groupId: string;
  author: string;
  prompt: string;
  type: 'text' | 'chat';
  createdAt: string;
  updatedAt: string;
  _id?: string;
};

export type TPromptGroup = {
  name: string;
  numberOfGenerations?: number;
  command?: string;
  oneliner?: string;
  category?: string;
  productionId?: string | null;
  productionPrompt?: Pick<TPrompt, 'prompt'> | null;
  author: string;
  authorName: string;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: string;
};

export type TCreatePrompt = {
  prompt: Pick<TPrompt, 'prompt' | 'type'> & { groupId?: string };
  group?: { name: string; category?: string; oneliner?: string; command?: string };
};

export type TCreatePromptRecord = TCreatePrompt & Pick<TPromptGroup, 'author' | 'authorName'>;

export type TPromptsWithFilterRequest = {
  groupId: string;
  tags?: string[];
  projectId?: string;
  version?: number;
};

export type TPromptGroupsWithFilterRequest = {
  category: string;
  pageNumber?: string; // Made optional for cursor-based pagination
  pageSize?: string | number;
  limit?: string | number; // For cursor-based pagination
  cursor?: string; // For cursor-based pagination
  before?: string | null;
  after?: string | null;
  order?: 'asc' | 'desc';
  name?: string;
  author?: string;
};

export type PromptGroupListResponse = {
  promptGroups: TPromptGroup[];
  pageNumber: string;
  pageSize: string | number;
  pages: string | number;
  has_more: boolean; // Added for cursor-based pagination
  after: string | null; // Added for cursor-based pagination
};

export type PromptGroupListData = InfiniteData<PromptGroupListResponse>;

export type TCreatePromptResponse = {
  prompt: TPrompt;
  group?: TPromptGroup;
};

export type TUpdatePromptGroupPayload = Partial<TPromptGroup>;

export type TUpdatePromptGroupVariables = {
  id: string;
  payload: TUpdatePromptGroupPayload;
};

export type TUpdatePromptGroupResponse = TPromptGroup;

export type TDeletePromptResponse = {
  prompt: string;
  promptGroup?: { message: string; id: string };
};

export type TDeletePromptVariables = {
  _id: string;
  groupId: string;
};

export type TMakePromptProductionResponse = {
  message: string;
};

export type TMakePromptProductionRequest = {
  id: string;
  groupId: string;
  productionPrompt: Pick<TPrompt, 'prompt'>;
};

export type TUpdatePromptLabelsRequest = {
  id: string;
  payload: {
    labels: string[];
  };
};

export type TUpdatePromptLabelsResponse = {
  message: string;
};

export type TDeletePromptGroupResponse = TUpdatePromptLabelsResponse;

export type TDeletePromptGroupRequest = {
  id: string;
};

export type TGetCategoriesResponse = TCategory[];

export type TGetRandomPromptsResponse = {
  prompts: TPromptGroup[];
};

export type TGetRandomPromptsRequest = {
  limit: number;
  skip: number;
};

export type TCustomConfigSpeechResponse = { [key: string]: string };

export type TUserTermsResponse = {
  termsAccepted: boolean;
  termsAcceptedAt: Date | string | null;
};

export type TAcceptTermsResponse = {
  message: string;
  termsAcceptedAt: Date | string;
};

export type TBannerResponse = TBanner | null;

export type TUpdateFeedbackRequest = {
  feedback?: TMinimalFeedback;
};

export type TUpdateFeedbackResponse = {
  messageId: string;
  conversationId: string;
  feedback?: TMinimalFeedback;
};

export type TBalanceResponse = {
  tokenCredits: number;
  // Automatic refill settings
  autoRefillEnabled: boolean;
  refillIntervalValue?: number;
  refillIntervalUnit?: RefillIntervalUnit;
  lastRefill?: Date | string;
  refillAmount?: number;
};

/* -------------------------------------------------------------------------- */
/* Billing types                                                              */
/* -------------------------------------------------------------------------- */

export type TSubscriptionPlan = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  creditsPerPeriod: number;
  interval: 'month' | 'year';
  lemonSqueezyVariantId?: string;
  payPalPlanId?: string;
  active: boolean;
};

export type TCreditPack = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  credits: number;
  lemonSqueezyVariantId?: string;
  payPalPlanId?: string;
  active: boolean;
};

export type TUserSubscription = {
  _id: string;
  user: string;
  planName: string;
  provider: 'lemon_squeezy' | 'paypal';
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'expired';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  creditsAwardedThisPeriod: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TPaymentTransaction = {
  _id: string;
  user: string;
  type: 'subscription' | 'credit_pack';
  provider: 'lemon_squeezy' | 'paypal';
  providerTransactionId?: string;
  providerSubscriptionId?: string;
  amount: number;
  currency: string;
  creditsAwarded: number;
  status: 'completed' | 'refunded' | 'failed' | 'pending';
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type TCreateCheckoutRequest = {
  planId?: string;
  creditPackId?: string;
  provider: 'lemon_squeezy' | 'paypal';
  successPath?: string;
};

export type TCreateCheckoutResponse = {
  url: string;
};

export type TCreatePortalResponse = {
  url: string;
};

export type TBillingConfigResponse = {
  enabled: boolean;
  lemonSqueezyEnabled?: boolean;
  paypalEnabled?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Skill UI extensions (not yet persisted — phase 2 backend will fill these)  */
/* -------------------------------------------------------------------------- */

/**
 * @deprecated Superseded by the persisted `userInvocable` /
 * `disableModelInvocation` pair derived from frontmatter. Retained for the
 * transition window so older UI forms and tests still type-check; the
 * backend no longer reads or writes it.
 */
export enum InvocationMode {
  auto = 'auto',
  manual = 'manual',
  both = 'both',
}

/**
 * Node in the filesystem-style skill tree view. Phase 1 derives these from
 * the flat `TSkillFile[]` list; phase 2 will have the backend serve them
 * directly from a persisted folder hierarchy. Kept in the shared types so
 * tree UI helpers can be imported from both client and server.
 */
export type TSkillNode = {
  _id: string;
  skillId: string;
  parentId: string | null;
  type: 'file' | 'folder';
  name: string;
  fileId?: string;
  order: number;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type TSkillTreeResponse = {
  nodes: TSkillNode[];
};

export type TCreateSkillNodeRequest = {
  type: 'file' | 'folder';
  name: string;
  parentId?: string | null;
  order?: number;
};

export type TUpdateSkillNodeRequest = {
  name?: string;
  parentId?: string | null;
  order?: number;
};

/* Image Generation */
export type TImageGenProvider = {
  key: string;
  name: string;
  icon: string;
  models: TImageGenModel[];
  aspectRatios: string[];
};

export type TImageGenModel = {
  id: string;
  name: string;
};

export type TImageGenRequest = {
  provider: string;
  model?: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  seed?: number | null;
  numImages?: number;
};

export type TImageGenImage = {
  filepath: string;
  fileId: string;
  width?: number;
  height?: number;
};

export type TImageGenResponse = {
  images: TImageGenImage[];
  historyId: string;
};

export type TImageGenHistoryEntry = {
  _id: string;
  provider: string;
  model: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  seed: number | null;
  numImages: number;
  images: TImageGenImage[];
  favorite: boolean;
  creditsCost: number;
  createdAt: string;
  updatedAt: string;
};

export type TImageGenHistoryResponse = {
  records: TImageGenHistoryEntry[];
  total: number;
  page: number;
  limit: number;
};

/* Video Generation */
export type TVideoGenProvider = {
  key: string;
  name: string;
  icon: string;
  models: TVideoGenModel[];
};

export type TVideoGenModel = {
  id: string;
  name: string;
};

export type TVideoGenRequest = {
  provider: string;
  model?: string;
  prompt: string;
  duration?: number;
  aspectRatio?: string;
  quality?: string;
};

export type TVideoGenVideo = {
  filepath: string;
  fileId: string;
  width?: number;
  height?: number;
  duration?: number;
};

export type TVideoGenResponse = {
  videos: TVideoGenVideo[];
  historyId: string;
  status: string;
};

export type TVideoGenHistoryEntry = {
  _id: string;
  provider: string;
  model: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  quality: string;
  status: string;
  videos: TVideoGenVideo[];
  error: string | null;
  favorite: boolean;
  creditsCost: number;
  createdAt: string;
  updatedAt: string;
};

export type TVideoGenHistoryResponse = {
  records: TVideoGenHistoryEntry[];
  total: number;
  page: number;
  limit: number;
};

export type TVideoGenStatusResponse = {
  status: string;
  videos: TVideoGenVideo[];
  error: string | null;
};

export type TVideoGenDurationLimits = {
  min: number;
  max: number;
};

/* Knowledge / RAG Workspace */
export type TKnowledgeCollection = {
  _id: string;
  user: string;
  name: string;
  description: string;
  parentId: string | null;
  icon: string;
  fileIds: TKnowledgeDocument[];
  createdAt: string;
  updatedAt: string;
};

export type TKnowledgeDocument = {
  _id: string;
  file_id: string;
  filename: string;
  type: string;
  bytes: number;
  embedded: boolean;
  createdAt: string;
  updatedAt: string;
  filepath: string;
  source: string;
};

export type TKnowledgeDocumentListResponse = {
  files: TKnowledgeDocument[];
  total: number;
};

export type TKnowledgeCollectionListResponse = {
  collections: TKnowledgeCollection[];
};

export type TKnowledgeSearchRequest = {
  fileIds: string[];
  query: string;
  k?: number;
};

export type TKnowledgeSearchResult = {
  fileId: string;
  data: Array<{ text?: string; content?: string; score?: number }>;
};

export type TKnowledgeSearchResponse = {
  results: TKnowledgeSearchResult[];
};

export type TKnowledgeChatRequest = {
  message: string;
  fileIds: string[];
};

export type TKnowledgeChatResponse = {
  answer: string;
  sources: string[];
};

export type TKnowledgeCreateCollectionRequest = {
  name: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
};

export type TKnowledgeUpdateCollectionRequest = {
  name?: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
};

/* Prompt Marketplace */
export type TMarketplacePrompt = {
  _id: string;
  name: string;
  numberOfGenerations: number;
  oneliner: string;
  category: string;
  productionId?: string;
  productionPrompt?: { prompt: string } | null;
  author: string;
  authorName: string;
  command?: string;
  createdAt: string;
  updatedAt: string;
  isFavorited: boolean;
};

export type TMarketplaceListResponse = {
  prompts: TMarketplacePrompt[];
  total: number;
  page: number;
  pages: number;
};

export type TMarketplaceFeaturedResponse = {
  prompts: TMarketplacePrompt[];
};

export type TMarketplaceCategoryItem = {
  name: string;
  count: number;
};

export type TMarketplaceCategoriesResponse = {
  categories: TMarketplaceCategoryItem[];
};

export type TMarketplaceToggleFavoriteResponse = {
  favorited: boolean;
};

/* Admin / Super Admin */
export type TAdminDashboardStats = {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalCreditsAwarded: number;
  totalBalanceOutstanding: number;
  balanceAccountCount: number;
  recentTransactions: TAdminPaymentTransaction[];
};

export type TAdminUserDetail = {
  user: TUser;
  balance: TBalanceResponse | null;
  subscriptions: TAdminSubscription[];
  recentTransactions: TAdminPaymentTransaction[];
};

export type TAdminSubscription = {
  _id: string;
  user: string;
  planName: string;
  provider: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  createdAt: string;
};

export type TAdminPaymentTransaction = {
  _id: string;
  user: string;
  type: string;
  provider: string;
  amount: number;
  currency: string;
  creditsAwarded: number;
  status: string;
  createdAt: string;
};

export type TAdminRevenueResponse = {
  transactions: TAdminPaymentTransaction[];
  stats: {
    totalRevenue: number;
    totalCreditsAwarded: number;
    completedCount: number;
  };
  pagination: TPagination;
};

export type TAdminSubscriptionsResponse = {
  subscriptions: TAdminSubscription[];
  stats: {
    total: number;
    active: number;
    canceled: number;
  };
  pagination: TPagination;
};

export type TAdminProvider = {
  name: string;
  enabled: boolean;
  available: boolean;
  config: Record<string, unknown>;
};

export type TAdminProvidersResponse = {
  providers: TAdminProvider[];
};

export type TAdminAnnouncement = {
  _id: string;
  bannerId: string;
  message: string;
  type: string;
  displayFrom: string;
  displayTo: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TAdminAnnouncementsResponse = {
  announcements: TAdminAnnouncement[];
};

export type TAdminAnnouncementRequest = {
  bannerId: string;
  message: string;
  type?: string;
  displayFrom?: string;
  displayTo?: string | null;
  isPublic?: boolean;
};

export type TAdminSystemHealth = {
  status: string;
  checks: Record<string, { status: string; state?: string }>;
  timestamp: string;
};

export type TAdminFeatureFlags = {
  features: Record<string, boolean>;
};

export type TAdminCreditsAdjustRequest = {
  userId: string;
  amount: number;
  reason?: string;
};

export type TAdminUpdateRoleRequest = {
  role: string;
};

export type TPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/* Analytics & Business Intelligence */
export type TAnalyticsDataPoint = {
  date: string;
  value: number;
};

export type TAnalyticsUserGrowth = {
  daily: TAnalyticsDataPoint[];
  totalUsers: number;
  newUsers: number;
};

export type TAnalyticsModelUsageItem = {
  model: string;
  endpoint: string;
  count: number;
  percentage: number;
  totalTokens: number;
};

export type TAnalyticsResponse = {
  userGrowth: TAnalyticsUserGrowth;
  creditUsage: {
    daily: TAnalyticsDataPoint[];
    creditTotal: {
      promptTokens: number;
      completionTokens: number;
      totalCost: number;
    };
  };
  revenue: {
    daily: TAnalyticsDataPoint[];
    revenueTotal: {
      amount: number;
      creditsAwarded: number;
      count: number;
    };
  };
  modelUsage: TAnalyticsModelUsageItem[];
  userActivity: {
    daily: TAnalyticsDataPoint[];
    activityTotal: {
      activeUsers: number;
      totalMessages: number;
    };
  };
  retention: {
    daily: TAnalyticsDataPoint[];
    retentionCurrent: {
      activeSubscriptions: number;
      churnRate: number;
    };
  };
  imageStats: {
    totalGenerated: number;
    byProvider: { provider: string; count: number }[];
    daily: TAnalyticsDataPoint[];
  };
  videoStats: {
    totalGenerated: number;
    byProvider: { provider: string; count: number }[];
    daily: TAnalyticsDataPoint[];
  };
};

export type TAnalyticsParams = {
  period?: '7d' | '30d' | '90d' | '1y';
};

/* Notifications */
export type TNotificationType =
  | 'system_announcement'
  | 'billing_alert'
  | 'low_credit'
  | 'subscription_expiring'
  | 'mention'
  | 'welcome'
  | 'integration'
  | 'team_invite'
  | 'workflow_finished'
  | 'image_finished'
  | 'video_finished';

export type TNotification = {
  _id: string;
  user: string;
  type: TNotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TNotificationListResponse = {
  notifications: TNotification[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type TUnreadCountResponse = {
  count: number;
};

export type TNotificationQueryParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: TNotificationType;
};

export type TNotificationChannelPrefs = {
  email: boolean;
  inApp: boolean;
  push: boolean;
  slack: boolean;
  discord: boolean;
};

export type TNotificationPreference = {
  _id: string;
  user: string;
  digest: 'none' | 'daily' | 'weekly';
  digestTime: string;
  lastDigestSentAt?: string;
  channels: TNotificationChannelPrefs;
  types: Record<string, TNotificationChannelPrefs>;
  createdAt: string;
  updatedAt: string;
};

export type TNotificationDigestResponse = {
  sent: boolean;
  count?: number;
  reason?: string;
};

/* Integrations */
export type TIntegrationProvider =
  | 'google_drive' | 'dropbox' | 'onedrive' | 'notion'
  | 'slack' | 'discord' | 'zapier' | 'n8n' | 'wordpress' | 'github';

export type TIntegration = {
  _id: string;
  user: string;
  provider: TIntegrationProvider;
  displayName?: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  providerUserId?: string;
  providerEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type TIntegrationListResponse = {
  integrations: TIntegration[];
};

export type TIntegrationOAuthStatus = {
  connected: boolean;
  enabled?: boolean;
  providerUserId?: string;
  providerEmail?: string;
  displayName?: string;
  tokenExpired?: boolean;
  expiresAt?: string;
};

/* Organizations */
export type TOrgRole = 'owner' | 'admin' | 'billing_admin' | 'editor' | 'viewer' | 'member';
export type TTeamRole = 'lead' | 'editor' | 'viewer' | 'member';

export type TOrganization = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  owner: string;
  planTier: 'free' | 'business' | 'enterprise';
  settings: {
    allowMemberInvites: boolean;
    requireAdminApproval: boolean;
    maxTeams: number;
    maxMembers: number;
  };
  logo?: string;
  role?: TOrgRole;
  createdAt: string;
};

export type TOrgMember = {
  _id: string;
  user: { _id: string; name: string; email: string; avatar?: string };
  role: TOrgRole;
  joinedAt: string;
};

export type TOrgInvite = {
  _id: string;
  organization: string;
  email: string;
  role: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
};

export type TTeam = {
  _id: string;
  name: string;
  description: string;
  organization: string;
  createdBy: string;
  createdAt: string;
};

export type TTeamMember = {
  _id: string;
  team: string;
  user: { _id: string; name: string; email: string; avatar?: string };
  role: TTeamRole;
  createdAt: string;
};

/* Invites */
export type TInviteInfo = {
  _id: string;
  organization: { _id: string; name: string; slug: string };
  email: string;
  role: string;
  expiresAt: string;
};

/* Shared Folders */
export type TSharedFolder = {
  _id: string;
  name: string;
  organization: string;
  team?: string;
  parent?: string;
  createdBy: string;
  scope: 'org' | 'team';
  itemCount: number;
  createdAt: string;
};

/* Team Prompts */
export type TTeamPrompt = {
  _id: string;
  promptGroup: { _id: string; name: string; oneliner?: string; category?: string; command?: string };
  sharedBy: { _id: string; name: string };
  scope: 'org' | 'team';
  createdAt: string;
};

/* Team Agents */
export type TTeamAgent = {
  _id: string;
  agent: { _id: string; name: string; description?: string; model?: string; provider?: string };
  sharedBy: { _id: string; name: string };
  scope: 'org' | 'team';
  createdAt: string;
};

/* Org Billing */
export type TOrgSubscription = {
  _id: string;
  organization: string;
  planName: string;
  planTier: string;
  provider: string;
  status: string;
  seats: number;
  maxSeats: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
};

export type TOrgBalance = {
  _id: string;
  organization: string;
  tokenCredits: number;
  bonusCredits: number;
};

export type TOrgTransaction = {
  _id: string;
  organization: string;
  user: { _id: string; name: string; email: string };
  type: string;
  amount: number;
  credits: number;
  description: string;
  createdAt: string;
};

export type TOrgCreditSummary = {
  balance: TOrgBalance;
  subscription: TOrgSubscription | null;
  recentUsage: TOrgTransaction[];
};

/* White Label / Branding */
export type TWhiteLabel = {
  logo?: string;
  logoDark?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  loginPage?: {
    backgroundImage?: string;
    backgroundColor?: string;
    title?: string;
    subtitle?: string;
    customCss?: string;
  };
  dashboard?: {
    appName?: string;
    appTitle?: string;
    logoHeight?: number;
    customCss?: string;
  };
};

export type TWhiteLabelConfig = TWhiteLabel & {
  _id: string;
  organization?: string;
  tenantId?: string;
  customDomain?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  emailTemplate?: {
    headerColor?: string;
    footerText?: string;
    logoUrl?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TBrandingUploadResponse = {
  url: string;
  branding: TWhiteLabelConfig;
};

export type TDomainVerificationResult = {
  verified: boolean;
  token: string;
  expected?: string;
  found?: string;
  error?: string;
};

export type TSSLStatusResult = {
  valid: boolean;
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  expiresInDays?: number;
  error?: string;
};

export type TAppStatus = {
  app: string;
  version: string;
  status: string;
  uptime?: number;
  timestamp?: string;
  links?: Record<string, string>;
};

export type TApiDocs = {
  app: string;
  version: string;
  description: string;
  endpoints: Record<string, string>;
  authentication: string;
};

/* Workflows */
export type TWorkflowStepType =
  | 'trigger' | 'ai_prompt' | 'image_generation' | 'video_generation'
  | 'approval' | 'publish' | 'condition' | 'delay' | 'webhook';

export type TWorkflowStep = {
  _id?: string;
  type: TWorkflowStepType;
  label: string;
  config: Record<string, unknown>;
  order: number;
};

export type TWorkflow = {
  _id: string;
  name: string;
  description: string;
  organization?: string;
  createdBy: string;
  steps: TWorkflowStep[];
  isActive: boolean;
  isTemplate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TWorkflowExecutionStatus =
  | 'running' | 'completed' | 'failed' | 'canceled' | 'waiting_approval';

export type TWorkflowStepResult = {
  stepId: string;
  type: TWorkflowStepType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_approval';
  startedAt?: string;
  completedAt?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
};

export type TWorkflowExecution = {
  _id: string;
  workflow: string;
  triggeredBy: string;
  status: TWorkflowExecutionStatus;
  triggerInput?: Record<string, unknown>;
  finalOutput?: Record<string, unknown>;
  stepResults: TWorkflowStepResult[];
  currentStepIndex: number;
  approvedBy?: string;
  approvedAt?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
};

export type TWorkflowCreateRequest = {
  name: string;
  description?: string;
  steps?: TWorkflowStep[];
  isTemplate?: boolean;
  tags?: string[];
};

/* ── Cost Optimizer ─────────────────────────────────────────── */

export type TOptimizationMode = 'cost' | 'speed' | 'quality' | 'balanced';

export type TModelCostEntry = {
  provider: string;
  providerLabel: string;
  model: string;
  prompt: number;
  completion: number;
  context: number;
  latency: 'fast' | 'medium' | 'slow';
  quality: 'premium' | 'standard' | 'budget' | 'code';
  tier: string;
  inputCost: number;
  outputCost: number;
  totalCostPer1M: number;
};

export type TOptimizationSuggestion = {
  suggestion: TModelCostEntry | null;
  current: TModelCostEntry;
  savings?: {
    per1MInput: number;
    per1MOutput: number;
    per1MTotal: number;
    percent: number;
  };
  estimatedCost?: {
    current: number;
    optimized: number;
    savings: number;
  };
  reason?: string;
};

export type TOptimizationResult = {
  applied: boolean;
  originalModel: string;
  originalProvider: string;
  optimizedModel: string;
  optimizedProvider: string;
  savings?: string;
  savingsPercent?: number;
  reason?: string;
};

export type TOptimizationLog = {
  _id: string;
  userId?: string;
  taskType: string;
  originalModel: string;
  originalProvider: string;
  optimizedModel: string;
  optimizedProvider: string;
  originalCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
  inputTokens: number;
  outputTokens: number;
  mode: TOptimizationMode;
  autoApproved: boolean;
  createdAt: string;
};

export type TSavingsSummary = {
  period: string;
  totals: {
    totalOptimizations: number;
    totalSavings: number;
    avgSavingsPercent: number;
    totalOriginalCost: number;
    totalOptimizedCost: number;
  };
  breakdown: Array<{
    _id: string;
    count: number;
    totalSavings: number;
    avgSavingsPercent: number;
    totalOriginalCost: number;
    totalOptimizedCost: number;
  }>;
};

export type TOptimizationSuggestRequest = {
  currentModel: string;
  currentProvider: string;
  taskType?: string;
  minContext?: number;
  maxCost?: number;
  mode?: TOptimizationMode;
  excludeProviders?: string[];
  preferredProvider?: string;
  inputTokens?: number;
  outputTokens?: number;
};

export type TOptimizationApplyRequest = {
  currentModel: string;
  currentProvider: string;
  taskType?: string;
  mode?: TOptimizationMode;
  inputTokens?: number;
  outputTokens?: number;
};

/* ── Prompt Optimizer ───────────────────────────────────────── */

export type TPromptOptimizerMode = 'rewrite' | 'compress' | 'expand' | 'seo' | 'code' | 'marketing';

export type TPromptOptimizeRequest = {
  prompt: string;
  mode?: TPromptOptimizerMode;
  additionalContext?: string;
};

export type TPromptOptimizeResponse = {
  original: string;
  optimized: string;
  mode: TPromptOptimizerMode;
  model: string;
  stats: {
    originalLength: number;
    optimizedLength: number;
    compressionRatio: number;
  };
};

/* ── Agent Marketplace ──────────────────────────────────────── */

export type TAgentListingConfig = {
  provider: string;
  model: string;
  instructions: string;
  tools: string[];
  skills: string[];
  temperature: number;
  maxTokens: number;
};

export type TAgentListing = {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  tags: string[];
  price: number;
  seller: string;
  sellerName: string;
  agentConfig: TAgentListingConfig;
  version: string;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  ratingAvg: number;
  reviewCount: number;
  installCount: number;
  viewCount: number;
  isFree: boolean;
  previewImage?: string;
  demoUrl?: string;
  requiredKeys: string[];
  compatibleEndpoints: string[];
  createdAt: string;
  updatedAt: string;
  isInstalled?: boolean;
  isOwner?: boolean;
};

export type TAgentListingListResponse = {
  listings: TAgentListing[];
  total: number;
  page: number;
  pages: number;
};

export type TAgentReview = {
  _id: string;
  listing: string;
  user: { _id: string; name: string; username: string; avatar?: string };
  rating: number;
  title: string;
  review: string;
  pros: string;
  cons: string;
  createdAt: string;
};

export type TAgentReviewListResponse = {
  reviews: TAgentReview[];
  total: number;
  page: number;
  pages: number;
};

export type TAgentRevenueEntry = {
  _id: string;
  listing: { _id: string; name: string };
  amount: number;
  platformFee: number;
  sellerPayout: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
};

export type TAgentRevenueResponse = {
  revenue: TAgentRevenueEntry[];
  summary: {
    totalAmount: number;
    totalPayout: number;
    totalFees: number;
    count: number;
  };
};

export type TCreatorProfile = {
  listings: TAgentListing[];
  followerCount: number;
  followingCount: number;
  totalEarned: number;
};
