import PageLayout from '~/components/PageLayout';
import TwoFactorAuthentication from '~/components/Nav/SettingsTabs/Account/TwoFactorAuthentication';
import DeleteAccount from '~/components/Nav/SettingsTabs/Account/DeleteAccount';

export default function SecurityPage() {
  return (
    <PageLayout title="Security">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border-light p-4">
          <TwoFactorAuthentication />
        </div>
        <div className="rounded-lg border border-border-light p-4">
          <DeleteAccount />
        </div>
      </div>
    </PageLayout>
  );
}
