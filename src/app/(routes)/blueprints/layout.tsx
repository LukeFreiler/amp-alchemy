/**
 * Blueprints Layout
 *
 * Requires owner role for all blueprint routes
 */

import { requireAuth } from '@/lib/auth/middleware';

export default async function BlueprintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(['owner']);

  return <>{children}</>;
}
