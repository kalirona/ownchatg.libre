import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { useLocalize, useAuthContext } from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { cn } from '~/utils';

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

const MAX_CONVERSATIONS = 5;

export default function RecentConversationsWidget() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const { data, isLoading } = useConversationsInfiniteQuery(
    { pageSize: String(MAX_CONVERSATIONS) },
    {
      enabled: isAuthenticated,
      staleTime: 30000,
      cacheTime: 300000,
    },
  );

  const conversations = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.pages
      .flatMap((page) => page.conversations)
      .filter(Boolean)
      .slice(0, MAX_CONVERSATIONS);
  }, [data]);

  const handleClick = useCallback(
    (conversationId: string) => {
      navigate(`/c/${conversationId}`);
    },
    [navigate],
  );

  const handleViewAll = useCallback(() => {
    navigate('/c/new');
  }, [navigate]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-primary-alt px-5 py-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary">
          {localize('com_ui_chat_history')}
        </h2>
        {conversations.length > 0 && (
          <button
            type="button"
            onClick={handleViewAll}
            className="flex items-center gap-0.5 text-xs text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {localize('com_ui_show_all')}
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="h-4 w-4 rounded bg-surface-tertiary" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-3.5 w-3/4 rounded bg-surface-tertiary" />
                <div className="h-3 w-1/4 rounded bg-surface-tertiary" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-tertiary">
            <MessageSquare className="h-5 w-5 text-text-secondary" />
          </div>
          <p className="text-sm text-text-secondary">
            {localize('com_ui_no_conversations')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/c/new')}
            className="mt-0.5 text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {localize('com_ui_new_chat')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {conversations.map((convo) => (
            <button
              key={convo.conversationId}
              type="button"
              onClick={() => handleClick(convo.conversationId ?? '')}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg px-2 py-2 text-left',
                'transition-all duration-150 hover:bg-surface-hover',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black',
                'dark:focus-visible:ring-white',
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-text-secondary transition-colors group-hover:text-text-primary" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-text-primary">
                  {convo.title || localize('com_ui_untitled')}
                </span>
                <span className="text-xs text-text-secondary">
                  {convo.updatedAt
                    ? formatRelativeTime(convo.updatedAt.toString())
                    : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
