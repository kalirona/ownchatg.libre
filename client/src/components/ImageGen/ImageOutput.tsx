import { apiBaseUrl } from 'librechat-data-provider';
import type { TImageGenImage } from 'librechat-data-provider';
import { ImageDown, Download } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface ImageOutputProps {
  images: TImageGenImage[];
  isGenerating: boolean;
  error: string | null;
}

export function ImageOutput({ images, isGenerating, error }: ImageOutputProps) {
  const localize = useLocalize();

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border-light bg-surface-primary-alt p-12">
        <div className="mb-4 h-12 w-12 animate-pulse rounded-full bg-blue-500/20" />
        <p className="text-sm text-text-secondary">{localize('com_ui_image_gen_in_progress')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-light bg-surface-primary-alt p-12">
        <ImageDown className="mb-3 h-10 w-10 text-text-secondary" />
        <p className="text-sm text-text-secondary">{localize('com_ui_image_gen_empty')}</p>
      </div>
    );
  }

  const getImageSrc = (filepath: string) => {
    if (filepath.startsWith('http') || filepath.startsWith('data:')) {
      return filepath;
    }
    return `${apiBaseUrl()}${filepath}`;
  };

  const handleDownload = async (img: TImageGenImage) => {
    const url = getImageSrc(img.filepath);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = img.filepath.split('.').pop() || 'png';
      a.download = `image-${img.fileId}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          {localize('com_ui_results')} ({images.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, idx) => (
          <div
            key={img.fileId}
            className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary shadow-sm"
          >
            <div className="aspect-square overflow-hidden bg-surface-tertiary">
              <img
                src={getImageSrc(img.filepath)}
                alt={`Generated ${idx + 1}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </div>
            {/* Overlay actions */}
            <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => handleDownload(img)}
                className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 shadow backdrop-blur hover:bg-white"
                title={localize('com_ui_download')}
              >
                <Download className="h-3.5 w-3.5" />
                {localize('com_ui_download')}
              </button>
            </div>
            {/* Dimensions badge */}
            {img.width && img.height && (
              <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {img.width} × {img.height}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
