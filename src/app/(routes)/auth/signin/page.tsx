/**
 * Sign-in page
 *
 * Displays Google OAuth sign-in button with dark-themed UI.
 */

'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';

export default function SignInPage() {
  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Centercode Alchemy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleSignIn}
            className="w-full"
            size="lg"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
