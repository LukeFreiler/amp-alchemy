'use client';

/**
 * Session List Component
 *
 * Displays all sessions in a card grid with actions and start session modal
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2 } from 'lucide-react';
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
import { StartSessionModal } from './start-session-modal';

export function SessionList() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/v1/sessions');
      const result = await response.json();

      if (result.ok) {
        setSessions(result.data);
      }
    } catch (error) {
      alert('Failed to load sessions');
    } finally {
      setIsLoading(false);
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

  const handleSessionCreated = (sessionId: string) => {
    setShowStartModal(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading sessions...</p>
      </div>
    );
  }

  return (
    <>
      <CrudHeader
        title="Sessions"
        description="Manage your data collection sessions"
        buttonText="Start Session"
        buttonIcon={Plus}
        onButtonClick={() => setShowStartModal(true)}
        showSeparator={sessions.length > 0}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No sessions yet"
          description="Start your first data collection session"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Card key={session.id} className="flex flex-col p-6 transition-colors hover:bg-card/80">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{session.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{session.blueprint_name}</p>
                </div>
                <Badge className={getStatusColor(session.status)}>
                  {session.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span>v{session.blueprint_version}</span>
                <span>•</span>
                <span>{formatDate(session.updated_at)}</span>
              </div>

              <div className="mt-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/sessions/${session.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
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
