import { useState } from 'react';
import { useLocalize } from '~/hooks';
import {
  useGetOrganizations,
  useCreateOrganizationMutation,
  useDeleteOrganizationMutation,
} from '~/data-provider/Organizations/queries';
import { Link } from 'react-router-dom';

export default function OrganizationList() {
  const localize = useLocalize();
  const { data, isLoading } = useGetOrganizations();
  const createMutation = useCreateOrganizationMutation();
  const deleteMutation = useDeleteOrganizationMutation();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => { setShowForm(false); setName(''); setDescription(''); } },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {localize('com_org_title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {localize('com_org_description')}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
        >
          {localize('com_org_create')}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={localize('com_org_name_placeholder')}
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={localize('com_org_desc_placeholder')}
            rows={2}
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!name.trim() || createMutation.isLoading}
              className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              {localize('com_org_create_submit')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              {localize('com_ui_cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex h-20 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      )}

      {data?.organizations?.length === 0 && !isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">{localize('com_org_empty')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {data?.organizations?.map((org) => (
          <Link
            key={org._id}
            to={`/organizations/${org._id}`}
            className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-green-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.name}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {org.description || org.slug}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {org.role}
                </span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium capitalize text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  {org.planTier}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
