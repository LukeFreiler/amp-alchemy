/**
 * Generate Button Component
 *
 * Dropdown to select generator and trigger artifact generation
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { Generator } from '@/features/artifacts/types/artifact';
import { ArtifactReviewModal } from './artifact-review-modal';

type GenerateButtonProps = {
  sessionId: string;
  generators: Generator[];
};

export function GenerateButton({
  sessionId,
  generators,
}: GenerateButtonProps) {
  const [selectedGenerator, setSelectedGenerator] = useState<string | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  const handleGenerate = () => {
    if (!selectedGenerator) return;
    setShowModal(true);
  };

  if (generators.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2">
        <Select
          value={selectedGenerator || ''}
          onValueChange={setSelectedGenerator}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select generator..." />
          </SelectTrigger>
          <SelectContent>
            {generators.map((gen) => (
              <SelectItem key={gen.id} value={gen.id}>
                {gen.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleGenerate} disabled={!selectedGenerator}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate
        </Button>
      </div>

      {showModal && selectedGenerator && (
        <ArtifactReviewModal
          sessionId={sessionId}
          generatorId={selectedGenerator}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
