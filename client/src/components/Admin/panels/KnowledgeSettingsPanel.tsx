import { useState, useEffect } from 'react';
import {
  Save, Database, Cpu, FileText, Sliders, HardDrive,
  LucideIcon, Loader2, CheckCircle2,
} from 'lucide-react';
import { useLocalize } from '~/hooks';
import { useGetKnowledgeAdminSettings, useUpdateKnowledgeAdminSettingsMutation } from '~/data-provider';

const EMBEDDING_PROVIDERS = ['openai', 'voyage', 'gemini', 'cohere', 'openrouter'];
const EMBEDDING_MODELS: Record<string, string[]> = {
  openai: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
  voyage: ['voyage-3', 'voyage-3-lite', 'voyage-code-3'],
  gemini: ['text-embedding-004', 'embedding-001'],
  cohere: ['embed-english-v3.0', 'embed-multilingual-v3.0'],
  openrouter: ['openai/text-embedding-3-small', 'cohere/embed-english-v3.0'],
};
const VECTOR_DBS = ['mongodb', 'pgvector', 'qdrant', 'pinecone'];
const DEFAULT_TYPES = ['pdf', 'docx', 'txt', 'md', 'csv', 'json'];

export default function KnowledgeSettingsPanel() {
  const localize = useLocalize();
  const { data, isLoading } = useGetKnowledgeAdminSettings();
  const updateMutation = useUpdateKnowledgeAdminSettingsMutation();

  const [settings, setSettings] = useState({
    embeddingProvider: 'openai',
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 800,
    chunkOverlap: 150,
    maxFileSize: 100 * 1024 * 1024,
    ocrEnabled: false,
    supportedTypes: DEFAULT_TYPES,
    vectorDatabase: 'mongodb',
    reindexWorkers: 3,
    storageLimits: [
      { plan: 'Starter', limitBytes: 2 * 1024 * 1024 * 1024 },
      { plan: 'Pro', limitBytes: 25 * 1024 * 1024 * 1024 },
      { plan: 'Agency', limitBytes: 100 * 1024 * 1024 * 1024 },
    ],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings({
        embeddingProvider: data.settings.embeddingProvider || 'openai',
        embeddingModel: data.settings.embeddingModel || 'text-embedding-3-small',
        chunkSize: data.settings.chunkSize || 800,
        chunkOverlap: data.settings.chunkOverlap || 150,
        maxFileSize: data.settings.maxFileSize || 100 * 1024 * 1024,
        ocrEnabled: data.settings.ocrEnabled || false,
        supportedTypes: data.settings.supportedTypes || DEFAULT_TYPES,
        vectorDatabase: data.settings.vectorDatabase || 'mongodb',
        reindexWorkers: data.settings.reindexWorkers || 3,
        storageLimits: data.settings.storageLimits || settings.storageLimits,
      });
    }
  }, [data]);

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const toggleType = (t: string) => {
    setSettings((prev) => ({
      ...prev,
      supportedTypes: prev.supportedTypes.includes(t)
        ? prev.supportedTypes.filter((x) => x !== t)
        : [...prev.supportedTypes, t],
    }));
  };

  const updateStorageLimit = (plan: string, limitBytes: number) => {
    setSettings((prev) => ({
      ...prev,
      storageLimits: prev.storageLimits.map((sl) =>
        sl.plan === plan ? { ...sl, limitBytes } : sl,
      ),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Knowledge Settings</h2>
        <button
          onClick={handleSave}
          disabled={updateMutation.isLoading}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {updateMutation.isSuccess ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Embedding Provider */}
      <Section icon={Cpu} title="Embedding Provider">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Provider</label>
            <select
              value={settings.embeddingProvider}
              onChange={(e) => setSettings((p) => ({ ...p, embeddingProvider: e.target.value, embeddingModel: EMBEDDING_MODELS[e.target.value]?.[0] || '' }))}
              className="w-full rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary"
            >
              {EMBEDDING_PROVIDERS.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Model</label>
            <select
              value={settings.embeddingModel}
              onChange={(e) => setSettings((p) => ({ ...p, embeddingModel: e.target.value }))}
              className="w-full rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary"
            >
              {(EMBEDDING_MODELS[settings.embeddingProvider] || []).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Chunking */}
      <Section icon={Sliders} title="Chunking">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Chunk Size</label>
            <input
              type="number"
              value={settings.chunkSize}
              onChange={(e) => setSettings((p) => ({ ...p, chunkSize: parseInt(e.target.value) || 800 }))}
              className="w-full rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Overlap</label>
            <input
              type="number"
              value={settings.chunkOverlap}
              onChange={(e) => setSettings((p) => ({ ...p, chunkOverlap: parseInt(e.target.value) || 150 }))}
              className="w-full rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
      </Section>

      {/* File Handling */}
      <Section icon={FileText} title="File Handling">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Max File Size (MB)</label>
            <input
              type="number"
              value={Math.round(settings.maxFileSize / (1024 * 1024))}
              onChange={(e) => setSettings((p) => ({ ...p, maxFileSize: (parseInt(e.target.value) || 100) * 1024 * 1024 }))}
              className="w-full rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Supported Types</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    settings.supportedTypes.includes(t)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-border-light text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  .{t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.ocrEnabled}
              onChange={(e) => setSettings((p) => ({ ...p, ocrEnabled: e.target.checked }))}
              className="h-4 w-4 rounded border-border-light text-blue-600"
            />
            <span className="text-xs text-text-primary">Enable OCR</span>
          </div>
        </div>
      </Section>

      {/* Vector Database */}
      <Section icon={Database} title="Vector Database">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Database</label>
            <select
              value={settings.vectorDatabase}
              onChange={(e) => setSettings((p) => ({ ...p, vectorDatabase: e.target.value }))}
              className="w-full rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary"
            >
              {VECTOR_DBS.map((db) => (
                <option key={db} value={db}>{db.charAt(0).toUpperCase() + db.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Reindex Workers</label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.reindexWorkers}
              onChange={(e) => setSettings((p) => ({ ...p, reindexWorkers: parseInt(e.target.value) || 3 }))}
              className="w-full rounded-lg border border-border-light bg-surface-tertiary px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
      </Section>

      {/* Storage Limits */}
      <Section icon={HardDrive} title="Storage Limits (Per Plan)">
        <div className="space-y-2">
          {settings.storageLimits.map((sl) => (
            <div key={sl.plan} className="flex items-center gap-3">
              <span className="w-20 text-xs font-medium text-text-primary">{sl.plan}</span>
              <input
                type="number"
                value={Math.round(sl.limitBytes / (1024 * 1024 * 1024))}
                onChange={(e) => updateStorageLimit(sl.plan, (parseInt(e.target.value) || 0) * 1024 * 1024 * 1024)}
                className="flex-1 rounded-lg border border-border-light bg-surface-tertiary px-3 py-1.5 text-sm text-text-primary"
              />
              <span className="text-xs text-text-secondary">GB</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-surface-primary p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-text-secondary" />
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}
