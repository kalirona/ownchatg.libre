import { useState, useRef, useEffect } from 'react';
import {
  Send, Search, Sparkles, FileText, BookOpen, ListChecks,
  Table, ClipboardList, Languages, FileEdit, GraduationCap, LayoutGrid,
  ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useKnowledgeChatMutation, useQuickKnowledgeActionMutation } from '~/data-provider';
import { useLocalize } from '~/hooks';
import type { TKnowledgeSource, TKnowledgeQuickAction } from 'librechat-data-provider';

const QUICK_ACTIONS: { action: TKnowledgeQuickAction; icon: any; label: string }[] = [
  { action: 'summarize', icon: Sparkles, label: 'Summarize' },
  { action: 'faq', icon: ListChecks, label: 'FAQ' },
  { action: 'extract-tables', icon: Table, label: 'Tables' },
  { action: 'sop', icon: ClipboardList, label: 'Create SOP' },
  { action: 'translate', icon: Languages, label: 'Translate' },
  { action: 'blog', icon: FileEdit, label: 'Blog' },
  { action: 'quiz', icon: GraduationCap, label: 'Quiz' },
  { action: 'flashcards', icon: LayoutGrid, label: 'Flashcards' },
];

const SUGGESTIONS = [
  'Summarize these documents',
  'What is the main topic?',
  'Find key findings',
  'Compare documents',
  'Generate FAQ',
  'Extract action items',
];

type ChatEntry = {
  role: 'user' | 'assistant';
  content: string;
  sources?: TKnowledgeSource[];
};

export default function KnowledgeChat({
  selectedFileIds,
  collectionId,
}: {
  selectedFileIds: string[];
  collectionId?: string | null;
}) {
  const localize = useLocalize();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [showSources, setShowSources] = useState<Record<number, boolean>>({});
  const [showActions, setShowActions] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useKnowledgeChatMutation();
  const quickActionMutation = useQuickKnowledgeActionMutation();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChat = (action?: string) => {
    if ((!message.trim() && !action) || selectedFileIds.length === 0) { return; }
    const msg = action ? `Perform ${action} on the selected documents` : message;
    setChatHistory((prev) => [...prev, { role: 'user', content: msg }]);
    setMessage('');

    const mutation = action ? quickActionMutation : chatMutation;
    mutation.mutate(
      action ? { fileIds: selectedFileIds, action: action as TKnowledgeQuickAction } : { message: msg, fileIds: selectedFileIds },
      {
        onSuccess: (data) => {
          setChatHistory((prev) => [...prev, {
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
          }]);
        },
        onError: () => {
          setChatHistory((prev) => [...prev, {
            role: 'assistant',
            content: 'Failed. Check API configuration.',
          }]);
        },
      },
    );
  };

  const isLoading = chatMutation.isLoading || quickActionMutation.isLoading;

  const toggleSources = (idx: number) => {
    setShowSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-light px-3 py-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">AI Chat</h3>
        </div>
        {selectedFileIds.length > 0 && (
          <span className="rounded bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-text-secondary">
            {selectedFileIds.length} docs
          </span>
        )}
      </div>

      {selectedFileIds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="rounded-full bg-surface-tertiary p-3">
            <Search className="h-6 w-6 text-text-secondary" />
          </div>
          <p className="text-sm text-text-secondary">Ask your documents...</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {['What is SEO?', 'Summarize this PDF', 'Find pricing', 'Generate FAQ'].map((s) => (
              <button
                key={s}
                onClick={() => { setMessage(s); }}
                className="rounded-lg border border-border-light bg-surface-tertiary px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-hover"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* AI Quick Actions */}
          {showActions && (
            <div className="border-b border-border-light px-2 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-text-secondary">AI Actions</span>
                <button onClick={() => setShowActions(false)} className="text-text-secondary hover:text-text-primary">
                  <ChevronUp className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.action}
                    onClick={() => handleChat(qa.action)}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border-light bg-surface-primary px-1.5 py-2 text-[10px] text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                  >
                    <qa.icon className="h-3.5 w-3.5" />
                    <span className="text-[9px] leading-tight">{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!showActions && (
            <button
              onClick={() => setShowActions(true)}
              className="flex items-center gap-1 border-b border-border-light px-3 py-1.5 text-[10px] text-text-secondary hover:text-text-primary"
            >
              <ChevronDown className="h-3 w-3" /> AI Actions
            </button>
          )}

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto space-y-2 p-3">
            {chatHistory.map((entry, i) => (
              <div key={i}>
                <div
                  className={`rounded-lg p-2.5 text-sm ${
                    entry.role === 'user'
                      ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'bg-surface-tertiary text-text-primary'
                  }`}
                >
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                    {entry.role === 'user' ? 'You' : 'AI'}
                  </div>
                  <div className="whitespace-pre-wrap text-xs">{entry.content}</div>
                </div>

                {entry.sources && entry.sources.length > 0 && (
                  <div className="mt-1">
                    <button
                      onClick={() => toggleSources(i)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-secondary hover:text-blue-600"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Sources ({entry.sources.length})
                      {showSources[i] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showSources[i] && (
                      <div className="ml-2 space-y-1 border-l-2 border-blue-200 pl-2 dark:border-blue-800">
                        {entry.sources.map((src, j) => (
                          <div key={j} className="rounded bg-surface-tertiary px-2 py-1.5 text-xs">
                            <span className="font-medium text-text-primary">{src.filename}</span>
                            {src.page && <span className="text-text-secondary"> · Page {src.page}</span>}
                            {src.excerpt && (
                              <p className="mt-0.5 text-[10px] text-text-secondary line-clamp-2">{src.excerpt}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 rounded-lg bg-surface-tertiary p-2.5 text-xs text-text-secondary">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
                Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-border-light p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) { handleChat(); }
                  }
                }}
                placeholder="Ask a question..."
                className="flex-1 rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                disabled={isLoading}
              />
              <button
                onClick={() => handleChat()}
                disabled={isLoading || !message.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
