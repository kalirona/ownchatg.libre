import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import PageLayout from '~/components/PageLayout';
import { useLocalize } from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const localize = useLocalize();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useConversationsInfiniteQuery({
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  const conversations = data?.pages.flatMap((page) => page.conversations) || [];

  const filteredConversations = searchQuery
    ? conversations.filter((c) =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversations;

  return (
    <PageLayout title="Templates" description="Start new conversations from templates">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/c/new')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg border border-border-light bg-surface-primary"
            />
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <MessageSquare className="h-12 w-12 text-text-secondary" />
          <p className="text-base text-text-secondary">
            {searchQuery ? 'No templates match your search.' : 'No templates yet.'}
          </p>
          <p className="max-w-sm text-sm text-text-secondary">
            Create a new template or start a new conversation to see it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.conversationId}
              onClick={() => navigate(`/c/${conversation.conversationId}`)}
              className="rounded-lg border border-border-light bg-surface-primary p-4 text-left transition-colors hover:bg-surface-hover"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary">
                  <MessageSquare className="h-4 w-4 text-text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {conversation.title || 'Untitled'}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                    <Clock className="h-3 w-3" />
                    {conversation.createdAt
                      ? new Date(conversation.createdAt).toLocaleDateString()
                      : ''}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
