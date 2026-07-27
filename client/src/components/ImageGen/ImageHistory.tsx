import { useState } from 'react';
import { Trash2, Heart, HeartOff, Search, Clock, Star } from 'lucide-react';
import { apiBaseUrl } from 'librechat-data-provider';
import type { TImageGenHistoryEntry } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

interface ImageHistoryProps {
  records: TImageGenHistoryEntry[];
  onSelect: (entry: TImageGenHistoryEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesFilter: () => void;
  isDeleting: boolean;
  isLoading: boolean;
}

export function ImageHistory({
  records,
  onSelect,
  onDelete,
  onToggleFavorite,
  showFavoritesOnly,
  onToggleFavoritesFilter,
  isDeleting,
  isLoading,
}: ImageHistoryProps) {
  const localize = useLocalize();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = records.filter((r) => {
    if (searchTerm) {
      return r.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const getImageSrc = (filepath: string) => {
    if (filepath.startsWith('http') || filepath.startsWith('data:')) {
      return filepath;
    }
    return `${apiBaseUrl()}${filepath}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return localize('com_ui_just_now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border-light px-3 py-2.5">
        <h3 className="text-sm font-semibold text-text-primary">
          {localize('com_ui_history')}
        </h3>
      </div>

      {/* Search + Filter */}
      <div className="border-b border-border-light px-3 py-2">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={localize('com_ui_search')}
            className="w-full rounded-md border border-border-light bg-surface-tertiary py-1 pl-7 pr-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          />
        </div>
        <button
          onClick={onToggleFavoritesFilter}
          className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs ${
            showFavoritesOnly
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'text-text-secondary hover:bg-surface-hover'
          }`}
        >
          <Star className="h-3 w-3" />
          {localize('com_ui_favorites')}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Clock className="h-8 w-8 text-text-secondary" />
            <p className="text-xs text-text-secondary">
              {showFavoritesOnly
                ? localize('com_ui_no_favorites')
                : localize('com_ui_no_history')}
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry._id}
              className="group cursor-pointer border-b border-border-light px-3 py-2.5 transition-colors hover:bg-surface-hover"
              onClick={() => onSelect(entry)}
            >
              <div className="flex items-start gap-2.5">
                {/* Thumbnail */}
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-tertiary">
                  {entry.images[0] && (
                    <img
                      src={getImageSrc(entry.images[0].filepath)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">
                    {entry.prompt}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-secondary">
                    <span>{entry.provider}</span>
                    <span>·</span>
                    <span>{formatDate(entry.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
                  {isLoading ? null : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(entry._id);
                      }}
                      className="rounded p-1 text-text-secondary hover:bg-surface-tertiary hover:text-red-500"
                      title={localize('com_ui_toggle_favorite')}
                    >
                      {entry.favorite ? (
                        <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                      ) : (
                        <HeartOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry._id);
                    }}
                    disabled={isDeleting}
                    className="rounded p-1 text-text-secondary hover:bg-surface-tertiary hover:text-red-500"
                    title={localize('com_ui_delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
