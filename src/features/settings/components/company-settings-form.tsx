/**
 * Company settings form component
 *
 * Allows owners and editors to update company name and settings.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Save, Loader2 } from 'lucide-react';
import { Company } from '@/features/auth/types/session';

interface CompanySettingsFormProps {
  company: Company;
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const [name, setName] = useState(company.name);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage({ type: 'success', text: 'Company settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = name !== company.name;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Company Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your company name and branding
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company-name">Company Name</Label>
          <Input
            id="company-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter company name"
            maxLength={255}
            required
          />
          <p className="text-xs text-muted-foreground">
            This name will be displayed throughout the application
          </p>
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-950/50 text-green-400 border border-green-900'
                : 'bg-destructive/10 text-destructive border border-destructive/50'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={!hasChanges || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
