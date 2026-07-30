import { useState } from 'react';
import {
  Download, Trash2, Heart, HeartOff, Maximize2, RefreshCw,
  Video, Image, Scissors, Share2, X,
} from 'lucide-react';
import { apiBaseUrl } from 'librechat-data-provider';
import type { MediaResultVideo } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

type VideoResultCardProps = {
  video: MediaResultVideo;
  historyId: string;
  favorite: boolean;
  onDownload: (vid: MediaResultVideo) => void;
  onRegenerate?: () => void;
  onExtend?: () => void;
  onThumbnail?: () => void;
  onExtractFrames?: () => void;
  onShare?: () => void;
  onFavoriteToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

function getSrc(fp: string) {
  if (fp.startsWith('http') || fp.startsWith('data:')) { return fp; }
  return `${apiBaseUrl()}${fp}`;
}

export default function VideoResultCard({
  video, historyId, favorite, onDownload, onRegenerate, onExtend,
  onThumbnail, onExtractFrames, onShare, onFavoriteToggle, onDelete,
}: VideoResultCardProps) {
  const localize = useLocalize();
  const [showPreview, setShowPreview] = useState(false);

  const ActionBtn = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary shadow-sm">
        <div className="relative cursor-pointer bg-black" onClick={() => setShowPreview(true)}>
          <video
            src={getSrc(video.filepath)}
            className="h-auto w-full object-contain"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="absolute left-2 top-2 flex gap-1.5">
          {video.width && video.height && (
            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              {video.width}×{video.height}
            </span>
          )}
          {video.duration && (
            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              {video.duration}s
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 border-t border-border-light bg-surface-secondary p-2">
          <ActionBtn icon={Download} label={localize('com_ui_download')} onClick={() => onDownload(video)} />
          <ActionBtn icon={RefreshCw} label={localize('com_ui_regenerate')} onClick={onRegenerate} />
          {onExtend && <ActionBtn icon={Video} label={localize('com_ui_extend')} onClick={onExtend} />}
          {onThumbnail && <ActionBtn icon={Image} label={localize('com_ui_thumbnail')} onClick={onThumbnail} />}
          {onExtractFrames && <ActionBtn icon={Scissors} label={localize('com_ui_extract_frames')} onClick={onExtractFrames} />}
          {onShare && <ActionBtn icon={Share2} label={localize('com_ui_share')} onClick={onShare} />}
          {onFavoriteToggle && (
            <ActionBtn
              icon={favorite ? Heart : HeartOff}
              label={favorite ? 'Favorited' : localize('com_ui_favorite')}
              onClick={() => onFavoriteToggle(historyId)}
            />
          )}
          {onDelete && <ActionBtn icon={Trash2} label={localize('com_ui_delete')} onClick={() => onDelete(historyId)} />}
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowPreview(false)}
        >
          <button className="absolute right-4 top-4 text-white/80 hover:text-white">
            <X className="h-6 w-6" />
          </button>
          <video
            src={getSrc(video.filepath)}
            className="max-h-full max-w-full rounded-lg"
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
