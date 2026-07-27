import { useParams, useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import {
  useGetWorkflowExecution,
  useApproveWorkflowExecutionMutation,
  useRejectWorkflowExecutionMutation,
  useCancelWorkflowExecutionMutation,
  useRetryWorkflowExecutionMutation,
} from '~/data-provider';

const stepIcons: Record<string, string> = {
  trigger: '⚡', ai_prompt: '🤖', image_generation: '🖼️', video_generation: '🎬',
  approval: '✅', publish: '📤', condition: '🔀', delay: '⏱️', webhook: '🔗',
};

const stepStatusBadge: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  skipped: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
  waiting_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function WorkflowRunDetail() {
  const { id, runId } = useParams();
  const navigate = useNavigate();
  const localize = useLocalize();
  const { data, isLoading, isError } = useGetWorkflowExecution(id ?? '', runId ?? '');
  const approveMutation = useApproveWorkflowExecutionMutation();
  const rejectMutation = useRejectWorkflowExecutionMutation();
  const cancelMutation = useCancelWorkflowExecutionMutation();
  const retryMutation = useRetryWorkflowExecutionMutation();

  const handleApprove = async () => {
    if (!id || !runId) { return; }
    await approveMutation.mutateAsync({ id, executionId: runId });
  };

  const handleReject = async () => {
    if (!id || !runId) { return; }
    await rejectMutation.mutateAsync({ id, executionId: runId });
  };

  const handleCancel = async () => {
    if (!id || !runId) { return; }
    await cancelMutation.mutateAsync({ id, executionId: runId });
  };

  const handleRetry = async () => {
    if (!id || !runId) { return; }
    await retryMutation.mutateAsync({ id, executionId: runId });
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data?.execution) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {localize('com_workflows_error_loading')}
      </div>
    );
  }

  const execution = data.execution;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(`/workflows/${id}/runs`)}
            className="mb-2 text-sm text-green-600 hover:text-green-700"
          >
            &larr; {localize('com_workflows_back_to_runs')}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {localize('com_workflows_run_detail')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(execution.status === 'running') && (
            <button
              onClick={handleCancel}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:text-red-400"
            >
              {localize('com_workflows_cancel')}
            </button>
          )}
          {execution.status === 'failed' && (
            <button
              onClick={handleRetry}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              {localize('com_workflows_retry')}
            </button>
          )}
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${stepStatusBadge[execution.status] || ''}`}>
            {localize(`com_workflows_status_${execution.status}`)}
          </span>
        </div>
      </div>

      {execution.status === 'waiting_approval' && (
        <div className="mb-6 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="mb-3 text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {localize('com_workflows_approval_required')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={approveMutation.isLoading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {localize('com_workflows_approve')}
            </button>
            <button
              onClick={handleReject}
              disabled={rejectMutation.isLoading}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:text-red-400"
            >
              {localize('com_workflows_reject')}
            </button>
          </div>
        </div>
      )}

      {execution.error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {localize('com_workflows_error')}: {execution.error}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {localize('com_workflows_step_results')}
        </h2>
        {execution.stepResults.map((step, index) => {
          const icon = stepIcons[step.type] || '•';
          const statusClass = stepStatusBadge[step.status] || '';
          return (
            <div
              key={step.stepId || index}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {localize(`com_workflows_step_${step.type}`)}
                    {step.input?.triggerData && (
                      <span className="ml-2 text-xs text-gray-400">(step {index + 1})</span>
                    )}
                  </span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                  {step.status}
                </span>
              </div>

              {step.output && (
                <div className="mt-2 rounded bg-gray-50 p-3 font-mono text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(step.output, null, 2)}</pre>
                </div>
              )}

              {step.error && (
                <p className="mt-1 text-xs text-red-500">{step.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
