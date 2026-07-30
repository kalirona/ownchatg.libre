import { Sparkles } from 'lucide-react';
import { Button } from '@librechat/client';
import { useLocalize } from '~/hooks';

type PromptBoxProps = {
  prompt: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  placeholder?: string;
  minRows?: number;
};

export default function PromptBox({
  prompt,
  onChange,
  onGenerate,
  isGenerating,
  placeholder,
  minRows = 3,
}: PromptBoxProps) {
  const localize = useLocalize();
  return (
    <div className="relative">
      <textarea
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onGenerate();
          }
        }}
        placeholder={placeholder || localize('com_ui_prompt_placeholder')}
        rows={minRows}
        className="w-full resize-none rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
      />
      <div className="mt-2 flex justify-end">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? localize('com_ui_generating') : localize('com_ui_generate')}
        </Button>
      </div>
    </div>
  );
}
