'use client';

/**
 * Session List Component
 *
 * Displays all sessions in a card grid with actions, filters, and start session modal
 */

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CrudHeader } from '@/components/ui/crud-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Session } from '@/features/sessions/types/session';
import { Blueprint } from '@/features/blueprints/types/blueprint';
import { StartSessionModal } from './start-session-modal';
import { SessionFilters } from './session-filters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SessionListProps {
  initialSessions: Session[];
  blueprints: Blueprint[];
  currentUserId: string;
}

export function SessionList({ initialSessions, blueprints, currentUserId }: SessionListProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>(initialSessions);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [quickActions, setQuickActions] = useState<ReactNode>(null);

  // Update sessions when initialSessions changes
  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const refetchSessions = async () => {
    try {
      const response = await fetch('/api/v1/sessions');
      const result = await response.json();

      if (result.ok) {
        setSessions(result.data);
      }
    } catch (error) {
      alert('Failed to load sessions');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/sessions/${deleteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(`Error: ${result.error.message}`);
      }
    } catch (error) {
      alert('Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSessionCreated = async (sessionId: string) => {
    setShowStartModal(false);
    await refetchSessions();
    router.push(`/sessions/${sessionId}`);
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Determine empty state type
  const hasFilters = filteredSessions.length < sessions.length || sessions.length === 0;
  const showEmptyFiltered = hasFilters && filteredSessions.length === 0 && sessions.length > 0;
  const showEmptyNoSessions = sessions.length === 0;

  return (
    <>
      <CrudHeader
        title="Sessions"
        description="Manage your data collection sessions"
        buttonText="Start Session"
        buttonIcon={Plus}
        onButtonClick={() => setShowStartModal(true)}
        showSeparator={false}
        quickActions={quickActions}
      />

      {sessions.length > 0 && (
        <SessionFilters
          sessions={sessions}
          blueprints={blueprints}
          currentUserId={currentUserId}
          onFilterChange={setFilteredSessions}
          renderQuickActions={setQuickActions}
        />
      )}

      {showEmptyNoSessions ? (
        <EmptyState
          icon={FileText}
          title="No sessions yet"
          description="Start your first data collection session"
        />
      ) : showEmptyFiltered ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No sessions match your filters</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              // This will be handled by the filter component's clear function
              const event = new CustomEvent('clearFilters');
              window.dispatchEvent(event);
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredSessions.length} of {sessions.length} sessions
          </div>
          <TooltipProvider delayDuration={200}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSessions.map((session) => (
                <Card
                  key={session.id}
                  className="flex flex-col p-6 transition-colors hover:bg-card/80"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{session.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{session.blueprint_name}</p>
                      {session.created_by_name && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          Created by: {session.created_by_name}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="mb-4 text-sm text-muted-foreground">
                    <span>{formatDate(session.updated_at)}</span>
                  </div>

                  {/* Progress bar */}
                  {(session.required_count || 0) > 0 || (session.total_count || 0) > 0 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mb-4 cursor-help">
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                            {(session.required_count || 0) > 0 ? (
                              <>
                                {/* Background layer: overall progress (lighter) */}
                                <div
                                  className="absolute inset-0 h-2 rounded-full bg-primary/30 transition-all"
                                  style={{
                                    width: `${session.total_count ? Math.round(((session.total_filled_count || 0) / session.total_count) * 100) : 0}%`,
                                  }}
                                />
                                {/* Foreground layer: required progress (primary) */}
                                <div
                                  className="absolute inset-0 h-2 rounded-full bg-primary transition-all"
                                  style={{
                                    width: `${session.required_count ? Math.round(((session.required_filled_count || 0) / session.required_count) * 100) : 0}%`,
                                  }}
                                />
                              </>
                            ) : (
                              /* Single bar: overall progress only */
                              <div
                                className="h-2 rounded-full bg-primary transition-all"
                                style={{
                                  width: `${session.total_count ? Math.round(((session.total_filled_count || 0) / session.total_count) * 100) : 0}%`,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          {(session.required_count || 0) > 0 ? (
                            <>
                              <div>
                                <span className="font-medium">Required:</span>{' '}
                                {session.required_filled_count || 0}/{session.required_count} (
                                {session.required_count
                                  ? Math.round(
                                      ((session.required_filled_count || 0) /
                                        session.required_count) *
                                        100
                                    )
                                  : 0}
                                %)
                              </div>
                              <div>
                                <span className="font-medium">Overall:</span>{' '}
                                {session.total_filled_count || 0}/{session.total_count} (
                                {session.total_count
                                  ? Math.round(
                                      ((session.total_filled_count || 0) / session.total_count) *
                                        100
                                    )
                                  : 0}
                                %)
                              </div>
                            </>
                          ) : (
                            <div>
                              <span className="font-medium">Progress:</span>{' '}
                              {session.total_filled_count || 0}/{session.total_count} (
                              {session.total_count
                                ? Math.round(
                                    ((session.total_filled_count || 0) / session.total_count) * 100
                                  )
                                : 0}
                              %)
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : null}

                  <div className="mt-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/sessions/${session.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(session.id)}
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TooltipProvider>
        </>
      )}

      <StartSessionModal
        open={showStartModal}
        onOpenChange={setShowStartModal}
        onSessionCreated={handleSessionCreated}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The session and all its data will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
