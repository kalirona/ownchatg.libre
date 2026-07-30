import { Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useLocalize } from '~/hooks';
import type { GenStatus } from 'librechat-data-provider';

type ProgressCardProps = {
  status: GenStatus;
  progressPct?: number;
  estimatedTime?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  error?: string | null;
};

const STEPS: { key: GenStatus; labelKey: string }[] = [
  { key: 'queued', labelKey: 'com_ui_queued' },
  { key: 'preparing', labelKey: 'com_ui_preparing' },
  { key: 'generating', labelKey: 'com_ui_generating' },
  { key: 'upscaling', labelKey: 'com_ui_upscaling' },
  { key: 'completed', labelKey: 'com_ui_completed' },
];

export default function ProgressCard({
  status,
  progressPct,
  estimatedTime,
  onCancel,
  onRetry,
  error,
}: ProgressCardProps) {
  const localize = useLocalize();

  if (status === 'failed') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {localize('com_ui_generation_failed')}
            </p>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            {localize('com_ui_retry')}
          </button>
        )}
      </div>
    );
  }

  if (status === 'idle' || status === 'completed') { return null; }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="mb-4 flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {localize('com_ui_generating')}...
          </p>
          {estimatedTime && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-500">
              <Clock className="h-3 w-3" /> ~{estimatedTime}
            </p>
          )}
        </div>
      </div>

      {progressPct != null && (
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {STEPS.map((step, i) => {
            const currentIdx = STEPS.findIndex((s) => s.key === status);
            const isActive = i <= currentIdx && status !== 'idle';
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-200 text-blue-400 dark:bg-blue-800 dark:text-blue-600'
                  }`}
                >
                  {isActive ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] ${
                    isActive
                      ? 'font-medium text-blue-700 dark:text-blue-300'
                      : 'text-blue-400 dark:text-blue-600'
                  }`}
                >
                  {step.labelKey}
                </span>
              </div>
            );
          })}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-lg bg-white/80 px-2.5 py-1 text-[10px] font-medium text-gray-600 shadow-sm hover:bg-white dark:bg-gray-800/80 dark:text-gray-400"
          >
            {localize('com_ui_cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
