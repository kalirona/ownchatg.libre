import { memo, useCallback, lazy, Suspense, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { SquarePen } from 'lucide-react';
import { QueryKeys } from 'librechat-data-provider';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton, Sidebar, Button, TooltipAnchor } from '@librechat/client';
import type { NavLink, NavSection } from '~/common';
import { NAV_SECTIONS } from '~/common';
import { useShortcutAriaKey, useShortcutHint } from '~/hooks/useKeyboardShortcuts';
import { useActivePanel, resolveActivePanel, DEFAULT_PANEL } from '~/Providers';
import { CLOSE_SIDEBAR_ID } from '~/components/Chat/Menus/OpenSidebar';
import { useLocalize, useNewConvo } from '~/hooks';
import { clearMessagesCache, cn } from '~/utils';
import store from '~/store';

const SECTION_LABELS: Record<NavSection, string> = {
  workspace: 'com_ui_workspace',
  'ai-tools': 'com_ui_ai_tools',
  library: 'com_ui_library',
  account: 'com_ui_account',
};

const AccountSettings = lazy(() => import('~/components/Nav/AccountSettings'));

const NewChatButton = memo(function NewChatButton({
  setActive,
}: {
  setActive: (id: string) => void;
}) {
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const { newConversation } = useNewConvo();
  const conversation = useRecoilValue(store.conversationByIndex(0));
  const switchToHistory = useRecoilValue(store.newChatSwitchToHistory);
  const tooltipDescription = useShortcutHint('newChat', localize('com_ui_new_chat'));
  const ariaKey = useShortcutAriaKey('newChat');

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        clearMessagesCache(queryClient, conversation?.conversationId);
        queryClient.invalidateQueries([QueryKeys.messages]);
        newConversation();
        if (switchToHistory) {
          setActive(DEFAULT_PANEL);
        }
      }
    },
    [queryClient, conversation?.conversationId, newConversation, switchToHistory, setActive],
  );

  return (
    <TooltipAnchor
      side="right"
      description={tooltipDescription}
      render={
        <a
          href="/c/new"
          data-testid="new-chat-button"
          aria-label={localize('com_ui_new_chat')}
          aria-keyshortcuts={ariaKey}
          className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover"
          onClick={handleClick}
        >
          <SquarePen className="h-5 w-5 flex-shrink-0 text-text-primary" />
          <span className="text-sm">{localize('com_ui_new_chat')}</span>
        </a>
      }
    />
  );
});

const NavIconButton = memo(function NavIconButton({
  link,
  isActive,
  expanded,
  setActive,
  onExpand,
  onCollapse,
}: {
  link: NavLink;
  isActive: boolean;
  expanded: boolean;
  setActive: (id: string) => void;
  onExpand?: () => void;
  onCollapse?: () => void;
}) {
  const localize = useLocalize();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (link.onClick) {
        setActive(link.id);
        link.onClick(e);
        return;
      }
      if (isActive && expanded) {
        onCollapse?.();
        return;
      }
      if (!isActive) {
        setActive(link.id);
      }
      if (!expanded) {
        onExpand?.();
      }
    },
    [link, isActive, setActive, expanded, onExpand, onCollapse],
  );

  return (
    <TooltipAnchor
      description={localize(link.title)}
      side="right"
      render={
        <Button
          size="icon"
          variant="ghost"
          aria-label={localize(link.title)}
          aria-pressed={isActive}
          data-testid={`nav-panel-${link.id}`}
          className={cn(
            'flex h-9 w-full items-center justify-start gap-3 rounded-lg px-3 border-l-2',
            isActive
              ? 'border-accent bg-surface-active-alt text-text-primary'
              : 'border-transparent text-text-secondary',
          )}
          onClick={handleClick}
        >
          <link.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm">{localize(link.title)}</span>
        </Button>
      }
    />
  );
});

function ExpandedPanel({
  links,
  expanded = true,
  onCollapse,
  onExpand,
}: {
  links: NavLink[];
  expanded?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
}) {
  const localize = useLocalize();
  const { active, setActive } = useActivePanel();
  const effectiveActive = resolveActivePanel(active, links);

  const toggleLabel = expanded ? 'com_nav_close_sidebar' : 'com_nav_open_sidebar';
  const toggleClick = expanded ? onCollapse : onExpand;
  const toggleSidebarHint = useShortcutHint('toggleSidebar', localize(toggleLabel));
  const toggleSidebarAriaKey = useShortcutAriaKey('toggleSidebar');

  const sectionedLinks = useMemo(() => {
    const grouped: { section: NavSection | null; items: NavLink[] }[] = [];
    const sectionOrder = [...NAV_SECTIONS, null];
    const map = new Map<NavSection | null, NavLink[]>();

    for (const link of links) {
      const s = link.section ?? null;
      if (!map.has(s)) {
        map.set(s, []);
      }
      map.get(s)!.push(link);
    }

    for (const s of sectionOrder) {
      const items = map.get(s);
      if (items && items.length > 0) {
        grouped.push({ section: s, items });
      }
    }

    return grouped;
  }, [links]);

  return (
    <div className="flex h-full flex-shrink-0 flex-col gap-1 border-r border-border-light bg-surface-primary-alt px-3 py-3">
      <TooltipAnchor
        side="right"
        description={toggleSidebarHint}
        render={
          <Button
            id={expanded ? CLOSE_SIDEBAR_ID : undefined}
            data-testid={expanded ? 'close-sidebar-button' : 'open-sidebar-button'}
            size="icon"
            variant="ghost"
            aria-label={localize(toggleLabel)}
            aria-expanded={expanded}
            aria-keyshortcuts={toggleSidebarAriaKey}
            className="flex h-9 w-full items-center justify-start gap-3 rounded-lg px-3"
            onClick={toggleClick}
          >
            <Sidebar aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-text-primary" />
            <span className="text-sm">{localize(toggleLabel)}</span>
          </Button>
        }
      />
      <NewChatButton setActive={setActive} />
      <div className="mx-2 border-b border-border-light" />
      <div className="flex flex-col overflow-y-auto">
        {sectionedLinks.map((group, groupIdx) => (
          <div key={group.section ?? `unsectioned-${groupIdx}`} className="flex flex-col">
            {group.section && groupIdx > 0 && (
              <div className="px-3 py-1">
                <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {localize(SECTION_LABELS[group.section])}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((link) => (
                <NavIconButton
                  key={link.id}
                  link={link}
                  isActive={link.id === effectiveActive}
                  expanded={expanded ?? true}
                  setActive={setActive}
                  onExpand={onExpand}
                  onCollapse={onCollapse}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <Suspense fallback={<Skeleton className="h-9 w-full rounded-lg" />}>
          <AccountSettings collapsed={false} />
        </Suspense>
      </div>
    </div>
  );
}

export default memo(ExpandedPanel);
