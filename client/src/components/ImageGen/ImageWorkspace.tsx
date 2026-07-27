import { useState, useCallback, useEffect } from 'react';
import type { TImageGenProvider, TImageGenHistoryEntry, TImageGenImage } from 'librechat-data-provider';
import {
  useGetImageGenProviders,
  useGetImageGenHistory,
  useGenerateImagesMutation,
  useDeleteImageGenHistoryMutation,
  useToggleImageGenFavoriteMutation,
  useGetUserBalance,
} from '~/data-provider';
import { useAuthContext } from '~/hooks';
import { useLocalize } from '~/hooks';
import { ImagePromptForm } from './ImagePromptForm';
import { ImageSettings } from './ImageSettings';
import { ImageOutput } from './ImageOutput';
import { ImageHistory } from './ImageHistory';

export default function ImageWorkspace() {
  const localize = useLocalize();
  const { isAuthenticated } = useAuthContext();

  const [provider, setProvider] = useState('flux');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [seed, setSeed] = useState<number | null>(null);
  const [numImages, setNumImages] = useState(1);
  const [showHistory, setShowHistory] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<TImageGenImage[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data: providers } = useGetImageGenProviders({
    enabled: isAuthenticated,
  });
  const { data: balanceData } = useGetUserBalance({
    enabled: isAuthenticated,
  });
  const { data: historyData, refetch: refetchHistory } = useGetImageGenHistory(
    { page: 1, limit: 100, favorite: showFavoritesOnly ? 'true' : undefined },
    { enabled: isAuthenticated },
  );

  const generateMutation = useGenerateImagesMutation();
  const deleteMutation = useDeleteImageGenHistoryMutation();
  const favoriteMutation = useToggleImageGenFavoriteMutation();

  const currentProvider = providers?.find((p) => p.key === provider);
  const currentModels = currentProvider?.models || [];

  useEffect(() => {
    if (currentModels.length > 0 && !model) {
      setModel(currentModels[0].id);
    }
  }, [currentModels, model]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      return;
    }
    setGeneratedImages([]);
    generateMutation.mutate(
      {
        provider,
        model,
        prompt,
        negativePrompt,
        aspectRatio,
        seed,
        numImages,
      },
      {
        onSuccess: (data) => {
          setGeneratedImages(data.images);
        },
      },
    );
  }, [prompt, provider, model, negativePrompt, aspectRatio, seed, numImages, generateMutation]);

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

  const handleSelectHistory = useCallback((entry: TImageGenHistoryEntry) => {
    setPrompt(entry.prompt);
    setNegativePrompt(entry.negativePrompt || '');
    setAspectRatio(entry.aspectRatio || '1:1');
    setProvider(entry.provider);
    setModel(entry.model);
    setSeed(entry.seed);
    setNumImages(entry.numImages);
    setGeneratedImages(entry.images);
  }, []);

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3 sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary">
          {localize('com_nav_image_gen')}
        </h1>
        <div className="flex items-center gap-3">
          {balanceData && (
            <span className="text-sm text-text-secondary">
              {localize('com_billing_current_balance')}:{' '}
              <strong className="text-text-primary">{balanceData.tokenCredits.toLocaleString()}</strong>
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
        {/* History Sidebar */}
        {showHistory && (
          <div className="w-72 shrink-0 overflow-y-auto border-r border-border-light bg-surface-secondary">
            <ImageHistory
              records={historyData?.records || []}
              onSelect={handleSelectHistory}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
              isDeleting={deleteMutation.isLoading}
              isLoading={favoriteMutation.isLoading}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {/* Prompt Form */}
            <ImagePromptForm
              prompt={prompt}
              negativePrompt={negativePrompt}
              onPromptChange={setPrompt}
              onNegativePromptChange={setNegativePrompt}
              onGenerate={handleGenerate}
              isGenerating={generateMutation.isLoading}
              provider={provider}
              providers={providers || []}
              onProviderChange={(p) => {
                setProvider(p);
                setModel('');
              }}
              model={model}
              models={currentModels}
              onModelChange={setModel}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              seed={seed}
              onSeedChange={setSeed}
              numImages={numImages}
              onNumImagesChange={setNumImages}
            />

            {/* Output */}
            <div className="mt-6">
              <ImageOutput
                images={generatedImages}
                isGenerating={generateMutation.isLoading}
                error={generateMutation.error?.message || null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
