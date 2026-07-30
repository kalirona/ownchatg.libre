import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Video } from 'lucide-react';
import type {
  MediaPresetId, VideoQuality, MediaAspectRatio, CameraMotion,
  MotionStrength, VideoDuration, MediaResultVideo, MediaHistoryEntry,
} from 'librechat-data-provider';
import { MEDIA_PRESETS, MEDIA_CREDIT_COSTS } from 'librechat-data-provider';
import {
  useGetMediaPresets, useGetMediaCreditCosts,
  useGetMediaHistory, useGenerateMediaMutation,
  useDeleteMediaHistoryMutation, useToggleMediaFavoriteMutation,
} from '~/data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import { PromptBox, ProgressCard, VideoResultCard, MediaHistory } from '~/components/Media';

const QUALITY_OPTIONS: { key: VideoQuality; label: string; icon: string }[] = [
  { key: 'fast', label: '⚡ Fast AI', icon: '⚡' },
  { key: 'standard', label: '✨ Balanced AI', icon: '✨' },
  { key: 'cinema', label: '🏆 Premium AI', icon: '🏆' },
];

const ASPECT_RATIOS: MediaAspectRatio[] = ['1:1', '16:9', '9:16', '4:5', '3:2'];
const DURATIONS: VideoDuration[] = [5, 10, 15];
const MOTION_STRENGTHS: { key: MotionStrength; label: string }[] = [
  { key: 'low', label: 'Subtle' },
  { key: 'medium', label: 'Moderate' },
  { key: 'high', label: 'Dynamic' },
];
const CAMERA_MOTIONS: { key: CameraMotion; label: string }[] = [
  { key: 'static', label: 'Static' },
  { key: 'pan', label: 'Pan' },
  { key: 'zoom', label: 'Zoom' },
  { key: 'orbit', label: 'Orbit' },
];

const QUALITY_LABELS: Record<VideoQuality, string> = { fast: 'Fast AI', standard: 'Balanced AI', cinema: 'Premium AI' };

export default function VideoWorkspace() {
  const localize = useLocalize();
  const { isAuthenticated } = useAuthContext();

  const [preset, setPreset] = useState<MediaPresetId | undefined>();
  const [quality, setQuality] = useState<VideoQuality>('standard');
  const [duration, setDuration] = useState<VideoDuration>(5);
  const [aspectRatio, setAspectRatio] = useState<MediaAspectRatio>('16:9');
  const [prompt, setPrompt] = useState('');
  const [motionStrength, setMotionStrength] = useState<MotionStrength>('medium');
  const [cameraMotion, setCameraMotion] = useState<CameraMotion>('static');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos'>('videos');
  const [generatedVideos, setGeneratedVideos] = useState<MediaResultVideo[]>([]);
  const [status, setStatus] = useState<'idle' | 'queued' | 'preparing' | 'generating' | 'upscaling' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const { data: presetsData } = useGetMediaPresets({ enabled: isAuthenticated });
  const { data: creditCosts } = useGetMediaCreditCosts({ enabled: isAuthenticated });
  const { data: historyData, refetch: refetchHistory } = useGetMediaHistory(
    { page: 1, limit: 100, type: filterType === 'all' ? undefined : filterType, favorite: showFavoritesOnly ? 'true' : undefined, search: searchQuery || undefined },
    { enabled: isAuthenticated },
  );

  const generateMutation = useGenerateMediaMutation('video');
  const deleteMutation = useDeleteMediaHistoryMutation();
  const favoriteMutation = useToggleMediaFavoriteMutation();

  const creditCost = MEDIA_CREDIT_COSTS.video[quality] || MEDIA_CREDIT_COSTS.video.standard;

  useEffect(() => {
    if (preset) {
      const p = MEDIA_PRESETS.find((pr) => pr.id === preset);
      if (p && p.recommendedAspectRatio) { setAspectRatio(p.recommendedAspectRatio); }
    }
  }, [preset]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) { return; }
    setGeneratedVideos([]);
    setStatus('queued');
    setError(null);
    generateMutation.mutate(
      { preset, quality, duration, aspectRatio, prompt, motionStrength, cameraMotion, negativePrompt, seed },
      {
        onSuccess: (data) => {
          if (data.videos) {
            setGeneratedVideos(data.videos);
            setStatus('completed');
          }
          if (data.status === 'queued' || data.status === 'generating') {
            setStatus(data.status as any);
          }
          setActiveHistoryId(data.historyId);
        },
        onError: (err) => {
          setError(err.message);
          setStatus('failed');
        },
      },
    );
  }, [prompt, preset, quality, duration, aspectRatio, motionStrength, cameraMotion, negativePrompt, seed, generateMutation]);

  const handleDelete = useCallback((id: string) => { deleteMutation.mutate(id); }, [deleteMutation]);
  const handleToggleFavorite = useCallback((id: string) => { favoriteMutation.mutate(id); }, [favoriteMutation]);

  const handleSelectHistory = useCallback((entry: MediaHistoryEntry) => {
    setPrompt(entry.prompt);
    setNegativePrompt(entry.negativePrompt || '');
    setAspectRatio((entry.aspectRatio || '16:9') as MediaAspectRatio);
    if (entry.preset) { setPreset(entry.preset as MediaPresetId); }
    setQuality((entry.quality || 'standard') as VideoQuality);
    setSeed(entry.seed ?? null);
    setGeneratedVideos(entry.videos || []);
    setStatus('completed');
  }, []);

  const handleDownload = useCallback(async (vid: MediaResultVideo) => {
    const base = window.location.origin;
    const url = vid.filepath.startsWith('http') ? vid.filepath : `${base}${vid.filepath}`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `video-${vid.fileId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch { window.open(url, '_blank'); }
  }, []);

  const isGenerating = status === 'generating' || status === 'queued' || status === 'preparing';

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3 sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary">{localize('com_nav_video_gen')}</h1>
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
                  Quality & Settings
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-text-secondary">Quality</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value as VideoQuality)}
                      className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    >
                      {QUALITY_OPTIONS.map((q) => (
                        <option key={q.key} value={q.key}>{q.icon} {q.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-text-secondary">Duration ({duration}s)</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) as VideoDuration)}
                      className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    >
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>{d} sec</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-text-secondary">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as MediaAspectRatio)}
                      className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    >
                      {ASPECT_RATIOS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-text-secondary">Camera Motion</label>
                    <select
                      value={cameraMotion}
                      onChange={(e) => setCameraMotion(e.target.value as CameraMotion)}
                      className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    >
                      {CAMERA_MOTIONS.map((cm) => (
                        <option key={cm.key} value={cm.key}>{cm.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-text-secondary">Motion Strength</label>
                    <select
                      value={motionStrength}
                      onChange={(e) => setMotionStrength(e.target.value as MotionStrength)}
                      className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    >
                      {MOTION_STRENGTHS.map((ms) => (
                        <option key={ms.key} value={ms.key}>{ms.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <PromptBox
                prompt={prompt}
                onChange={setPrompt}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                placeholder={localize('com_ui_video_prompt_placeholder')}
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
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                  </div>
                )}
              </div>
            </div>

            <ProgressCard
              status={status}
              progressPct={
                status === 'queued' ? 5 : status === 'preparing' ? 20 : status === 'generating' ? 50 : status === 'upscaling' ? 80 : undefined
              }
              estimatedTime={quality === 'fast' ? '10-20s' : quality === 'standard' ? '30-60s' : '60-120s'}
              onCancel={() => activeHistoryId && setActiveHistoryId(null)}
              onRetry={handleGenerate}
              error={error}
            />

            {generatedVideos.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-text-primary">
                  Results ({generatedVideos.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {generatedVideos.map((vid) => (
                    <VideoResultCard
                      key={vid.fileId}
                      video={vid}
                      historyId={activeHistoryId || ''}
                      favorite={false}
                      onDownload={handleDownload}
                      onRegenerate={handleGenerate}
                      onFavoriteToggle={() => { }}
                      onDelete={() => { }}
                    />
                  ))}
                </div>
              </div>
            )}

            {generatedVideos.length === 0 && status === 'idle' && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-light bg-surface-primary-alt p-12">
                <Video className="mb-3 h-10 w-10 text-text-secondary" />
                <p className="text-sm text-text-secondary">Enter a prompt and generate your first video</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
