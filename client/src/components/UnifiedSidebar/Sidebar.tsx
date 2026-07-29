import { memo } from 'react';
import type { NavLink } from '~/common';
import SidePanelNav from '~/components/SidePanel/Nav';
import ExpandedPanel from './ExpandedPanel';

function Sidebar({
  links,
  expanded,
  showSecondaryPanel,
  onCollapse,
  onExpand,
  onResizeStart,
  onResizeKeyboard,
}: {
  links: NavLink[];
  expanded: boolean;
  showSecondaryPanel: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onResizeKeyboard: (direction: 'shrink' | 'grow') => void;
}) {
  return (
    <>
      <div className="flex h-full w-full overflow-hidden">
        <ExpandedPanel
          links={links}
          expanded={expanded}
          onCollapse={onCollapse}
          onExpand={onExpand}
        />
        {expanded && showSecondaryPanel && (
          <nav className="min-h-0 flex-1 overflow-hidden bg-surface-primary-alt">
            <SidePanelNav links={links} />
          </nav>
        )}
      </div>
      {expanded && showSecondaryPanel && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          tabIndex={0}
          className="absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize transition-colors hover:bg-border-medium active:bg-border-heavy"
          onMouseDown={onResizeStart}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              onResizeKeyboard('shrink');
            } else if (e.key === 'ArrowRight') {
              onResizeKeyboard('grow');
            }
          }}
        />
      )}
    </>
  );
}

export default memo(Sidebar);
