import { useRecoilState } from 'recoil';
import PageLayout from '~/components/PageLayout';
import { useGetEndpointsQuery } from '~/data-provider';
import store from '~/store';
import { useLocalize } from '~/hooks';

const DEFAULT_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

export default function AIPreferencesPage() {
  const localize = useLocalize();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const [conversationMode, setConversationMode] = useRecoilState(store.conversationMode);
  const [autoScroll, setAutoScroll] = useRecoilState(store.autoScroll);

  const models = DEFAULT_MODELS;

  return (
    <PageLayout title="AI Preferences">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border-light p-4">
          <p className="mb-3 text-sm font-medium text-text-primary">Default Model</p>
          <select
            className="w-full rounded-lg border border-border-light bg-surface-hover px-3 py-2 text-sm text-text-primary"
            defaultValue=""
          >
            <option value="" disabled>
              Select a model
            </option>
            {models.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-lg border border-border-light p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Conversation Mode</p>
              <p className="text-xs text-text-secondary">
                Enable continuous conversation with voice input
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={conversationMode === true}
              onClick={() => setConversationMode(!conversationMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                conversationMode ? 'bg-primary' : 'bg-surface-hover'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  conversationMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-border-light p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Auto-Scroll</p>
              <p className="text-xs text-text-secondary">
                Automatically scroll to the latest message
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoScroll === true}
              onClick={() => setAutoScroll(!autoScroll)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoScroll ? 'bg-primary' : 'bg-surface-hover'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoScroll ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
