import { Link, useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { useGetWorkflows, useDeleteWorkflowMutation } from '~/data-provider';

export default function WorkflowList() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetWorkflows();
  const deleteMutation = useDeleteWorkflowMutation();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(localize('com_workflows_delete_confirm'))) { return; }
    await deleteMutation.mutateAsync(id);
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

  const workflows = data.workflows || [];
  const statusBadge = (isActive: boolean) =>
    isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {localize('com_workflows_title')}
        </h1>
        <Link
          to="/workflows/new"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {localize('com_workflows_create')}
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 dark:border-gray-600">
          <p className="mb-2 text-gray-500 dark:text-gray-400">{localize('com_workflows_empty')}</p>
          <Link
            to="/workflows/new"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            {localize('com_workflows_create_first')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <div
              key={wf._id}
              onClick={() => navigate(`/workflows/${wf._id}/edit`)}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{wf.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(wf.isActive)}`}>
                  {wf.isActive ? localize('com_workflows_active') : localize('com_workflows_inactive')}
                </span>
              </div>
              {wf.description && (
                <p className="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {wf.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{wf.steps?.length || 0} {localize('com_workflows_steps')}</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workflows/${wf._id}/runs`);
                    }}
                    className="text-green-600 hover:text-green-700"
                  >
                    {localize('com_workflows_runs')}
                  </button>
                  <button
                    onClick={(e) => handleDelete(wf._id, e)}
                    className="text-red-500 hover:text-red-600"
                  >
                    {localize('com_workflows_delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
