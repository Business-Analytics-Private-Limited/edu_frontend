/**
 * /organizations/new: create an organization together with its first admin.
 */
import { PageHeader } from '@eduplatform/ui';
import { CreateOrganizationForm } from './create-organization-form';

export default function NewOrganizationPage() {
  return (
    <>
      <PageHeader
        back={{ href: '/organizations', label: 'Back to organizations' }}
        title="New organization"
        description="The first admin can log in to the web app right away and set up everything else."
      />
      <CreateOrganizationForm />
    </>
  );
}
