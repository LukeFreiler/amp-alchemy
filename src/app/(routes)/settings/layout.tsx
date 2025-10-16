/**
 * Settings Layout
 *
 * Provides tabbed navigation for settings pages (Company, Team)
 * Team tab is only visible to owners
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Building2, Users } from 'lucide-react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const isOwner = session?.user?.role === 'owner';
  const isCompanyPage = pathname === '/settings/company';
  const isTeamPage = pathname === '/settings/team';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your company and account settings</p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b">
          <nav className="flex gap-4">
            <button
              onClick={() => router.push('/settings/company')}
              className={`flex items-center gap-2 border-b-2 pb-3 px-1 text-sm font-medium transition-colors ${
                isCompanyPage
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Company
            </button>
            {isOwner && (
              <button
                onClick={() => router.push('/settings/team')}
                className={`flex items-center gap-2 border-b-2 pb-3 px-1 text-sm font-medium transition-colors ${
                  isTeamPage
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Team
              </button>
            )}
          </nav>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
