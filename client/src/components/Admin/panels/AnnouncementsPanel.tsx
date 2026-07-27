import { useState } from 'react';
import {
  useGetAdminAnnouncements,
  useCreateAdminAnnouncementMutation,
  useDeleteAdminAnnouncementMutation,
} from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';

export default function AnnouncementsPanel() {
  const localize = useLocalize();
  const { data, isLoading } = useGetAdminAnnouncements();
  const createMutation = useCreateAdminAnnouncementMutation();
  const deleteMutation = useDeleteAdminAnnouncementMutation();

  const [showForm, setShowForm] = useState(false);
  const [bannerId, setBannerId] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('banner');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerId || !message) return;
    createMutation.mutate(
      { bannerId, message, type },
      { onSuccess: () => { setShowForm(false); setBannerId(''); setMessage(''); } },
    );
  };

  const handleDelete = (id: string) => {
    if (confirm(localize('com_admin_confirm_delete'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {localize('com_admin_announcements')}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          {showForm ? localize('com_admin_cancel') : localize('com_admin_create')}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="space-y-3">
            <input
              type="text"
              value={bannerId}
              onChange={(e) => setBannerId(e.target.value)}
              placeholder="bannerId"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={localize('com_admin_message')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="banner">Banner</option>
              <option value="popup">Popup</option>
            </select>
            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {localize('com_admin_save')}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="flex h-20 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      )}

      {data?.announcements?.map((announcement) => (
        <div
          key={announcement._id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {announcement.bannerId}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{announcement.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  announcement.isPublic
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                }`}
              >
                {announcement.isPublic ? localize('com_admin_public') : localize('com_admin_private')}
              </span>
              <button
                onClick={() => handleDelete(announcement._id)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{announcement.message}</p>
          <p className="mt-1 text-xs text-gray-400">
            {announcement.displayFrom
              ? new Date(announcement.displayFrom).toLocaleDateString()
              : ''}{' '}
            {announcement.displayTo ? `- ${new Date(announcement.displayTo).toLocaleDateString()}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}
