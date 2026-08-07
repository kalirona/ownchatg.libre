import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MCPIcon, OpenAIMinimalIcon } from '@librechat/client';
import {
  LayoutDashboard,
  MessageSquare,
  FolderOpen,
  Clock,
  Image as ImageIcon,
  Video as VideoIcon,
  PenTool,
  FileText,
  Bot,
  Play,
  ScrollText,
  BookOpen,
  Search,
  MessageCircleQuestion,
  Lightbulb,
  Heart,
  Bookmark,
  Brain,
  Store,
  LayoutTemplate,
  Building2,
  Users,
  BarChart3,
  CreditCard,
  Plug,
  Key,
  Bell,
  Palette,
  SlidersHorizontal,
  Shield,
  Link2,
  Coins,
  Cpu,
  Server,
  BookOpenCheck,
  ListOrdered,
  TrendingUp,
  Settings,
  UserCircle,
  ArrowRightToLine,
  FileText as LogsIcon,
} from 'lucide-react';
import {
  Permissions,
  EModelEndpoint,
  PermissionTypes,
  isParamEndpoint,
  isAgentsEndpoint,
  isAssistantsEndpoint,
} from 'librechat-data-provider';
import type { TInterfaceConfig, TEndpointsConfig } from 'librechat-data-provider';
import type { NavLink, NavSection } from '~/common';
import {
  useAgentCapabilities,
  useMCPServerManager,
  useGetAgentsConfig,
  useGetStartupConfig,
  useHasAccess,
} from '~/data-provider';
import BookmarkPanel from '~/components/SidePanel/Bookmarks/BookmarkPanel';
import PanelSwitch from '~/components/SidePanel/Builder/PanelSwitch';
import Parameters from '~/components/SidePanel/Parameters/Panel';
import { MemoryPanel } from '~/components/SidePanel/Memories';
import { PromptsAccordion } from '~/components/Prompts';
import { SkillsAccordion } from '~/components/Skills';

export default function useSideNavLinks({
  hidePanel,
  keyProvided,
  endpoint,
  endpointType,
  interfaceConfig,
  endpointsConfig,
  includeHidePanel = true,
}: {
  hidePanel?: () => void;
  keyProvided: boolean;
  endpoint?: EModelEndpoint | null;
  endpointType?: EModelEndpoint | null;
  interfaceConfig: Partial<TInterfaceConfig>;
  endpointsConfig: TEndpointsConfig;
  includeHidePanel?: boolean;
}) {
  const hasAccessToPrompts = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });
  const hasAccessToSkills = useHasAccess({
    permissionType: PermissionTypes.SKILLS,
    permission: Permissions.USE,
  });
  const hasAccessToBookmarks = useHasAccess({
    permissionType: PermissionTypes.BOOKMARKS,
    permission: Permissions.USE,
  });
  const hasAccessToMemories = useHasAccess({
    permissionType: PermissionTypes.MEMORIES,
    permission: Permissions.USE,
  });
  const hasAccessToReadMemories = useHasAccess({
    permissionType: PermissionTypes.MEMORIES,
    permission: Permissions.READ,
  });
  const hasAccessToAgents = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.USE,
  });
  const hasAccessToCreateAgents = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.CREATE,
  });
  const hasAccessToUseMCPSettings = useHasAccess({
    permissionType: PermissionTypes.MCP_SERVERS,
    permission: Permissions.USE,
  });
  const hasAccessToCreateMCP = useHasAccess({
    permissionType: PermissionTypes.MCP_SERVERS,
    permission: Permissions.CREATE,
  });
  const { availableMCPServers } = useMCPServerManager();
  const { agentsConfig } = useGetAgentsConfig({ endpointsConfig });
  const { skillsEnabled } = useAgentCapabilities(agentsConfig?.capabilities);
  const { data: startupConfig } = useGetStartupConfig();
  const billingEnabled = startupConfig?.billing?.enabled === true;
  const navigate = useNavigate();

  const Links = useMemo(() => {
    const links: NavLink[] = [];

    // ── 1. Workspace ──────────────────────────────────────────────
    links.push({
      title: 'nav_dashboard',
      icon: LayoutDashboard,
      id: 'dashboard',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/dashboard'),
    });
    links.push({
      title: 'nav_ai_chat',
      icon: MessageSquare,
      id: 'ai-chat',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/c/new'),
    });
    links.push({
      title: 'nav_projects',
      icon: FolderOpen,
      id: 'projects',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/projects'),
    });
    links.push({
      title: 'nav_recent_activity',
      icon: Clock,
      id: 'recent-activity',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/recent-activity'),
    });

    // ── 2. Create ─────────────────────────────────────────────────
    links.push({
      title: 'nav_image_studio',
      icon: ImageIcon,
      id: 'image-studio',
      section: 'create' as NavSection,
      onClick: () => navigate('/images'),
    });
    links.push({
      title: 'nav_video_studio',
      icon: VideoIcon,
      id: 'video-studio',
      section: 'create' as NavSection,
      onClick: () => navigate('/video'),
    });
    links.push({
      title: 'nav_ai_writer',
      icon: PenTool,
      id: 'ai-writer',
      section: 'create' as NavSection,
      onClick: () => navigate('/ai-writer'),
    });
    links.push({
      title: 'nav_documents',
      icon: FileText,
      id: 'documents',
      section: 'create' as NavSection,
      onClick: () => navigate('/documents'),
    });

    // ── 3. AI ─────────────────────────────────────────────────────
    links.push({
      title: 'nav_agents',
      icon: Bot,
      id: 'agents',
      section: 'ai' as NavSection,
      onClick: () => navigate('/agents'),
    });
    if (
      isAssistantsEndpoint(endpoint) &&
      ((endpoint === EModelEndpoint.assistants &&
        endpointsConfig?.[EModelEndpoint.assistants] &&
        endpointsConfig[EModelEndpoint.assistants].disableBuilder !== true) ||
        (endpoint === EModelEndpoint.azureAssistants &&
          endpointsConfig?.[EModelEndpoint.azureAssistants] &&
          endpointsConfig[EModelEndpoint.azureAssistants].disableBuilder !== true)) &&
      keyProvided
    ) {
      links.push({
        title: 'nav_assistants',
        icon: OpenAIMinimalIcon,
        id: EModelEndpoint.assistants,
        section: 'ai' as NavSection,
        Component: PanelSwitch,
      });
    }
    links.push({
      title: 'nav_workflows',
      icon: Play,
      id: 'workflows',
      section: 'ai' as NavSection,
      onClick: () => navigate('/workflows'),
    });
    if (hasAccessToSkills && skillsEnabled) {
      links.push({
        title: 'nav_skills',
        icon: ScrollText,
        id: 'skills',
        section: 'ai' as NavSection,
        Component: SkillsAccordion,
      });
    }

    // ── 4. Knowledge ──────────────────────────────────────────────
    links.push({
      title: 'nav_collections',
      icon: BookOpen,
      id: 'collections',
      section: 'knowledge' as NavSection,
      onClick: () => navigate('/knowledge/collections'),
    });
    links.push({
      title: 'nav_knowledge_documents',
      icon: FileText,
      id: 'knowledge-documents',
      section: 'knowledge' as NavSection,
      onClick: () => navigate('/knowledge/documents'),
    });
    links.push({
      title: 'nav_search',
      icon: Search,
      id: 'search',
      section: 'knowledge' as NavSection,
      onClick: () => navigate('/search'),
    });
    links.push({
      title: 'nav_knowledge_chat',
      icon: MessageCircleQuestion,
      id: 'knowledge-chat',
      section: 'knowledge' as NavSection,
      onClick: () => navigate('/knowledge'),
    });

    // ── 5. Library ────────────────────────────────────────────────
    if (hasAccessToPrompts) {
      links.push({
        title: 'nav_prompts',
        icon: Lightbulb,
        id: 'prompts',
        section: 'library' as NavSection,
        Component: PromptsAccordion,
      });
    }
    links.push({
      title: 'nav_favorites',
      icon: Heart,
      id: 'favorites',
      section: 'library' as NavSection,
      onClick: () => navigate('/favorites'),
    });
    if (hasAccessToBookmarks) {
      links.push({
        title: 'nav_bookmarks',
        icon: Bookmark,
        id: 'bookmarks',
        section: 'library' as NavSection,
        Component: BookmarkPanel,
      });
    }
    if (hasAccessToMemories && hasAccessToReadMemories) {
      links.push({
        title: 'nav_memories',
        icon: Brain,
        id: 'memories',
        section: 'library' as NavSection,
        Component: MemoryPanel,
      });
    }

    // ── 6. Marketplace ────────────────────────────────────────────
    links.push({
      title: 'nav_prompt_marketplace',
      icon: Store,
      id: 'prompt-marketplace',
      section: 'marketplace' as NavSection,
      onClick: () => navigate('/marketplace'),
    });
    links.push({
      title: 'nav_agent_marketplace',
      icon: Bot,
      id: 'agent-marketplace',
      section: 'marketplace' as NavSection,
      onClick: () => navigate('/agents'),
    });
    links.push({
      title: 'nav_templates',
      icon: LayoutTemplate,
      id: 'templates',
      section: 'marketplace' as NavSection,
      onClick: () => navigate('/templates'),
    });

    // ── 7. Team ───────────────────────────────────────────────────
    links.push({
      title: 'nav_organizations',
      icon: Building2,
      id: 'organizations',
      section: 'team' as NavSection,
      onClick: () => navigate('/organizations'),
    });
    links.push({
      title: 'nav_members',
      icon: Users,
      id: 'members',
      section: 'team' as NavSection,
      onClick: () => navigate('/members'),
    });
    links.push({
      title: 'nav_usage',
      icon: BarChart3,
      id: 'usage',
      section: 'team' as NavSection,
      onClick: () => navigate('/usage'),
    });
    if (billingEnabled) {
      links.push({
        title: 'nav_billing',
        icon: CreditCard,
        id: 'billing',
        section: 'team' as NavSection,
        onClick: () => navigate('/billing'),
      });
    }

    // ── 8. Integrations ───────────────────────────────────────────
    links.push({
      title: 'nav_integrations',
      icon: Plug,
      id: 'integrations',
      section: 'integrations' as NavSection,
      onClick: () => navigate('/integrations'),
    });
    links.push({
      title: 'nav_api_keys',
      icon: Key,
      id: 'api-keys',
      section: 'integrations' as NavSection,
      onClick: () => navigate('/api-keys'),
    });
    if (
      (hasAccessToUseMCPSettings && availableMCPServers && availableMCPServers.length > 0) ||
      hasAccessToCreateMCP
    ) {
      links.push({
        title: 'nav_mcp',
        icon: MCPIcon,
        id: 'mcp-builder',
        section: 'integrations' as NavSection,
        onClick: () => navigate('/mcp'),
      });
    }

    // ── 9. Settings ───────────────────────────────────────────────
    links.push({
      title: 'nav_profile',
      icon: UserCircle,
      id: 'profile',
      section: 'settings' as NavSection,
      onClick: () => navigate('/profile'),
    });
    links.push({
      title: 'nav_notifications',
      icon: Bell,
      id: 'notifications',
      section: 'settings' as NavSection,
      onClick: () => navigate('/notifications/preferences'),
    });
    links.push({
      title: 'nav_appearance',
      icon: Palette,
      id: 'appearance',
      section: 'settings' as NavSection,
      onClick: () => navigate('/settings/appearance'),
    });
    links.push({
      title: 'nav_ai_preferences',
      icon: SlidersHorizontal,
      id: 'ai-preferences',
      section: 'settings' as NavSection,
      onClick: () => navigate('/settings/ai'),
    });
    if (
      interfaceConfig.parameters === true &&
      isParamEndpoint(endpoint ?? '', endpointType ?? '') === true &&
      !isAgentsEndpoint(endpoint) &&
      keyProvided
    ) {
      links.push({
        title: 'nav_parameters',
        icon: Settings,
        id: 'parameters',
        section: 'settings' as NavSection,
        Component: Parameters,
      });
    }
    links.push({
      title: 'nav_security',
      icon: Shield,
      id: 'security',
      section: 'settings' as NavSection,
      onClick: () => navigate('/settings/security'),
    });
    links.push({
      title: 'nav_connected_accounts',
      icon: Link2,
      id: 'connected-accounts',
      section: 'settings' as NavSection,
      onClick: () => navigate('/settings/connected-accounts'),
    });

    // ── 10. Admin (super-admin only) ──────────────────────────────
    links.push({
      title: 'nav_admin_dashboard',
      icon: LayoutDashboard,
      id: 'admin',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin'),
    });
    links.push({
      title: 'nav_users',
      icon: Users,
      id: 'admin-users',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/users'),
    });
    links.push({
      title: 'nav_plans',
      icon: CreditCard,
      id: 'admin-plans',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/plans'),
    });
    links.push({
      title: 'nav_credits',
      icon: Coins,
      id: 'admin-credits',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/credits'),
    });
    links.push({
      title: 'nav_models',
      icon: Cpu,
      id: 'admin-models',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/providers'),
    });
    links.push({
      title: 'nav_providers',
      icon: Server,
      id: 'admin-providers',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/providers'),
    });
    links.push({
      title: 'nav_knowledge_settings',
      icon: BookOpenCheck,
      id: 'admin-knowledge',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/knowledge'),
    });
    links.push({
      title: 'nav_queues',
      icon: ListOrdered,
      id: 'admin-queues',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/queues'),
    });
    links.push({
      title: 'nav_analytics',
      icon: TrendingUp,
      id: 'admin-analytics',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/analytics'),
    });
    links.push({
      title: 'nav_system',
      icon: Settings,
      id: 'admin-system',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/system'),
    });
    links.push({
      title: 'nav_logs',
      icon: LogsIcon,
      id: 'admin-logs',
      section: 'admin' as NavSection,
      onClick: () => navigate('/admin/logs'),
    });

    // ── Hide panel ────────────────────────────────────────────────
    if (includeHidePanel && hidePanel) {
      links.push({
        title: 'com_sidepanel_hide_panel',
        icon: ArrowRightToLine,
        onClick: hidePanel,
        id: 'hide-panel',
      });
    }

    return links;
  }, [
    endpoint,
    endpointsConfig,
    keyProvided,
    hasAccessToAgents,
    hasAccessToCreateAgents,
    hasAccessToPrompts,
    hasAccessToSkills,
    skillsEnabled,
    hasAccessToMemories,
    hasAccessToReadMemories,
    interfaceConfig.parameters,
    endpointType,
    hasAccessToBookmarks,
    availableMCPServers,
    hasAccessToUseMCPSettings,
    hasAccessToCreateMCP,
    includeHidePanel,
    hidePanel,
    navigate,
    billingEnabled,
  ]);

  return Links;
}
