'use client';

import { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

type FieldSuggestionBadgeProps = {
  sessionId: string;
  fieldId: string;
  suggestion: {
    id: string;
    value: string;
    confidence: number;
    source_provenance: Record<string, unknown> | null;
  };
  onAccept: (value: string) => void;
  onReject: () => void;
};

export function FieldSuggestionBadge({
  sessionId,
  suggestion,
  onAccept,
  onReject,
}: FieldSuggestionBadgeProps) {
  const [processing, setProcessing] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/v1/sessions/${sessionId}/suggestions/${suggestion.id}/accept`,
        { method: 'PUT' }
      );

      if (response.ok) {
        onAccept(suggestion.value);
        setOpen(false);

        toast({
          title: 'Suggestion Accepted',
          description: 'Field value updated',
        });
      } else {
        throw new Error('Failed to accept suggestion');
      }
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept suggestion',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/v1/sessions/${sessionId}/suggestions/${suggestion.id}/reject`,
        { method: 'PUT' }
      );

      if (response.ok) {
        onReject();
        setOpen(false);

        toast({
          title: 'Suggestion Rejected',
          description: 'Suggestion dismissed',
        });
      } else {
        throw new Error('Failed to reject suggestion');
      }
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject suggestion',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceColor = () => {
    if (suggestion.confidence >= 0.9) return 'border-green-700 bg-green-900/50 text-green-300';
    if (suggestion.confidence >= 0.7) return 'border-yellow-700 bg-yellow-900/50 text-yellow-300';
    return 'border-blue-700 bg-blue-900/50 text-blue-300';
  };

  const getSourceFilename = () => {
    if (!suggestion.source_provenance) return 'Unknown';
    const provenance = suggestion.source_provenance as { source_filename?: string };
    return provenance.source_filename || 'Unknown';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge className={`cursor-pointer ${getConfidenceColor()}`} variant="outline">
          <Sparkles className="mr-1 h-3 w-3" />
          AI {Math.round(suggestion.confidence * 100)}%
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Suggested Value</div>
            <div className="rounded-md bg-muted p-2 text-sm">{suggestion.value}</div>
          </div>

          <div className="text-xs text-muted-foreground">Source: {getSourceFilename()}</div>

          <div className="flex gap-2">
            <Button onClick={handleAccept} disabled={processing} className="flex-1" size="sm">
              <Check className="mr-1 h-4 w-4" />
              Accept
            </Button>
            <Button onClick={handleReject} disabled={processing} variant="outline" size="sm">
              <X className="mr-1 h-4 w-4" />
              Reject
            </Button>
          </div>

          <div className="border-t pt-2 text-xs text-muted-foreground">
            Keyboard: <kbd className="rounded bg-muted px-1">A</kbd> accept •{' '}
            <kbd className="rounded bg-muted px-1">R</kbd> reject
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
