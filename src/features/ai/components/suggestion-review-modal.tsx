'use client';

/**
 * Suggestion Review Modal Component
 *
 * Modal for reviewing and accepting/rejecting AI-generated field suggestions
 */

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface SuggestionReviewModalProps {
  sessionId: string;
  onClose: () => void;
  onComplete: () => void;
}

type Suggestion = {
  id: string;
  session_id: string;
  field_id: string;
  field_key: string;
  field_label: string;
  section_title: string;
  section_order_index: number;
  field_order_index: number;
  value: string;
  confidence: number;
  source_provenance: Record<string, unknown> | null;
  reviewed: boolean;
  created_at: string;
};

export function SuggestionReviewModal({
  sessionId,
  onClose,
  onComplete,
}: SuggestionReviewModalProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [sessionId]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/suggestions`);
      const result = await response.json();

      if (result.ok) {
        setSuggestions(result.data);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/suggestions/${id}/accept`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));

        // If no more suggestions, complete
        if (suggestions.length === 1) {
          onComplete();
        }
      }
    } catch (error) {
      // Handle error
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/suggestions/${id}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));

        // If no more suggestions, complete
        if (suggestions.length === 1) {
          onComplete();
        }
      }
    } catch (error) {
      // Handle error
    } finally {
      setProcessing(null);
    }
  };

  const handleAcceptAll = async () => {
    setProcessing('all');
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/suggestions/accept-all`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuggestions([]);
        onComplete();
      }
    } catch (error) {
      // Handle error
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectAll = async () => {
    setProcessing('all');
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/suggestions/reject-all`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuggestions([]);
        onComplete();
      }
    } catch (error) {
      // Handle error
    } finally {
      setProcessing(null);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge className="border-green-700 bg-green-900/50 text-green-300">
          High ({Math.round(confidence * 100)}%)
        </Badge>
      );
    }
    if (confidence >= 0.5) {
      return (
        <Badge className="border-yellow-700 bg-yellow-900/50 text-yellow-300">
          Medium ({Math.round(confidence * 100)}%)
        </Badge>
      );
    }
    return (
      <Badge className="border-red-700 bg-red-900/50 text-red-300">
        Low ({Math.round(confidence * 100)}%)
      </Badge>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review AI Suggestions</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading suggestions...</div>
        ) : suggestions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No pending suggestions</div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4 flex gap-2">
              <Button onClick={handleAcceptAll} disabled={processing !== null}>
                <Check className="h-4 w-4" />
                Accept All ({suggestions.length})
              </Button>
              <Button
                onClick={handleRejectAll}
                variant="outline"
                disabled={processing !== null}
                size="sm"
              >
                Reject All
              </Button>
            </div>

            {suggestions.map((suggestion) => {
              const provenance = suggestion.source_provenance || {};
              const sourceFilename =
                (provenance as { source_filename?: string }).source_filename || 'Unknown';

              return (
                <Card key={suggestion.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-medium">{suggestion.field_label}</span>
                        {getConfidenceBadge(suggestion.confidence)}
                        <Badge variant="outline" className="text-xs">
                          {suggestion.section_title}
                        </Badge>
                      </div>

                      <div className="mb-2 rounded-md bg-muted p-3">
                        <div className="mb-1 text-sm font-medium text-muted-foreground">
                          Suggested Value
                        </div>
                        <div className="text-foreground">{suggestion.value}</div>
                      </div>

                      <div className="text-xs text-muted-foreground">Source: {sourceFilename}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => handleAccept(suggestion.id)}
                        disabled={processing !== null}
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(suggestion.id)}
                        disabled={processing !== null}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
