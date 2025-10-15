'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Menu, Upload, X } from 'lucide-react';

import { SearchInput } from '@/features/search/components/search-input';
import { UserMenu } from '@/components/user-menu';
import { Button } from '@/components/ui/button';
import { AuthUser } from '@/features/auth/types/session';

interface TopBarProps {
  user: AuthUser;
}

interface Breadcrumb {
  label: string;
  href: string | null;
}

/**
 * Top Navigation Bar Component
 *
 * Displays the main navigation bar with:
 * - Logo (links to home)
 * - Breadcrumb navigation
 * - Search input (opens command palette)
 * - Context-aware Import button (shows on Session pages)
 * - User menu
 * - Mobile responsive hamburger menu (<768px)
 *
 * Usage:
 *   <TopBar user={session.user} />
 */
export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const breadcrumbs = getBreadcrumbs(pathname);
  const isSessionPage = pathname.startsWith('/sessions/') && pathname.split('/').length > 2;

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo + Breadcrumbs */}
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="font-bold text-xl shrink-0">
              Alchemy
            </Link>

            {breadcrumbs.length > 0 && (
              <nav className="hidden md:flex items-center gap-2 text-sm min-w-0">
                {breadcrumbs.map((crumb, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    {crumb.href ? (
                      <button
                        onClick={() => {
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore - Next.js 15 strict Route typing
                          router.push(crumb.href);
                        }}
                        className="text-muted-foreground hover:text-foreground truncate cursor-pointer"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-foreground font-medium truncate">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Center: Search (Desktop only) */}
          <div className="hidden lg:block flex-1 max-w-md">
            <SearchInput />
          </div>

          {/* Right: Import + User Menu + Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {isSessionPage && (
              <Button variant="outline" className="hidden sm:flex">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            )}

            <UserMenu user={user} />

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t mt-3 pt-3 space-y-3">
            {/* Mobile Search */}
            <div className="lg:hidden">
              <SearchInput />
            </div>

            {/* Mobile Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav className="space-y-2">
                {breadcrumbs.map((crumb, i) => (
                  <div key={i}>
                    {crumb.href ? (
                      <button
                        onClick={() => {
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore - Next.js 15 strict Route typing
                          router.push(crumb.href);
                          setMobileMenuOpen(false);
                        }}
                        className="block px-2 py-1 text-sm text-muted-foreground hover:text-foreground w-full text-left"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="block px-2 py-1 text-sm text-foreground font-medium">
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            )}

            {/* Mobile Import Button */}
            {isSessionPage && (
              <Button variant="outline" className="w-full sm:hidden">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            )}

            {/* Mobile Quick Links */}
            <nav className="space-y-2 border-t pt-3">
              <button
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore - Next.js 15 strict Route typing
                  router.push('/blueprints');
                  setMobileMenuOpen(false);
                }}
                className="block px-2 py-1 text-sm text-muted-foreground hover:text-foreground w-full text-left"
              >
                Blueprints
              </button>
              <button
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore - Next.js 15 strict Route typing
                  router.push('/sessions');
                  setMobileMenuOpen(false);
                }}
                className="block px-2 py-1 text-sm text-muted-foreground hover:text-foreground w-full text-left"
              >
                Sessions
              </button>
              <button
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore - Next.js 15 strict Route typing
                  router.push('/artifacts');
                  setMobileMenuOpen(false);
                }}
                className="block px-2 py-1 text-sm text-muted-foreground hover:text-foreground w-full text-left"
              >
                Artifacts
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * Generate breadcrumbs based on the current pathname
 *
 * Examples:
 *   /blueprints -> [{ label: 'Blueprints', href: '/blueprints' }]
 *   /blueprints/123 -> [{ label: 'Blueprints', href: '/blueprints' }, { label: 'Edit', href: null }]
 *   /sessions/456 -> [{ label: 'Sessions', href: '/sessions' }, { label: 'Session', href: null }]
 */
function getBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Breadcrumb[] = [];

  if (segments.length === 0) {
    return crumbs;
  }

  // First segment determines the section
  const section = segments[0];

  if (section === 'blueprints') {
    crumbs.push({ label: 'Blueprints', href: segments.length > 1 ? '/blueprints' : null });
    if (segments.length > 1) {
      crumbs.push({ label: 'Edit', href: null });
    }
  } else if (section === 'sessions') {
    crumbs.push({ label: 'Sessions', href: segments.length > 1 ? '/sessions' : null });
    if (segments.length > 1) {
      crumbs.push({ label: 'Session', href: null });
    }
  } else if (section === 'artifacts') {
    crumbs.push({ label: 'Artifacts', href: segments.length > 1 ? '/artifacts' : null });
    if (segments.length > 1) {
      crumbs.push({ label: 'View', href: null });
    }
  } else if (section === 'settings') {
    crumbs.push({ label: 'Settings', href: segments.length > 1 ? '/settings' : null });
    if (segments[1] === 'company') {
      crumbs.push({ label: 'Company', href: null });
    }
  }

  return crumbs;
}
