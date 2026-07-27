import { useLocalize } from '~/hooks';

interface ImageSettingsProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  seed: number | null;
  onSeedChange: (seed: number | null) => void;
  numImages: number;
  onNumImagesChange: (count: number) => void;
}

export function ImageSettings({
  aspectRatio,
  onAspectRatioChange,
  seed,
  onSeedChange,
  numImages,
  onNumImagesChange,
}: ImageSettingsProps) {
  const localize = useLocalize();

  return (
    <div className="flex flex-wrap gap-3">
      {/* Aspect Ratio */}
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          {localize('com_ui_aspect_ratio')}
        </label>
        <select
          value={aspectRatio}
          onChange={(e) => onAspectRatioChange(e.target.value)}
          className="rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          {['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '9:21'].map((r) => (
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
          className="w-24 rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
      </div>

      {/* Count */}
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          {localize('com_ui_count')}
        </label>
        <select
          value={numImages}
          onChange={(e) => onNumImagesChange(parseInt(e.target.value, 10))}
          className="rounded-lg border border-border-light bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
