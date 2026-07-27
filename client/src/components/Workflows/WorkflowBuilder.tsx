import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import {
  useGetWorkflow,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
} from '~/data-provider';
import type { TWorkflowStep } from 'librechat-data-provider';

const STEP_TYPES = [
  { type: 'trigger', icon: '⚡', color: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20' },
  { type: 'ai_prompt', icon: '🤖', color: 'bg-blue-100 border-blue-300 dark:bg-blue-900/20' },
  { type: 'image_generation', icon: '🖼️', color: 'bg-purple-100 border-purple-300 dark:bg-purple-900/20' },
  { type: 'video_generation', icon: '🎬', color: 'bg-pink-100 border-pink-300 dark:bg-pink-900/20' },
  { type: 'approval', icon: '✅', color: 'bg-orange-100 border-orange-300 dark:bg-orange-900/20' },
  { type: 'publish', icon: '📤', color: 'bg-green-100 border-green-300 dark:bg-green-900/20' },
  { type: 'condition', icon: '🔀', color: 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/20' },
  { type: 'delay', icon: '⏱️', color: 'bg-gray-100 border-gray-300 dark:bg-gray-700' },
  { type: 'webhook', icon: '🔗', color: 'bg-cyan-100 border-cyan-300 dark:bg-cyan-900/20' },
] as const;

const defaultStep = (type: string, order: number): TWorkflowStep => {
  const config: Record<string, unknown> = {};
  if (type === 'ai_prompt') { config.prompt = ''; config.model = ''; config.systemPrompt = ''; config.temperature = 0.7; }
  if (type === 'image_generation') { config.prompt = ''; config.model = ''; config.provider = 'fal'; config.size = '1024x1024'; }
  if (type === 'video_generation') { config.prompt = ''; config.model = ''; config.provider = 'luma'; config.duration = 5; }
  if (type === 'approval') { config.message = ''; config.approvers = []; }
  if (type === 'publish') { config.destination = ''; config.template = ''; }
  if (type === 'condition') { config.field = ''; config.operator = 'equals'; config.value = ''; }
  if (type === 'delay') { config.seconds = 60; }
  if (type === 'webhook') { config.url = ''; config.method = 'POST'; }
  return { type: type as TWorkflowStep['type'], config, label: '', order };
};

export default function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localize = useLocalize();

  const isEditing = !!id && id !== 'new';
  const { data: existing } = useGetWorkflow(id ?? '', { enabled: isEditing });
  const createMutation = useCreateWorkflowMutation();
  const updateMutation = useUpdateWorkflowMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<TWorkflowStep[]>([defaultStep('trigger', 0)]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing?.workflow && isEditing) {
      setName(existing.workflow.name);
      setDescription(existing.workflow.description);
      setSteps(existing.workflow.steps?.length ? existing.workflow.steps : [defaultStep('trigger', 0)]);
    }
  }, [existing, isEditing]);

  const addStep = () => {
    setSteps((prev) => [...prev, defaultStep('ai_prompt', prev.length)]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) { return; }
    const updated = [...steps];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    setSteps(updated.map((s, i) => ({ ...s, order: i })));
  };

  const updateStepType = (index: number, type: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? defaultStep(type, index) : s)));
  };

  const updateStepConfig = (index: number, key: string, value: unknown) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, config: { ...s.config, [key]: value } } : s,
      ),
    );
  };

  const updateStepLabel = (index: number, label: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, label } : s)));
  };

  const handleSave = async () => {
    if (!name.trim()) { return; }
    setSaving(true);
    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, data: { name, description, steps } });
      } else {
        const result = await createMutation.mutateAsync({ name, description, steps });
        navigate(`/workflows/${result.workflow._id}/edit`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const renderStepConfig = (step: TWorkflowStep, index: number) => {
    const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

    switch (step.type) {
      case 'ai_prompt':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_prompt')}</label>
              <textarea
                value={String(step.config.prompt || '')}
                onChange={(e) => updateStepConfig(index, 'prompt', e.target.value)}
                className={inputClass}
                rows={3}
                placeholder={localize('com_workflows_prompt_placeholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_model')}</label>
                <input
                  type="text"
                  value={String(step.config.model || '')}
                  onChange={(e) => updateStepConfig(index, 'model', e.target.value)}
                  className={inputClass}
                  placeholder="gpt-4"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_temperature')}</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={String(step.config.temperature ?? 0.7)}
                  onChange={(e) => updateStepConfig(index, 'temperature', parseFloat(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        );
      case 'image_generation':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_prompt')}</label>
              <textarea
                value={String(step.config.prompt || '')}
                onChange={(e) => updateStepConfig(index, 'prompt', e.target.value)}
                className={inputClass}
                rows={3}
                placeholder={localize('com_workflows_image_prompt_placeholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_model')}</label>
                <input
                  type="text"
                  value={String(step.config.model || '')}
                  onChange={(e) => updateStepConfig(index, 'model', e.target.value)}
                  className={inputClass}
                  placeholder="dall-e-3"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_size')}</label>
                <input
                  type="text"
                  value={String(step.config.size || '1024x1024')}
                  onChange={(e) => updateStepConfig(index, 'size', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        );
      case 'video_generation':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_prompt')}</label>
              <textarea
                value={String(step.config.prompt || '')}
                onChange={(e) => updateStepConfig(index, 'prompt', e.target.value)}
                className={inputClass}
                rows={3}
                placeholder="Describe the video to generate"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_model')}</label>
                <input type="text" value={String(step.config.model || '')} onChange={(e) => updateStepConfig(index, 'model', e.target.value)} className={inputClass} placeholder="ray-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Provider</label>
                <input type="text" value={String(step.config.provider || 'luma')} onChange={(e) => updateStepConfig(index, 'provider', e.target.value)} className={inputClass} placeholder="luma" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Duration (s)</label>
                <input type="number" min="1" max="30" value={String(step.config.duration ?? 5)} onChange={(e) => updateStepConfig(index, 'duration', parseInt(e.target.value, 10))} className={inputClass} />
              </div>
            </div>
          </div>
        );
      case 'approval':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_approval_message')}</label>
            <input
              type="text"
              value={String(step.config.message || '')}
              onChange={(e) => updateStepConfig(index, 'message', e.target.value)}
              className={inputClass}
              placeholder={localize('com_workflows_approval_message_placeholder')}
            />
          </div>
        );
      case 'publish':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_destination')}</label>
              <input
                type="text"
                value={String(step.config.destination || '')}
                onChange={(e) => updateStepConfig(index, 'destination', e.target.value)}
                className={inputClass}
                placeholder="slack, discord, wordpress"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_template')}</label>
              <textarea
                value={String(step.config.template || '')}
                onChange={(e) => updateStepConfig(index, 'template', e.target.value)}
                className={inputClass}
                rows={3}
                placeholder={`{{step_0_output.aiResponse}}`}
              />
            </div>
          </div>
        );
      case 'condition':
        return (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_field')}</label>
              <input
                type="text"
                value={String(step.config.field || '')}
                onChange={(e) => updateStepConfig(index, 'field', e.target.value)}
                className={inputClass}
                placeholder="step_0_output.aiResponse"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_operator')}</label>
              <select
                value={String(step.config.operator || 'equals')}
                onChange={(e) => updateStepConfig(index, 'operator', e.target.value)}
                className={inputClass}
              >
                <option value="equals">equals</option>
                <option value="contains">contains</option>
                <option value="gt">{'>'}</option>
                <option value="lt">{'<'}</option>
                <option value="exists">exists</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_value')}</label>
              <input
                type="text"
                value={String(step.config.value || '')}
                onChange={(e) => updateStepConfig(index, 'value', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        );
      case 'delay':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_seconds')}</label>
            <input
              type="number"
              min="1"
              value={String(step.config.seconds ?? 60)}
              onChange={(e) => updateStepConfig(index, 'seconds', parseInt(e.target.value, 10))}
              className={inputClass}
            />
          </div>
        );
      case 'webhook':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_url')}</label>
              <input
                type="text"
                value={String(step.config.url || '')}
                onChange={(e) => updateStepConfig(index, 'url', e.target.value)}
                className={inputClass}
                placeholder="https://hooks.example.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{localize('com_workflows_method')}</label>
              <select
                value={String(step.config.method || 'POST')}
                onChange={(e) => updateStepConfig(index, 'method', e.target.value)}
                className={inputClass}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </div>
        );
      default:
        return (
          <p className="text-xs text-gray-400">{localize('com_workflows_no_config')}</p>
        );
    }
  };

  const stepInfo = (type: string) => STEP_TYPES.find((s) => s.type === type) || STEP_TYPES[0];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? localize('com_workflows_edit') : localize('com_workflows_new')}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? localize('com_workflows_saving') : localize('com_workflows_save')}
        </button>
      </div>

      {/* Name & Description */}
      <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_workflows_name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder={localize('com_workflows_name_placeholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_workflows_description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            rows={2}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {localize('com_workflows_steps')}
          </h2>
          <button
            onClick={addStep}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            + {localize('com_workflows_add_step')}
          </button>
        </div>

        {steps.map((step, index) => {
          const info = stepInfo(step.type);
          return (
            <div
              key={index}
              className={`rounded-lg border-2 p-4 shadow-sm ${info.color} dark:border-opacity-50`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{info.icon}</span>
                  <select
                    value={step.type}
                    onChange={(e) => updateStepType(index, e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {STEP_TYPES.map((st) => (
                      <option key={st.type} value={st.type}>
                        {st.icon} {localize(`com_workflows_step_${st.type}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveStep(index, index - 1)} disabled={index === 0}
                    className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">&uarr;</button>
                  <button onClick={() => moveStep(index, index + 1)} disabled={index === steps.length - 1}
                    className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">&darr;</button>
                  <button onClick={() => removeStep(index)}
                    className="ml-2 rounded p-1 text-red-400 hover:text-red-600">
                    &times;
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  value={step.label}
                  onChange={(e) => updateStepLabel(index, e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-500 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  placeholder={localize('com_workflows_step_label')}
                />
              </div>

              {renderStepConfig(step, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
