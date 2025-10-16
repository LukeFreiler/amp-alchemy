/**
 * Onboarding page for new users to create their company
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error?.message || 'Failed to complete onboarding');
      }

      // Refresh the session to get updated company_id and role
      await update();

      toast.success('Welcome! Your company has been created');
      router.push('/sessions');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete onboarding');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Centercode Alchemy</h1>
          <p className="mt-2 text-muted-foreground">
            Let&apos;s get started by creating your company
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Company'}
          </Button>
        </form>
      </div>
    </div>
  );
}
