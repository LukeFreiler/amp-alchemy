/**
 * Generate Button Component
 *
 * Button to navigate to the generator page
 */

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Generator } from '@/features/artifacts/types/artifact';

type GenerateButtonProps = {
  sessionId: string;
  generators: Generator[];
};

export function GenerateButton({ sessionId, generators }: GenerateButtonProps) {
  const router = useRouter();

  const handleGenerate = () => {
    router.push(`/sessions/${sessionId}/generate`);
  };

  if (generators.length === 0) {
    return null;
  }

  return (
    <Button onClick={handleGenerate}>
      <Sparkles className="h-4 w-4" />
      Generate Artifact
    </Button>
  );
}
