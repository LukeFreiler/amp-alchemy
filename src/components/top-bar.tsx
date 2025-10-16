'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

import { SearchInput } from '@/features/search/components/search-input';
import { UserMenu } from '@/components/user-menu';
import { Button } from '@/components/ui/button';
import { AuthUser } from '@/features/auth/types/session';

interface TopBarProps {
  user: AuthUser;
}

/**
 * Top Navigation Bar Component
 *
 * Displays the main navigation bar with:
 * - Logo (links to home)
 * - Main navigation (Blueprints, Sessions)
 * - Search input (opens command palette)
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

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo + Main Nav + Breadcrumbs */}
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Alchemy Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">Alchemy</span>
            </Link>

            {/* Main Navigation (Desktop) */}
            <nav className="hidden items-center gap-1 md:flex">
              <Button
                variant={pathname.startsWith('/blueprints') ? 'default' : 'ghost'}
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore - Next.js 15 strict Route typing
                  router.push('/blueprints');
                }}
              >
                Blueprints
              </Button>
              <Button
                variant={pathname.startsWith('/sessions') ? 'default' : 'ghost'}
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore - Next.js 15 strict Route typing
                  router.push('/sessions');
                }}
              >
                Sessions
              </Button>
            </nav>
          </div>

          {/* Center: Search (Desktop only) */}
          <div className="hidden max-w-md flex-1 lg:block">
            <SearchInput />
          </div>

          {/* Right: User Menu + Mobile Toggle */}
          <div className="flex shrink-0 items-center gap-2">
            <UserMenu user={user} />

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mt-3 space-y-3 border-t pt-3 md:hidden">
            {/* Mobile Search */}
            <div className="lg:hidden">
              <SearchInput />
            </div>

            {/* Mobile Quick Links */}
            <nav className="space-y-2 border-t pt-3">
              <button
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore - Next.js 15 strict Route typing
                  router.push('/blueprints');
                  setMobileMenuOpen(false);
                }}
                className="block w-full px-2 py-1 text-left text-sm text-muted-foreground hover:text-foreground"
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
                className="block w-full px-2 py-1 text-left text-sm text-muted-foreground hover:text-foreground"
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
                className="block w-full px-2 py-1 text-left text-sm text-muted-foreground hover:text-foreground"
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
