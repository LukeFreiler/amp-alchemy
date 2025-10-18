'use client';

/**
 * Suggestion Banner Component
 *
 * Displays count of pending AI suggestions with a Review button
 */

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SuggestionReviewModal } from './suggestion-review-modal';

interface SuggestionBannerProps {
  sessionId: string;
  onSuggestionsReviewed?: () => void;
}

export function SuggestionBanner({ sessionId, onSuggestionsReviewed }: SuggestionBannerProps) {
  const [count, setCount] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/suggestions`);
      const result = await response.json();

      if (result.ok) {
        setCount(result.data.length);

        if (result.data.length > 0) {
          const firstSource = result.data[0].source_provenance;
          if (firstSource && typeof firstSource === 'object') {
            setSource(
              (firstSource as { source_filename?: string }).source_filename || 'unknown source'
            );
          } else {
            setSource('unknown source');
          }
        }
      }
    } catch (error) {
      // Silently fail - banner will just not show
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [sessionId]);

  const handleComplete = () => {
    setShowModal(false);
    setCount(0);
    if (onSuggestionsReviewed) {
      onSuggestionsReviewed();
    }
  };

  if (loading || count === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6 rounded-md border border-blue-700/50 bg-blue-950/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <div>
              <span className="font-medium">
                {count} suggestion{count > 1 ? 's' : ''} ready to review
                {source && <> from {source}</>}
              </span>
              <p className="text-xs text-blue-300/70">
                Click AI badges on fields to accept or reject suggestions
              </p>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm" variant="outline">
            Review All
          </Button>
        </div>
      </div>

      {showModal && (
        <SuggestionReviewModal
          sessionId={sessionId}
          onClose={() => setShowModal(false)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
