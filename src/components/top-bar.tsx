/**
 * Top navigation bar component
 *
 * Features:
 * - Logo with home link
 * - Breadcrumb navigation showing current location
 * - Search input (opens command palette)
 * - Context-aware Import button (shows on Session pages)
 * - User avatar menu
 * - Mobile responsive with hamburger menu
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Menu, Upload, X } from 'lucide-react';

import { SearchInput } from '@/components/search-input';
import { UserMenu } from '@/components/user-menu';
import { Button } from '@/components/ui/button';

export interface TopBarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

interface Breadcrumb {
  label: string;
  href: string | null;
}

/**
 * Generate breadcrumbs from current pathname
 */
function getBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Breadcrumb[] = [];

  if (segments.length === 0) {
    return crumbs;
  }

  if (segments[0] === 'blueprints') {
    crumbs.push({ label: 'Blueprints', href: '/blueprints' });
    if (segments[1] && segments[2] === 'edit') {
      crumbs.push({ label: 'Edit', href: null });
    } else if (segments[1]) {
      crumbs.push({ label: 'View', href: null });
    }
  } else if (segments[0] === 'sessions') {
    crumbs.push({ label: 'Sessions', href: '/sessions' });
    if (segments[1]) {
      crumbs.push({ label: 'Session', href: null });
    }
  } else if (segments[0] === 'artifacts') {
    crumbs.push({ label: 'Artifacts', href: '/artifacts' });
    if (segments[1]) {
      crumbs.push({ label: 'View', href: null });
    }
  } else if (segments[0] === 'settings') {
    crumbs.push({ label: 'Settings', href: '/settings' });
    if (segments[1] === 'company') {
      crumbs.push({ label: 'Company', href: null });
    }
  }

  return crumbs;
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const breadcrumbs = getBreadcrumbs(pathname);
  const isSessionPage = pathname.startsWith('/sessions/') && pathname.split('/').length > 2;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          {/* Left: Logo + Breadcrumbs */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xl font-bold transition-colors hover:text-foreground/80"
              aria-label="Home"
            >
              Alchemy
            </Link>

            {breadcrumbs.length > 0 && (
              <nav className="hidden items-center gap-2 text-sm md:flex" aria-label="Breadcrumb">
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {breadcrumbs.map((crumb, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                    {crumb.href !== null && crumb.href !== '' ? (
                      <a
                        href={crumb.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="font-medium text-foreground">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Center: Search (hidden on mobile) */}
          <div className="hidden flex-1 justify-center lg:flex">
            <SearchInput className="w-full max-w-md" />
          </div>

          {/* Right: Import + User Menu */}
          <div className="flex items-center gap-2">
            {isSessionPage && (
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            )}

            <div className="hidden md:block">
              <UserMenu user={user} />
            </div>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="border-t py-4 md:hidden" role="navigation" aria-label="Mobile menu">
            {/* Search */}
            <div className="px-4 pb-4">
              <SearchInput />
            </div>

            {/* Breadcrumb navigation for mobile */}
            {breadcrumbs.length > 0 && (
              <div className="space-y-1 px-4 pb-4">
                <div className="text-xs font-medium text-muted-foreground">Navigation</div>
                {breadcrumbs.map((crumb, i) => (
                  <div key={i}>
                    {crumb.href !== null && crumb.href !== '' ? (
                      <a
                        href={crumb.href}
                        className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <div className="block rounded-md px-2 py-1.5 text-sm font-medium">
                        {crumb.label}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick links */}
            <div className="space-y-1 border-t px-4 pt-4">
              <div className="text-xs font-medium text-muted-foreground">Quick Links</div>
              <a
                href="/blueprints"
                className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blueprints
              </a>
              <a
                href="/sessions"
                className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sessions
              </a>
              <a
                href="/artifacts"
                className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Artifacts
              </a>
            </div>

            {/* Import button for mobile */}
            {isSessionPage && (
              <div className="border-t px-4 pt-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </div>
            )}

            {/* User menu for mobile */}
            <div className="flex items-center gap-3 border-t px-4 pt-4">
              <UserMenu user={user} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
