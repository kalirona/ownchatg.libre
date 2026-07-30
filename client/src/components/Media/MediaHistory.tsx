import { useState } from 'react';
import {
  Clock, Search, Heart, HeartOff, Trash2, Star, Filter,
  Image as ImageIcon, Video as VideoIcon, X,
} from 'lucide-react';
import { apiBaseUrl } from 'librechat-data-provider';
import type { MediaHistoryEntry } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

function getFirstMediaSrc(entry: MediaHistoryEntry): string | null {
  const fp = entry.images?.[0]?.filepath || entry.videos?.[0]?.filepath;
  if (!fp) { return null; }
  if (fp.startsWith('http') || fp.startsWith('data:')) { return fp; }
  return `${apiBaseUrl()}${fp}`;
}

type FilterType = 'all' | 'images' | 'videos';

type MediaHistoryProps = {
  records: MediaHistoryEntry[];
  onSelect: (entry: MediaHistoryEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesFilter: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  filterType?: FilterType;
  onFilterTypeChange?: (val: FilterType) => void;
};

export default function MediaHistory({
  records, onSelect, onDelete, onToggleFavorite,
  showFavoritesOnly, onToggleFavoritesFilter,
  searchQuery, onSearchChange, filterType, onFilterTypeChange,
}: MediaHistoryProps) {
  const localize = useLocalize();

  const filtered = records.filter((r) => {
    if (showFavoritesOnly && !r.favorite) { return false; }
    if (filterType === 'images' && r.type !== 'image') { return false; }
    if (filterType === 'videos' && r.type !== 'video') { return false; }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.prompt.toLowerCase().includes(q)) { return false; }
    }
    return true;
  });

  const filters: FilterType[] = ['all', 'images', 'videos'];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-light px-3 py-2.5">
        <h3 className="text-sm font-semibold text-text-primary">{localize('com_ui_history')}</h3>
      </div>

      <div className="border-b border-border-light px-3 py-2">
        <div className="flex items-center gap-1.5">
          {onSearchChange && (
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-secondary" />
              <input
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={localize('com_ui_search')}
                className="w-full rounded-md border border-border-light bg-surface-tertiary py-1 pl-6 pr-2 text-[11px] text-text-primary placeholder:text-text-secondary focus:outline-none"
              />
            </div>
          )}
          <button
            onClick={onToggleFavoritesFilter}
            className={`rounded-md p-1.5 ${showFavoritesOnly ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'text-text-secondary hover:bg-surface-hover'}`}
          >
            <Star className="h-3.5 w-3.5" />
          </button>
        </div>

        {onFilterTypeChange && (
          <div className="mt-2 flex gap-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => onFilterTypeChange(f)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                  filterType === f
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {f === 'all' ? <Filter className="h-3 w-3" /> : f === 'images' ? <ImageIcon className="h-3 w-3" /> : <VideoIcon className="h-3 w-3" />}
                {f === 'all' ? localize('com_ui_all') : f === 'images' ? localize('com_ui_images') : localize('com_ui_videos')}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Clock className="h-8 w-8 text-text-secondary" />
            <p className="text-xs text-text-secondary">{localize('com_ui_no_history')}</p>
          </div>
        ) : (
          filtered.map((entry) => {
            const src = getFirstMediaSrc(entry);
            return (
              <div
                key={entry._id}
                className="group cursor-pointer border-b border-border-light px-3 py-2.5 transition-colors hover:bg-surface-hover"
                onClick={() => onSelect(entry)}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-tertiary">
                    {src ? (
                      entry.type === 'video' ? (
                        <video src={src} className="h-full w-full object-cover" preload="none" />
                      ) : (
                        <img src={src} className="h-full w-full object-cover" loading="lazy" alt="" />
                      )
                    ) : (
                      entry.type === 'video'
                        ? <VideoIcon className="h-5 w-5 text-text-secondary" />
                        : <ImageIcon className="h-5 w-5 text-text-secondary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-text-primary">{entry.prompt}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-secondary">
                      <span>{entry.type === 'image' ? 'Image' : 'Video'}</span>
                      <span>·</span>
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{entry.creditsCost} credits</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry._id); }}
                      className="rounded p-1 text-text-secondary hover:bg-surface-tertiary hover:text-red-500"
                    >
                      {entry.favorite ? <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> : <HeartOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(entry._id); }}
                      className="rounded p-1 text-text-secondary hover:bg-surface-tertiary hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
