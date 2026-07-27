import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalize, type TranslationKeys } from '~/hooks';
import { cn } from '~/utils';

interface QuickAction {
  id: string;
  labelKey: TranslationKeys;
  emoji: string;
  path: string | undefined;
}

const actions: QuickAction[] = [
  {
    id: 'new-chat',
    labelKey: 'com_ui_new_chat',
    emoji: '💬',
    path: '/c/new',
  },
  {
    id: 'search',
    labelKey: 'com_ui_search',
    emoji: '🔍',
    path: '/search',
  },
  {
    id: 'prompts',
    labelKey: 'com_ui_prompts',
    emoji: '🤖',
    path: '/prompts/new',
  },
  {
    id: 'files',
    labelKey: 'com_sidepanel_attach_files',
    emoji: '📁',
    path: undefined,
  },
];

export default function QuickActions() {
  const localize = useLocalize();
  const navigate = useNavigate();

  const handleClick = useCallback(
    (path: string | undefined) => {
      if (path) {
        navigate(path);
      }
    },
    [navigate],
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => handleClick(action.path)}
          className={cn(
            'group flex flex-col items-center gap-2.5 rounded-xl px-4 py-5 text-center',
            'bg-surface-tertiary text-text-primary',
            'transition-all duration-200',
            'hover:-translate-y-0.5 hover:shadow-lg hover:bg-surface-hover',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black',
            'dark:focus-visible:ring-white',
          )}
        >
          <span
            className="text-2xl transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          >
            {action.emoji}
          </span>
          <span className="text-sm font-medium">{localize(action.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
