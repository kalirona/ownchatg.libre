import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MCPIcon, AttachmentIcon, OpenAIMinimalIcon } from '@librechat/client';
import {
  Bot,
  Brain,
  Bookmark,
  BookOpen,
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  NotebookPen,
  ScrollText,
  ArrowRightToLine,
  SlidersHorizontal,
  Store,
  UserCircle,
  Video as VideoIcon,
  Wrench,
  Shield,
  Play,
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
import MCPBuilderPanel from '~/components/SidePanel/MCPBuilder/MCPBuilderPanel';
import AgentPanelSwitch from '~/components/SidePanel/Agents/AgentPanelSwitch';
import BookmarkPanel from '~/components/SidePanel/Bookmarks/BookmarkPanel';
import PanelSwitch from '~/components/SidePanel/Builder/PanelSwitch';
import Parameters from '~/components/SidePanel/Parameters/Panel';
import { MemoryPanel } from '~/components/SidePanel/Memories';
import FilesPanel from '~/components/SidePanel/Files/Panel';
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
    const links: NavLink[] = [
      {
        title: 'com_nav_dashboard',
        label: '',
        icon: LayoutDashboard,
        id: 'dashboard',
        section: 'workspace' as NavSection,
        onClick: () => navigate('/dashboard'),
      },
    ];

    links.push({
      title: 'com_nav_image_gen',
      label: '',
      icon: ImageIcon,
      id: 'image-gen',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/images'),
    });

    links.push({
      title: 'com_nav_video_gen',
      label: '',
      icon: VideoIcon,
      id: 'video-gen',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/video'),
    });

    links.push({
      title: 'com_nav_knowledge',
      label: '',
      icon: BookOpen,
      id: 'knowledge',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/knowledge'),
    });

    links.push({
      title: 'com_nav_marketplace',
      label: '',
      icon: Store,
      id: 'marketplace',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/marketplace'),
    });

    links.push({
      title: 'com_nav_assistant_builder',
      label: '',
      icon: Wrench,
      id: 'assistant-builder',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/agents/new'),
    });

    links.push({
      title: 'com_nav_admin',
      label: '',
      icon: Shield,
      id: 'admin',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/admin'),
    });

    links.push({
      title: 'com_nav_workflows',
      label: '',
      icon: Play,
      id: 'workflows',
      section: 'workspace' as NavSection,
      onClick: () => navigate('/workflows'),
    });

    links.push({
      title: 'com_nav_profile',
      label: '',
      icon: UserCircle,
      id: 'profile',
      section: 'account' as NavSection,
      onClick: () => navigate('/profile'),
    });

    if (billingEnabled) {
      links.push({
        title: 'com_nav_billing',
        label: '',
        icon: CreditCard,
        id: 'billing',
        section: 'account' as NavSection,
        onClick: () => navigate('/billing'),
      });
    }

    if (
      endpointsConfig?.[EModelEndpoint.agents] &&
      hasAccessToAgents &&
      hasAccessToCreateAgents &&
      endpointsConfig[EModelEndpoint.agents].disableBuilder !== true
    ) {
      links.push({
        title: 'com_sidepanel_agent_builder',
        label: '',
        icon: Bot,
        id: EModelEndpoint.agents,
        section: 'ai-tools' as NavSection,
        Component: AgentPanelSwitch,
      });
    }

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
        title: 'com_sidepanel_assistant_builder',
        label: '',
        icon: OpenAIMinimalIcon,
        id: EModelEndpoint.assistants,
        section: 'ai-tools' as NavSection,
        Component: PanelSwitch,
      });
    }

    if (hasAccessToSkills && skillsEnabled) {
      links.push({
        title: 'com_ui_skills',
        label: '',
        icon: ScrollText,
        id: 'skills',
        section: 'ai-tools' as NavSection,
        Component: SkillsAccordion,
      });
    }

    if (hasAccessToPrompts) {
      links.push({
        title: 'com_ui_prompts',
        label: '',
        icon: NotebookPen,
        id: 'prompts',
        section: 'library' as NavSection,
        Component: PromptsAccordion,
      });
    }

    if (hasAccessToMemories && hasAccessToReadMemories) {
      links.push({
        title: 'com_ui_memories',
        label: '',
        icon: Brain,
        id: 'memories',
        section: 'library' as NavSection,
        Component: MemoryPanel,
      });
    }

    if (hasAccessToBookmarks) {
      links.push({
        title: 'com_sidepanel_conversation_tags',
        label: '',
        icon: Bookmark,
        id: 'bookmarks',
        section: 'library' as NavSection,
        Component: BookmarkPanel,
      });
    }

    links.push({
      title: 'com_sidepanel_attach_files',
      label: '',
      icon: AttachmentIcon,
      id: 'files',
      section: 'library' as NavSection,
      Component: FilesPanel,
    });

    if (
      interfaceConfig.parameters === true &&
      isParamEndpoint(endpoint ?? '', endpointType ?? '') === true &&
      !isAgentsEndpoint(endpoint) &&
      keyProvided
    ) {
      links.push({
        title: 'com_sidepanel_parameters',
        label: '',
        icon: SlidersHorizontal,
        id: 'parameters',
        section: 'account' as NavSection,
        Component: Parameters,
      });
    }

    if (
      (hasAccessToUseMCPSettings && availableMCPServers && availableMCPServers.length > 0) ||
      hasAccessToCreateMCP
    ) {
      links.push({
        title: 'com_nav_setting_mcp',
        label: '',
        icon: MCPIcon,
        id: 'mcp-builder',
        section: 'account' as NavSection,
        Component: MCPBuilderPanel,
      });
    }

    if (includeHidePanel && hidePanel) {
      links.push({
        title: 'com_sidepanel_hide_panel',
        label: '',
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
