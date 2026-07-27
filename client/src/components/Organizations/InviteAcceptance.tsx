import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { dataService } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks/AuthContext';

export default function InviteAcceptance() {
  const localize = useLocalize();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [invite, setInvite] = useState<{ organization: { name: string }; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); setError('Invalid invite link'); return; }
    dataService.getInviteInfo(token).then((res) => {
      setInvite(res.invite);
      setLoading(false);
    }).catch(() => {
      setError(localize('com_org_invite_not_found'));
      setLoading(false);
    });
  }, [token, localize]);

  const handleAccept = async () => {
    if (!token) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }
    try {
      setLoading(true);
      await dataService.acceptInviteByToken(token);
      setAccepted(true);
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : localize('com_org_invite_error'));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-sm text-gray-500">{localize('com_ui_loading')}</div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
          <div className="mb-4 text-4xl">🎉</div>
          <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {localize('com_org_invite_accepted')}
          </h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {localize('com_org_invite_accepted_desc')}
          </p>
          <button
            onClick={() => navigate('/organizations')}
            className="rounded-lg bg-green-500 px-6 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            {localize('com_org_go_to_orgs')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        {error ? (
          <>
            <div className="mb-4 text-center text-4xl">😕</div>
            <h1 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
              {localize('com_org_invite_error_title')}
            </h1>
            <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </>
        ) : invite ? (
          <>
            <div className="mb-4 text-center text-4xl">✉️</div>
            <h1 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
              {localize('com_org_invite_youre_invited')}
            </h1>
            <p className="mb-2 text-center text-sm text-gray-600 dark:text-gray-300">
              {localize('com_org_invite_to_join')} <strong>{invite.organization.name}</strong>
            </p>
            <p className="mb-6 text-center text-xs text-gray-400">
              {localize('com_org_invite_role')}: {invite.role} &middot; {invite.email}
            </p>
            <button
              onClick={handleAccept}
              className="w-full rounded-lg bg-green-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-600"
            >
              {localize('com_org_invite_accept')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
