'use client';

/**
 * Session Filters Component
 *
 * Provides filtering UI for sessions with:
 * - Search by session name
 * - Filter by status, blueprint, owner
 * - Sort by various criteria
 * - Quick filter pills (My Sessions, All Sessions, Incomplete)
 * - Active filter count badge
 * - URL query param persistence
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Session, SessionStatus } from '@/features/sessions/types/session';
import { Blueprint } from '@/features/blueprints/types/blueprint';

interface SessionFiltersProps {
  sessions: Session[];
  blueprints: Blueprint[];
  currentUserId: string;
  onFilterChange: (filtered: Session[]) => void;
}

type SortOption = 'recent' | 'oldest' | 'name-asc' | 'name-desc' | 'completion';

interface FilterState {
  search: string;
  status: SessionStatus | 'all';
  blueprint: string;
  owner: string;
  sort: SortOption;
}

interface Creator {
  id: string;
  name: string;
}

export function SessionFilters({
  sessions,
  blueprints,
  currentUserId,
  onFilterChange,
}: SessionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL or defaults
  const [filters, setFilters] = useState<FilterState>(() => ({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as SessionStatus) || 'all',
    blueprint: searchParams.get('blueprint') || 'all',
    owner: searchParams.get('owner') || currentUserId, // Default to "My Sessions"
    sort: (searchParams.get('sort') as SortOption) || 'recent',
  }));

  const [searchInput, setSearchInput] = useState(filters.search);

  // Extract unique creators from sessions
  const creators = useMemo(() => {
    const creatorMap = new Map<string, Creator>();
    sessions.forEach((session) => {
      if (session.created_by && session.created_by_name) {
        creatorMap.set(session.created_by, {
          id: session.created_by,
          name: session.created_by_name,
        });
      }
    });
    return Array.from(creatorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Apply filters and notify parent
  useEffect(() => {
    let filtered = [...sessions];

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(searchLower));
    }

    // Status
    if (filters.status !== 'all') {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    // Blueprint
    if (filters.blueprint !== 'all') {
      filtered = filtered.filter((s) => s.blueprint_id === filters.blueprint);
    }

    // Owner
    if (filters.owner !== 'all') {
      filtered = filtered.filter((s) => s.created_by === filters.owner);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'oldest':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'completion': {
          const getCompletionPercent = (s: Session) => {
            if (!s.required_count || s.required_count === 0) return 0;
            return ((s.required_filled_count || 0) / s.required_count) * 100;
          };
          return getCompletionPercent(b) - getCompletionPercent(a);
        }
        default:
          return 0;
      }
    });

    onFilterChange(filtered);

    // Update URL
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.blueprint !== 'all') params.set('blueprint', filters.blueprint);
    if (filters.owner !== 'all') params.set('owner', filters.owner);
    if (filters.sort !== 'recent') params.set('sort', filters.sort);

    const queryString = params.toString();
    const url = queryString ? `/sessions?${queryString}` : '/sessions';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Next.js 15 strict Route typing
    router.replace(url, { scroll: false });
  }, [filters, sessions, onFilterChange, router]);

  // Count active filters (excluding default "My Sessions")
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.blueprint !== 'all') count++;
    if (filters.owner !== 'all' && filters.owner !== currentUserId) count++;
    if (filters.sort !== 'recent') count++;
    return count;
  }, [filters, currentUserId]);

  const handleQuickFilter = (type: 'mine' | 'all' | 'incomplete') => {
    switch (type) {
      case 'mine':
        setFilters({
          search: '',
          status: 'all',
          blueprint: 'all',
          owner: currentUserId,
          sort: 'recent',
        });
        setSearchInput('');
        break;
      case 'all':
        setFilters({
          search: '',
          status: 'all',
          blueprint: 'all',
          owner: 'all',
          sort: 'recent',
        });
        setSearchInput('');
        break;
      case 'incomplete':
        setFilters({
          search: '',
          status: 'in_progress',
          blueprint: 'all',
          owner: 'all',
          sort: 'recent',
        });
        setSearchInput('');
        break;
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      blueprint: 'all',
      owner: currentUserId, // Reset to "My Sessions"
      sort: 'recent',
    });
    setSearchInput('');
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filters.owner === currentUserId && filters.status === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('mine')}
        >
          My Sessions
        </Button>
        <Button
          variant={filters.owner === 'all' && filters.status === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('all')}
        >
          All Sessions
        </Button>
        <Button
          variant={filters.status === 'in_progress' && filters.owner === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('incomplete')}
        >
          Incomplete
        </Button>

        {/* Active Filter Badge */}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
          </Badge>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="ml-auto h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value as SessionStatus | 'all' }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Blueprint Filter */}
          <Select
            value={filters.blueprint}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, blueprint: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Blueprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blueprints</SelectItem>
              {blueprints.map((blueprint) => (
                <SelectItem key={blueprint.id} value={blueprint.id}>
                  {blueprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Owner Filter */}
          <Select
            value={filters.owner}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, owner: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {creators.map((creator) => (
                <SelectItem key={creator.id} value={creator.id}>
                  {creator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select
            value={filters.sort}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, sort: value as SortOption }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="completion">Completion %</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
