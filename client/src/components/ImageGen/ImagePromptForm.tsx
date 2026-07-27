import { Sparkles } from 'lucide-react';
import { Button } from '@librechat/client';
import type { TImageGenProvider, TImageGenModel } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

interface ImagePromptFormProps {
  prompt: string;
  negativePrompt: string;
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  provider: string;
  providers: TImageGenProvider[];
  onProviderChange: (provider: string) => void;
  model: string;
  models: TImageGenModel[];
  onModelChange: (model: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  seed: number | null;
  onSeedChange: (seed: number | null) => void;
  numImages: number;
  onNumImagesChange: (count: number) => void;
}

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];

export function ImagePromptForm({
  prompt,
  negativePrompt,
  onPromptChange,
  onNegativePromptChange,
  onGenerate,
  isGenerating,
  provider,
  providers,
  onProviderChange,
  model,
  models,
  onModelChange,
  aspectRatio,
  onAspectRatioChange,
  seed,
  onSeedChange,
  numImages,
  onNumImagesChange,
}: ImagePromptFormProps) {
  const localize = useLocalize();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="rounded-xl border border-border-light bg-surface-primary-alt p-5">
      {/* Prompt */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">
          {localize('com_ui_prompt')}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={localize('com_ui_image_prompt_placeholder')}
          rows={3}
          className="w-full resize-none rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
      </div>

      {/* Negative Prompt */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">
          {localize('com_ui_negative_prompt')}
        </label>
        <textarea
          value={negativePrompt}
          onChange={(e) => onNegativePromptChange(e.target.value)}
          placeholder={localize('com_ui_negative_prompt_placeholder')}
          rows={2}
          className="w-full resize-none rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
      </div>

      {/* Settings Row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Provider */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {localize('com_ui_provider')}
          </label>
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            {providers.map((p) => (
              <option key={p.key} value={p.key}>
                {p.icon} {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {localize('com_ui_model')}
          </label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {localize('com_ui_aspect_ratio')}
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value)}
            className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            {ASPECT_RATIOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Seed */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {localize('com_ui_seed')}
          </label>
          <input
            type="number"
            value={seed ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onSeedChange(val ? parseInt(val, 10) : null);
            }}
            placeholder={localize('com_ui_random')}
            className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        {/* Num Images */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {localize('com_ui_count')}
          </label>
          <select
            value={numImages}
            onChange={(e) => onNumImagesChange(parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <div className="flex items-end">
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? localize('com_ui_generating') : localize('com_ui_generate')}
          </Button>
        </div>
      </div>

      {isGenerating && (
        <div className="mt-2 text-xs text-text-secondary">
          {localize('com_ui_image_gen_progress')}
        </div>
      )}
    </div>
  );
}
