import { useState, useCallback, useEffect } from 'react';
import { apiBaseUrl } from 'librechat-data-provider';
import type { TVideoGenProvider, TVideoGenVideo, TVideoGenHistoryEntry } from 'librechat-data-provider';
import {
  useGetVideoGenProviders,
  useGetVideoGenHistory,
  useGenerateVideoMutation,
  useDeleteVideoGenHistoryMutation,
  useToggleVideoGenFavoriteMutation,
  useGetVideoGenStatus,
} from '~/data-provider';
import { useAuthContext } from '~/hooks';
import { useLocalize } from '~/hooks';
import {
  Sparkles,
  Download,
  Trash2,
  Heart,
  HeartOff,
  Clock,
  Search,
  Star,
  Video,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@librechat/client';

const PROGRESS_MESSAGES = [
  'Analyzing your prompt...',
  'Setting up the scene...',
  'Rendering frames...',
  'Adding motion...',
  'Encoding video...',
  'Almost done...',
];

export default function VideoWorkspace() {
  const localize = useLocalize();
  const { isAuthenticated } = useAuthContext();

  const [provider, setProvider] = useState('fal');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [quality, setQuality] = useState('standard');
  const [showHistory, setShowHistory] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<TVideoGenVideo[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState(0);

  const { data: providers } = useGetVideoGenProviders({ enabled: isAuthenticated });
  const { data: historyData, refetch: refetchHistory } = useGetVideoGenHistory(
    { page: 1, limit: 100, favorite: showFavoritesOnly ? 'true' : undefined },
    { enabled: isAuthenticated },
  );

  const { data: statusData } = useGetVideoGenStatus(activeHistoryId);

  const generateMutation = useGenerateVideoMutation();
  const deleteMutation = useDeleteVideoGenHistoryMutation();
  const favoriteMutation = useToggleVideoGenFavoriteMutation();

  const currentProvider = providers?.find((p) => p.key === provider);
  const currentModels = currentProvider?.models || [];

  useEffect(() => {
    if (currentModels.length > 0 && !model) {
      setModel(currentModels[0].id);
    }
  }, [currentModels, model]);

  useEffect(() => {
    if (statusData) {
      if (statusData.status === 'completed' && statusData.videos.length > 0) {
        setGeneratedVideos(statusData.videos);
        setActiveHistoryId(null);
      } else if (statusData.status === 'failed') {
        setActiveHistoryId(null);
      }
    }
  }, [statusData]);

  useEffect(() => {
    if (generateMutation.isLoading) {
      const interval = setInterval(() => {
        setProgressMsg((p) => (p + 1) % PROGRESS_MESSAGES.length);
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setProgressMsg(0);
    }
  }, [generateMutation.isLoading]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      return;
    }
    setGeneratedVideos([]);
    generateMutation.mutate(
      {
        provider,
        model,
        prompt,
        duration,
        aspectRatio,
        quality,
      },
      {
        onSuccess: (data) => {
          setGeneratedVideos(data.videos);
          if (data.historyId) {
            setActiveHistoryId(data.historyId);
          }
        },
      },
    );
  }, [prompt, provider, model, duration, aspectRatio, quality, generateMutation]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      favoriteMutation.mutate(id);
    },
    [favoriteMutation],
  );

  const handleSelectHistory = useCallback((entry: TVideoGenHistoryEntry) => {
    setPrompt(entry.prompt);
    setProvider(entry.provider);
    setModel(entry.model);
    setDuration(entry.duration);
    setAspectRatio(entry.aspectRatio);
    setQuality(entry.quality);
    setGeneratedVideos(entry.videos);
    if (entry.status === 'processing' || entry.status === 'pending') {
      setActiveHistoryId(entry._id);
    }
  }, []);

  const getVideoSrc = (filepath: string) => {
    if (filepath.startsWith('http') || filepath.startsWith('data:')) {
      return filepath;
    }
    return `${apiBaseUrl()}${filepath}`;
  };

  const handleDownload = async (vid: TVideoGenVideo) => {
    const url = getVideoSrc(vid.filepath);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `video-${vid.fileId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const isGenerating = generateMutation.isLoading || activeHistoryId != null;

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3 sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary">
          {localize('com_nav_video_gen')}
        </h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="rounded-lg border border-border-light px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover"
        >
          {showHistory ? localize('com_ui_hide_history') : localize('com_ui_show_history')}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        {showHistory && (
          <div className="w-72 shrink-0 overflow-y-auto border-r border-border-light bg-surface-secondary">
            <div className="flex h-full flex-col">
              <div className="border-b border-border-light px-3 py-2.5">
                <h3 className="text-sm font-semibold text-text-primary">
                  {localize('com_ui_history')}
                </h3>
              </div>

              <div className="border-b border-border-light px-3 py-2">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
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

              <div className="flex-1 overflow-y-auto">
                {!historyData?.records?.length ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <Clock className="h-8 w-8 text-text-secondary" />
                    <p className="text-xs text-text-secondary">
                      {localize('com_ui_no_history')}
                    </p>
                  </div>
                ) : (
                  historyData.records.map((entry) => (
                    <div
                      key={entry._id}
                      className="group cursor-pointer border-b border-border-light px-3 py-2.5 transition-colors hover:bg-surface-hover"
                      onClick={() => handleSelectHistory(entry)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-tertiary">
                          {entry.status === 'completed' && entry.videos[0] ? (
                            <video
                              src={getVideoSrc(entry.videos[0].filepath)}
                              className="h-full w-full rounded-md object-cover"
                              preload="none"
                            />
                          ) : entry.status === 'failed' ? (
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          ) : (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-text-primary">
                            {entry.prompt}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-secondary">
                            <span>{entry.provider}</span>
                            <span>·</span>
                            <span
                              className={
                                entry.status === 'completed'
                                  ? 'text-green-500'
                                  : entry.status === 'failed'
                                    ? 'text-red-500'
                                    : 'text-blue-500'
                              }
                            >
                              {entry.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(entry._id); }}
                            className="rounded p-1 text-text-secondary hover:bg-surface-tertiary hover:text-red-500"
                          >
                            {entry.favorite ? (
                              <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                            ) : (
                              <HeartOff className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}
                            className="rounded p-1 text-text-secondary hover:bg-surface-tertiary hover:text-red-500"
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
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {/* Prompt + Settings */}
            <div className="rounded-xl border border-border-light bg-surface-primary-alt p-5">
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  {localize('com_ui_prompt')}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleGenerate(); } }}
                  placeholder={localize('com_ui_video_prompt_placeholder')}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {localize('com_ui_provider')}
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => { setProvider(e.target.value); setModel(''); }}
                    className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    {providers?.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.icon} {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {localize('com_ui_model')}
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    {currentModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {localize('com_ui_duration')} ({duration}s)
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={10}
                    step={1}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {localize('com_ui_aspect_ratio')}
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    {['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {localize('com_ui_quality')}
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="standard">{localize('com_ui_standard')}</option>
                    <option value="premium">{localize('com_ui_premium')}</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? localize('com_ui_generating') : localize('com_ui_generate')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Generation Progress */}
            {isGenerating && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-900/20">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  {PROGRESS_MESSAGES[progressMsg]}
                </p>
                <p className="mt-1 text-xs text-blue-500 dark:text-blue-300">
                  {localize('com_ui_video_gen_progress')}
                </p>
              </div>
            )}

            {/* Error */}
            {generateMutation.error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {generateMutation.error.message}
              </div>
            )}

            {/* Output */}
            {!isGenerating && generatedVideos.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-text-primary">
                  {localize('com_ui_results')} ({generatedVideos.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {generatedVideos.map((vid, idx) => (
                    <div
                      key={vid.fileId}
                      className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary shadow-sm"
                    >
                      <div className="aspect-video overflow-hidden bg-black">
                        <video
                          src={getVideoSrc(vid.filepath)}
                          controls
                          className="h-full w-full"
                          preload="metadata"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleDownload(vid)}
                          className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 shadow backdrop-blur hover:bg-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {localize('com_ui_download')}
                        </button>
                      </div>
                      {(vid.duration || (vid.width && vid.height)) && (
                        <div className="absolute left-2 top-2 flex gap-1.5">
                          {vid.width && vid.height && (
                            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                              {vid.width}×{vid.height}
                            </span>
                          )}
                          {vid.duration && (
                            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                              {vid.duration}s
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isGenerating && generatedVideos.length === 0 && !generateMutation.error && (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-light bg-surface-primary-alt p-12">
                <Video className="mb-3 h-10 w-10 text-text-secondary" />
                <p className="text-sm text-text-secondary">{localize('com_ui_video_gen_empty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
