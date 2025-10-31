/**
 * Client-side providers wrapper
 * Wraps the app with NextAuth SessionProvider and animation preference
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

import { AnimationPreferenceProvider } from '@/contexts/animation-preference-context';
import { AnimatedBackgroundWrapper } from '@/components/ui/animated-background-wrapper';

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <AnimationPreferenceProvider>
        <AnimatedBackgroundWrapper />
        {children}
      </AnimationPreferenceProvider>
    </SessionProvider>
  );
}
