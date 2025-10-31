'use client';

import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, LogOut, Sparkles } from 'lucide-react';

import { AuthUser } from '@/features/auth/types/session';
import { useAnimationPreference } from '@/hooks/use-animation-preference';

interface UserMenuProps {
  user: AuthUser;
}

/**
 * User Menu Component
 *
 * Displays user avatar with a dropdown menu containing:
 * - User name and email
 * - Company Settings link
 * - Sign Out action
 *
 * Usage:
 *   <UserMenu user={session.user} />
 */
export function UserMenu({ user }: UserMenuProps) {
  const { animationEnabled, toggleAnimation } = useAnimationPreference();
  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href="/settings/company" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={toggleAnimation} className="cursor-pointer">
          <Sparkles className="mr-2 h-4 w-4" />
          {animationEnabled ? 'Disable' : 'Enable'} Animation
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
