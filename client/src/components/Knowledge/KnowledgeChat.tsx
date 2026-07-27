import { useState } from 'react';
import { useKnowledgeChatMutation, useKnowledgeSearchMutation } from '~/data-provider';
import { useLocalize } from '~/hooks';

export default function KnowledgeChat({
  selectedFileIds,
}: {
  selectedFileIds: string[];
}) {
  const localize = useLocalize();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [searchResults, setSearchResults] = useState<string>('');

  const chatMutation = useKnowledgeChatMutation();
  const searchMutation = useKnowledgeSearchMutation();

  const handleSearch = () => {
    if (!message.trim() || selectedFileIds.length === 0) {
      return;
    }
    searchMutation.mutate(
      { fileIds: selectedFileIds, query: message, k: 5 },
      {
        onSuccess: (data) => {
          const formatted = data.results
            .map((r) => {
              const snippets = (r.data || [])
                .map((d: { text?: string; content?: string; score?: number }) => d.text || d.content || '')
                .filter(Boolean)
                .join('\n');
              return `[${r.fileId}]:\n${snippets}`;
            })
            .join('\n\n---\n\n');
          setSearchResults(formatted || 'No results found.');
        },
      },
    );
  };

  const handleChat = () => {
    if (!message.trim() || selectedFileIds.length === 0) {
      return;
    }
    setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
    chatMutation.mutate(
      { message, fileIds: selectedFileIds },
      {
        onSuccess: (data) => {
          setChatHistory((prev) => [...prev, { role: 'assistant', content: data.answer }]);
        },
        onError: () => {
          setChatHistory((prev) => [
            ...prev,
            { role: 'assistant', content: 'Chat failed. Check API configuration.' },
          ]);
        },
      },
    );
    setMessage('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {localize('com_knowledge_search')}
        </h3>
        {selectedFileIds.length > 0 && (
          <span className="text-xs text-gray-400">
            {selectedFileIds.length} {localize('com_knowledge_files_selected')}
          </span>
        )}
      </div>

      {selectedFileIds.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {localize('com_knowledge_select_files')}
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChat();
                  }
                }}
                placeholder={localize('com_knowledge_chat_placeholder')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                disabled={chatMutation.isLoading || searchMutation.isLoading}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchMutation.isLoading || selectedFileIds.length === 0}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              title={localize('com_knowledge_search_btn')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleChat}
              disabled={chatMutation.isLoading || selectedFileIds.length === 0}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {chatMutation.isLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>

          {searchResults && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
              <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">{searchResults}</pre>
            </div>
          )}

          <div className="mt-2 flex-1 overflow-y-auto space-y-2">
            {chatHistory.map((entry, i) => (
              <div
                key={i}
                className={`rounded-lg p-2 text-sm ${
                  entry.role === 'user'
                    ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {entry.role === 'user' ? localize('com_knowledge_you') : localize('com_knowledge_assistant')}
                </div>
                <div className="whitespace-pre-wrap">{entry.content}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
