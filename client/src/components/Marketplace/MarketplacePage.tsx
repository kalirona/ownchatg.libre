import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TMarketplacePrompt } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';
import {
  useGetMarketplacePrompts,
  useGetMarketplaceFeatured,
  useGetMarketplaceCategories,
  useGetMarketplaceFavorites,
  useToggleMarketplaceFavoriteMutation,
} from '~/data-provider';
import PromptCard from './PromptCard';
import CategoryFilter from './CategoryFilter';

export default function MarketplacePage() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'browse' | 'favorites'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState<'trending' | 'newest'>('trending');
  const [page, setPage] = useState(1);

  const { data: featuredData } = useGetMarketplaceFeatured();
  const { data: categoriesData } = useGetMarketplaceCategories();
  const { data: browseData, refetch: refetchBrowse } = useGetMarketplacePrompts(
    { search: searchQuery || undefined, category: selectedCategory || undefined, sort: sortOrder, page },
    { enabled: activeTab === 'browse' },
  );
  const { data: favoritesData, refetch: refetchFavorites } = useGetMarketplaceFavorites(
    { page },
    { enabled: activeTab === 'favorites' },
  );

  const toggleFavoriteMutation = useToggleMarketplaceFavoriteMutation();

  const handleToggleFavorite = useCallback(
    (groupId: string) => {
      toggleFavoriteMutation.mutate(groupId);
    },
    [toggleFavoriteMutation],
  );

  const handleUsePrompt = useCallback(
    (prompt: TMarketplacePrompt) => {
      const productionPrompt = prompt.productionPrompt?.prompt || '';
      if (!productionPrompt) {
        return;
      }
      const hasVars = productionPrompt.includes('{{');
      if (hasVars) {
        navigate(`/prompts/${prompt._id}`);
      } else {
        navigate(`/c/new?prompt=${encodeURIComponent(productionPrompt)}`);
      }
    },
    [navigate],
  );

  const data = activeTab === 'browse' ? browseData : favoritesData;
  const prompts = data?.prompts || [];
  const totalPages = data?.pages || 1;
  const featured = featuredData?.prompts || [];

  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedCategory, searchQuery, sortOrder]);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {localize('com_marketplace_title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {localize('com_marketplace_subtitle')}
        </p>
      </div>

      {activeTab === 'browse' && featured.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
            {localize('com_marketplace_featured')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PromptCard
                key={p._id}
                prompt={p}
                onToggleFavorite={handleToggleFavorite}
                onUsePrompt={handleUsePrompt}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              activeTab === 'browse'
                ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {localize('com_marketplace_browse')}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              activeTab === 'favorites'
                ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {localize('com_marketplace_favorites')}
          </button>
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={localize('com_marketplace_search_placeholder')}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'trending' | 'newest')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="trending">{localize('com_marketplace_trending')}</option>
              <option value="newest">{localize('com_marketplace_newest')}</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === 'browse' && categoriesData?.categories && (
        <div className="mb-4">
          <CategoryFilter
            categories={categoriesData.categories}
            selected={selectedCategory}
            onSelect={(cat) => {
              setSelectedCategory(cat);
              setPage(1);
            }}
          />
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {activeTab === 'favorites'
              ? localize('com_marketplace_no_favorites')
              : localize('com_marketplace_no_results')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prompts.map((p) => (
              <PromptCard
                key={p._id}
                prompt={p}
                onToggleFavorite={handleToggleFavorite}
                onUsePrompt={handleUsePrompt}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600"
              >
                {localize('com_marketplace_prev')}
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600"
              >
                {localize('com_marketplace_next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
