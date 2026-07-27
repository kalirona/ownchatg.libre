import { useParams, useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { useGetWorkflowExecutions, useExecuteWorkflowMutation } from '~/data-provider';

const statusColors: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  canceled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  waiting_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function WorkflowExecutionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localize = useLocalize();
  const { data, isLoading, isError } = useGetWorkflowExecutions(id ?? '');
  const executeMutation = useExecuteWorkflowMutation();

  const handleExecute = async () => {
    if (!id) { return; }
    await executeMutation.mutateAsync({ id });
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {localize('com_workflows_error_loading')}
      </div>
    );
  }

  const executions = data.executions || [];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {localize('com_workflows_executions')}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/workflows/${id}/edit`)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            {localize('com_workflows_edit_workflow')}
          </button>
          <button
            onClick={handleExecute}
            disabled={executeMutation.isLoading}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {executeMutation.isLoading ? localize('com_workflows_running') : localize('com_workflows_run_now')}
          </button>
        </div>
      </div>

      {executions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">{localize('com_workflows_no_executions')}</p>
          <button
            onClick={handleExecute}
            className="mt-2 text-sm font-medium text-green-600 hover:text-green-700"
          >
            {localize('com_workflows_run_first')}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{localize('com_workflows_status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{localize('com_workflows_started')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{localize('com_workflows_completed')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{localize('com_workflows_steps')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{localize('com_workflows_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {executions.map((exec) => (
                <tr
                  key={exec._id}
                  onClick={() => navigate(`/workflows/${id}/runs/${exec._id}`)}
                  className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[exec.status] || ''}`}>
                      {localize(`com_workflows_status_${exec.status}`)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(exec.startedAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {exec.completedAt ? new Date(exec.completedAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {exec.stepResults.filter((s) => s.status === 'completed').length}/{exec.stepResults.length}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {exec.error && <span className="text-xs text-red-500" title={exec.error}>!</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
