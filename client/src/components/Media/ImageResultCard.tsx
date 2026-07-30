import { useState } from 'react';
import {
  Download, Copy, RefreshCw, Trash2, Heart, HeartOff,
  Maximize2, Wand2, Crop, Layers, Video, Star, X,
} from 'lucide-react';
import { apiBaseUrl } from 'librechat-data-provider';
import type { MediaResultImage } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

type ImageResultCardProps = {
  image: MediaResultImage;
  historyId: string;
  favorite: boolean;
  onDownload: (img: MediaResultImage) => void;
  onCopyPrompt?: () => void;
  onReuse?: () => void;
  onEditPrompt?: () => void;
  onGenerateSimilar?: () => void;
  onUpscale?: (historyId: string, imageId: string) => void;
  onRemoveBg?: (historyId: string, imageId: string) => void;
  onVariations?: (historyId: string, imageId: string) => void;
  onFavoriteToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

function getSrc(fp: string) {
  if (fp.startsWith('http') || fp.startsWith('data:')) { return fp; }
  return `${apiBaseUrl()}${fp}`;
}

export default function ImageResultCard({
  image, historyId, favorite, onDownload, onCopyPrompt, onReuse, onEditPrompt,
  onGenerateSimilar, onUpscale, onRemoveBg, onVariations, onFavoriteToggle, onDelete,
}: ImageResultCardProps) {
  const localize = useLocalize();
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getSrc(image.filepath));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const ActionBtn = ({ icon: Icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary shadow-sm">
        <div
          className="relative cursor-pointer bg-black"
          onClick={() => setShowPreview(true)}
        >
          <img
            src={getSrc(image.filepath)}
            alt="Generated"
            className="h-auto w-full object-contain"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-5 w-5 text-white" />
          </div>
        </div>

        {(image.width && image.height) && (
          <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {image.width}×{image.height}
          </div>
        )}

        <div className="flex flex-wrap gap-1 border-t border-border-light bg-surface-secondary p-2">
          <ActionBtn icon={Download} label={localize('com_ui_download')} onClick={() => onDownload(image)} />
          <ActionBtn icon={copied ? Star : Copy} label={copied ? 'Copied!' : localize('com_ui_copy')} onClick={handleCopy} />
          <ActionBtn icon={RefreshCw} label={localize('com_ui_reuse')} onClick={onReuse} />
          {onUpscale && <ActionBtn icon={Wand2} label={localize('com_ui_upscale')} onClick={() => onUpscale(historyId, image.fileId)} />}
          {onRemoveBg && <ActionBtn icon={Crop} label={localize('com_ui_remove_bg')} onClick={() => onRemoveBg(historyId, image.fileId)} />}
          {onVariations && <ActionBtn icon={Layers} label={localize('com_ui_variations')} onClick={() => onVariations(historyId, image.fileId)} />}
          {onFavoriteToggle && (
            <ActionBtn
              icon={favorite ? Heart : HeartOff}
              label={favorite ? 'Favorited' : localize('com_ui_favorite')}
              onClick={() => onFavoriteToggle(historyId)}
              danger={favorite}
            />
          )}
          {onDelete && <ActionBtn icon={Trash2} label={localize('com_ui_delete')} onClick={() => onDelete(historyId)} danger />}
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
          <img
            src={getSrc(image.filepath)}
            alt="Preview"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
