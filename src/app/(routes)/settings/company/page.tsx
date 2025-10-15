/**
 * Company settings page
 *
 * Displays company settings form for owners and editors.
 * Server component that requires authentication.
 */

import { requireAuth } from '@/lib/auth/middleware';
import { queryOne } from '@/lib/db/query';
import { CompanySettingsForm } from '@/features/settings/components/company-settings-form';
import { Company } from '@/features/auth/types/session';
import { NotFoundError } from '@/lib/errors';

export default async function CompanySettingsPage() {
  const user = await requireAuth(['owner', 'editor']);

  const company = await queryOne<Company>(
    'SELECT id, name, created_at, updated_at FROM companies WHERE id = $1',
    [user.company_id]
  );

  if (!company) {
    throw new NotFoundError('Company');
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company and account settings
          </p>
        </div>

        <CompanySettingsForm company={company} />
      </div>
    </div>
  );
}
