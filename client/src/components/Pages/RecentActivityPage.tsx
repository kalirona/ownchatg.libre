import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversationsInfiniteQuery } from '~/data-provider';
import PageLayout from '~/components/PageLayout';
import { Spinner } from '@librechat/client';
import { useLocalize } from '~/hooks';

export default function RecentActivityPage() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { data, isLoading } = useConversationsInfiniteQuery({}, { enabled: true, staleTime: 30000 });

  const conversations = useMemo(
    () => (data ? data.pages.flatMap((page) => page.conversations) : []),
    [data],
  );

  return (
    <PageLayout title="Recent Activity" description="Your recent conversations and actions.">
      {isLoading && conversations.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="text-text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-text-secondary">No recent activity yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {conversations.slice(0, 50).map((convo) => (
            <button
              key={convo.conversationId}
              onClick={() => navigate(`/c/${convo.conversationId}`)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-hover"
            >
              <MessageSquareIcon className="h-4 w-4 flex-shrink-0 text-text-secondary" />
              <span className="truncate text-sm text-text-primary">{convo.title}</span>
            </button>
          ))}
        </div>
      )}
    </PageLayout>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
