/**
 * Animation Preference Context
 *
 * Provides shared state for animation preference across the app
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

const COOKIE_NAME = 'animation-enabled';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

interface AnimationPreferenceContextType {
  animationEnabled: boolean;
  toggleAnimation: () => void;
  isLoaded: boolean;
}

const AnimationPreferenceContext = createContext<AnimationPreferenceContextType | undefined>(
  undefined
);

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }

  return null;
}

/**
 * Set cookie value
 */
function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function AnimationPreferenceProvider({ children }: { children: ReactNode }) {
  const [animationEnabled, setAnimationEnabled] = useState(() => {
    // Initialize from cookie on mount
    const saved = getCookie(COOKIE_NAME);
    return saved !== null ? saved === 'true' : true;
  });
  // Since we initialize from cookie synchronously, isLoaded is always true
  const isLoaded = true;

  const toggleAnimation = () => {
    const newValue = !animationEnabled;
    setAnimationEnabled(newValue);
    setCookie(COOKIE_NAME, String(newValue), COOKIE_MAX_AGE);
  };

  return (
    <AnimationPreferenceContext.Provider value={{ animationEnabled, toggleAnimation, isLoaded }}>
      {children}
    </AnimationPreferenceContext.Provider>
  );
}

export function useAnimationPreference() {
  const context = useContext(AnimationPreferenceContext);

  if (context === undefined) {
    throw new Error('useAnimationPreference must be used within AnimationPreferenceProvider');
  }

  return context;
}
