import { useState } from 'react';
import type { TMarketplacePrompt } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

export default function PromptCard({
  prompt,
  onToggleFavorite,
  onUsePrompt,
}: {
  prompt: TMarketplacePrompt;
  onToggleFavorite: (groupId: string) => void;
  onUsePrompt: (prompt: TMarketplacePrompt) => void;
}) {
  const localize = useLocalize();

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg hover:border-green-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-600">
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {prompt.category || 'General'}
            </span>
            {prompt.command && (
              <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                /{prompt.command}
              </span>
            )}
          </div>
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {prompt.name}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(prompt._id);
          }}
          className="ml-2 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
        >
          {prompt.isFavorited ? (
            <svg className="h-4 w-4 fill-red-500 text-red-500" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>

      {prompt.oneliner && (
        <p className="px-4 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {prompt.oneliner}
        </p>
      )}

      {prompt.productionPrompt?.prompt && (
        <div className="mx-4 mt-2 max-h-16 overflow-hidden rounded-lg bg-gray-50 p-2 dark:bg-gray-900">
          <pre className="truncate whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">
            {prompt.productionPrompt.prompt.slice(0, 120)}
            {prompt.productionPrompt.prompt.length > 120 ? '...' : ''}
          </pre>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 px-4 py-2 dark:border-gray-700">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            {prompt.authorName || 'Anonymous'}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {prompt.numberOfGenerations}
          </span>
        </div>
        <button
          onClick={() => onUsePrompt(prompt)}
          className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors"
        >
          {localize('com_marketplace_use')}
        </button>
      </div>
    </div>
  );
}
