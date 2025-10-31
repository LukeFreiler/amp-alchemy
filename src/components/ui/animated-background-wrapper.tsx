/**
 * Animated Background Wrapper
 *
 * Client component wrapper that manages animation preference
 */

'use client';

import { useAnimationPreference } from '@/hooks/use-animation-preference';
import { AnimatedBackground } from './animated-background';

export function AnimatedBackgroundWrapper() {
  const { animationEnabled } = useAnimationPreference();

  return <AnimatedBackground enabled={animationEnabled} />;
}
