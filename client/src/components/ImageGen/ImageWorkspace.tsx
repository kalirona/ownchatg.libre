import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Image, Sparkles } from 'lucide-react';
import type {
  MediaPresetId, MediaQuality, MediaStyle, MediaAspectRatio,
  MediaResultImage, MediaHistoryEntry, NumImages,
} from 'librechat-data-provider';
import { MEDIA_PRESETS, MEDIA_CREDIT_COSTS } from 'librechat-data-provider';
import {
  useGetMediaPresets, useGetMediaCreditCosts,
  useGetMediaHistory, useGenerateMediaMutation,
  useDeleteMediaHistoryMutation, useToggleMediaFavoriteMutation,
  useUpscaleImageMutation, useRemoveBackgroundMutation, useCreateVariationsMutation,
} from '~/data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import { PromptBox, ProgressCard, ImageResultCard, MediaHistory } from '~/components/Media';

const QUALITY_OPTIONS: { key: MediaQuality; label: string; icon: string }[] = [
  { key: 'fast', label: '⚡ Fast AI', icon: '⚡' },
  { key: 'balanced', label: '✨ Balanced AI', icon: '✨' },
  { key: 'best', label: '🏆 Premium AI', icon: '🏆' },
];

const STYLE_OPTIONS: MediaStyle[] = [
  'photo', 'illustration', '3d', 'anime', 'logo', 'vector', 'realistic', 'fantasy', 'product', 'portrait',
];

const ASPECT_RATIOS: MediaAspectRatio[] = ['1:1', '16:9', '9:16', '4:5', '3:2'];
const NUM_OPTIONS: NumImages[] = [1, 2, 4];

const QUALITY_LABELS: Record<MediaQuality, string> = { fast: 'Fast AI', balanced: 'Balanced AI', best: 'Premium AI' };

export default function ImageWorkspace() {
  const localize = useLocalize();
  const { isAuthenticated } = useAuthContext();

  const [preset, setPreset] = useState<MediaPresetId | undefined>();
  const [quality, setQuality] = useState<MediaQuality>('balanced');
  const [style, setStyle] = useState<MediaStyle>('photo');
  const [aspectRatio, setAspectRatio] = useState<MediaAspectRatio>('1:1');
  const [numImages, setNumImages] = useState<NumImages>(1);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<number | null>(null);
  const [cfg, setCfg] = useState(7);
  const [steps, setSteps] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos'>('images');
  const [generatedImages, setGeneratedImages] = useState<MediaResultImage[]>([]);
  const [status, setStatus] = useState<'idle' | 'queued' | 'preparing' | 'generating' | 'upscaling' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const { data: presetsData } = useGetMediaPresets({ enabled: isAuthenticated });
  const { data: creditCosts } = useGetMediaCreditCosts({ enabled: isAuthenticated });
  const { data: historyData, refetch: refetchHistory } = useGetMediaHistory(
    { page: 1, limit: 100, type: filterType === 'all' ? undefined : filterType, favorite: showFavoritesOnly ? 'true' : undefined, search: searchQuery || undefined },
    { enabled: isAuthenticated },
  );

  const generateMutation = useGenerateMediaMutation('image');
  const deleteMutation = useDeleteMediaHistoryMutation();
  const favoriteMutation = useToggleMediaFavoriteMutation();
  const upscaleMutation = useUpscaleImageMutation();
  const removeBgMutation = useRemoveBackgroundMutation();
  const variationsMutation = useCreateVariationsMutation();

  const creditCost = MEDIA_CREDIT_COSTS.image[quality];

  useEffect(() => {
    if (preset) {
      const p = MEDIA_PRESETS.find((pr) => pr.id === preset);
      if (p) {
        if (p.recommendedStyle) { setStyle(p.recommendedStyle); }
        if (p.recommendedAspectRatio) { setAspectRatio(p.recommendedAspectRatio); }
      }
    }
  }, [preset]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) { return; }
    setGeneratedImages([]);
    setStatus('queued');
    setError(null);
    generateMutation.mutate(
      { preset, quality, style, aspectRatio, numImages, prompt, negativePrompt, seed, cfg, steps },
      {
        onSuccess: (data) => {
          if (data.images) {
            setGeneratedImages(data.images);
            setStatus('completed');
          }
          setActiveHistoryId(data.historyId);
        },
        onError: (err) => {
          setError(err.message);
          setStatus('failed');
        },
      },
    );
  }, [prompt, preset, quality, style, aspectRatio, numImages, negativePrompt, seed, cfg, steps, generateMutation]);

  const handleDelete = useCallback((id: string) => { deleteMutation.mutate(id); }, [deleteMutation]);
  const handleToggleFavorite = useCallback((id: string) => { favoriteMutation.mutate(id); }, [favoriteMutation]);

  const handleSelectHistory = useCallback((entry: MediaHistoryEntry) => {
    setPrompt(entry.prompt);
    setNegativePrompt(entry.negativePrompt || '');
    setAspectRatio((entry.aspectRatio || '1:1') as MediaAspectRatio);
    if (entry.preset) { setPreset(entry.preset as MediaPresetId); }
    if (entry.style) { setStyle(entry.style as MediaStyle); }
    setQuality((entry.quality || 'balanced') as MediaQuality);
    setSeed(entry.seed ?? null);
    setGeneratedImages(entry.images || []);
    setStatus('completed');
  }, []);

  const handleDownload = useCallback(async (img: MediaResultImage) => {
    const base = window.location.origin;
    const url = img.filepath.startsWith('http') ? img.filepath : `${base}${img.filepath}`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `image-${img.fileId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch { window.open(url, '_blank'); }
  }, []);

  const handleUpscale = useCallback((historyId: string, imageId: string) => {
    upscaleMutation.mutate({ historyId, imageId });
  }, [upscaleMutation]);

  const handleRemoveBg = useCallback((historyId: string, imageId: string) => {
    removeBgMutation.mutate({ historyId, imageId });
  }, [removeBgMutation]);

  const handleVariations = useCallback((historyId: string, imageId: string) => {
    variationsMutation.mutate({ historyId, imageId });
  }, [variationsMutation]);

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3 sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary">{localize('com_nav_image_gen')}</h1>
        <div className="flex items-center gap-3">
          {creditCosts && (
            <span className="text-sm text-text-secondary">
              Credit cost: <strong className="text-text-primary">{creditCost}</strong>
            </span>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-lg border border-border-light px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover"
          >
            {showHistory ? localize('com_ui_hide_history') : localize('com_ui_show_history')}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {showHistory && (
          <div className="w-72 shrink-0 overflow-y-auto border-r border-border-light bg-surface-secondary">
            <MediaHistory
              records={historyData?.records || []}
              onSelect={handleSelectHistory}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
            />
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 p-4 sm:p-6 lg:p-8">
            <div className="rounded-xl border border-border-light bg-surface-primary-alt p-5">
              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Preset</label>
                <div className="flex flex-wrap gap-2">
                  {MEDIA_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPreset(preset === p.id ? undefined : p.id)}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        preset === p.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'border-border-light bg-surface-tertiary text-text-secondary hover:bg-surface-hover'
                      }`}
                    >
                      <span>{p.icon}</span> {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Quality & Style
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value as MediaQuality)}
                      className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    >
                      {QUALITY_OPTIONS.map((q) => (
                        <option key={q.key} value={q.key}>{q.icon} {q.label} ({creditCosts?.image?.[q.key] ?? MEDIA_CREDIT_COSTS.image[q.key]} cr)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value as MediaStyle)}
                      className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    >
                      {STYLE_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as MediaAspectRatio)}
                    className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                  >
                    {ASPECT_RATIOS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <div>
                    <select
                      value={numImages}
                      onChange={(e) => setNumImages(parseInt(e.target.value) as NumImages)}
                      className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    >
                      {NUM_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n} image{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <PromptBox
                prompt={prompt}
                onChange={setPrompt}
                onGenerate={handleGenerate}
                isGenerating={status === 'generating' || status === 'queued' || status === 'preparing' || status === 'upscaling'}
              />

              <div className="mt-3">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Advanced
                </button>
                {showAdvanced && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-text-secondary">
                        Negative Prompt
                      </label>
                      <input
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none"
                        placeholder="What to avoid..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-text-secondary">
                        Seed ({seed ?? 'random'})
                      </label>
                      <input
                        type="number"
                        value={seed ?? ''}
                        onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-xs text-text-primary focus:outline-none"
                        placeholder="Leave empty for random"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-text-secondary">
                        CFG Scale ({cfg})
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        step={0.5}
                        value={cfg}
                        onChange={(e) => setCfg(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-text-secondary">
                        Steps ({steps})
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={50}
                        step={5}
                        value={steps}
                        onChange={(e) => setSteps(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ProgressCard
              status={status}
              progressPct={
                status === 'queued' ? 10 : status === 'preparing' ? 30 : status === 'generating' ? 60 : status === 'upscaling' ? 85 : undefined
              }
              estimatedTime={quality === 'fast' ? '5-10s' : quality === 'balanced' ? '15-30s' : '30-60s'}
              onCancel={() => activeHistoryId && setActiveHistoryId(null)}
              onRetry={handleGenerate}
              error={error}
            />

            {generatedImages.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-text-primary">
                  Results ({generatedImages.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {generatedImages.map((img) => (
                    <ImageResultCard
                      key={img.fileId}
                      image={img}
                      historyId={activeHistoryId || ''}
                      favorite={false}
                      onDownload={handleDownload}
                      onReuse={() => setPrompt(prompt)}
                      onUpscale={handleUpscale}
                      onRemoveBg={handleRemoveBg}
                      onVariations={handleVariations}
                      onFavoriteToggle={() => { }}
                      onDelete={() => { }}
                    />
                  ))}
                </div>
              </div>
            )}

            {generatedImages.length === 0 && status === 'idle' && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-light bg-surface-primary-alt p-12">
                <Image className="mb-3 h-10 w-10 text-text-secondary" />
                <p className="text-sm text-text-secondary">Enter a prompt and generate your first image</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
