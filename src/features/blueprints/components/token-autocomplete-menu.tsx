/**
 * Floating autocomplete menu for token insertion
 *
 * Displays filtered blueprint field tokens organized by section with keyboard navigation.
 * Shows recently used tokens at the top for quick access.
 */

'use client';

import { RefObject, useMemo, useState, useEffect, useRef, forwardRef } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { Type, AlignLeft, ToggleLeft, Hash, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenData } from '@/features/blueprints/hooks/use-token-autocomplete';

interface TokenAutocompleteMenuProps {
  isOpen: boolean;
  tokens: TokenData[];
  selectedIndex: number;
  cursorPosition: { x: number; y: number };
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onSelect: (token: string) => void;
  onClose: () => void;
  onHover: (index: number) => void;
  onClearHover: (clearFn: () => void) => void;
  onUpdateNavigableCount: (count: number) => void;
  onExposeGetTag: (getFn: (index: number) => string | null) => void;
}

export function TokenAutocompleteMenu({
  isOpen,
  tokens,
  selectedIndex,
  cursorPosition,
  onSelect,
  onHover,
  onClearHover,
  onUpdateNavigableCount,
  onExposeGetTag,
}: TokenAutocompleteMenuProps) {
  const [hoverIndex, setHoverIndex] = useState<number>(-1);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // Expose clear hover function to parent
  useEffect(() => {
    onClearHover(() => setHoverIndex(-1));
  }, [onClearHover]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && hoverIndex === -1) {
      // Only auto-scroll when using keyboard (not hovering)
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, hoverIndex]);

  // Group tokens by section and create section tokens
  const groupedTokens = useMemo(() => {
    const groups = new Map<string, TokenData[]>();

    tokens.forEach((token) => {
      const section = token.section;
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)!.push(token);
    });

    return Array.from(groups.entries()).map(([section, sectionTokens]) => {
      // Generate section key for the token tag
      const sectionKey = section
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      return {
        section,
        sectionToken: {
          tag: `{{section_${sectionKey}}}`,
          label: section,
          help: `All fields in ${section}`,
          section,
          type: 'Utility' as const,
          isUtility: true,
        } as TokenData,
        tokens: sectionTokens,
      };
    });
  }, [tokens]);

  // Create flattened navigable list (sections + tokens)
  const navigableItems = useMemo(() => {
    const items: Array<{ type: 'section' | 'token'; data: TokenData; sectionName: string }> = [];

    groupedTokens.forEach((group) => {
      // Add section header as navigable item
      items.push({
        type: 'section',
        data: group.sectionToken,
        sectionName: group.section,
      });

      // Add all tokens in this section
      group.tokens.forEach((token) => {
        items.push({
          type: 'token',
          data: token,
          sectionName: group.section,
        });
      });
    });

    return items;
  }, [groupedTokens]);

  // Notify parent of total navigable count
  useEffect(() => {
    onUpdateNavigableCount(navigableItems.length);
  }, [navigableItems.length, onUpdateNavigableCount]);

  // Expose function to get tag by index
  useEffect(() => {
    onExposeGetTag((index: number) => {
      const item = navigableItems[index];
      return item ? item.data.tag : null;
    });
  }, [navigableItems, onExposeGetTag]);

  if (!isOpen) return null;

  // Calculate global index for any item
  const getGlobalIndex = (token: TokenData, itemType: 'section' | 'token'): number => {
    return navigableItems.findIndex(
      (item) => item.type === itemType && item.data.tag === token.tag
    );
  };

  return (
    <FloatingPortal>
      <div
        className="fixed z-50 w-[400px] max-h-[300px] bg-elevated border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          left: `${cursorPosition.x}px`,
          top: `${cursorPosition.y + 4}px`,
        }}
        onMouseLeave={() => setHoverIndex(-1)}
      >
        {/* All Tokens by Section */}
        <div className="overflow-y-auto max-h-[240px]">
          {groupedTokens.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching fields found
            </div>
          ) : (
            groupedTokens.map((group) => {
              const sectionIndex = getGlobalIndex(group.sectionToken, 'section');
              const isSectionPrimary = hoverIndex >= 0
                ? sectionIndex === hoverIndex
                : sectionIndex === selectedIndex;

              return (
                <div key={group.section}>
                  {/* Selectable Section Header */}
                  <SectionHeader
                    ref={isSectionPrimary && hoverIndex === -1 ? selectedItemRef : null}
                    sectionToken={group.sectionToken}
                    isPrimary={isSectionPrimary}
                    onMouseEnter={() => {
                      setHoverIndex(sectionIndex);
                      onHover(sectionIndex);
                    }}
                    onClick={() => onSelect(group.sectionToken.tag)}
                  />

                  {/* Section Tokens */}
                  {group.tokens.map((token) => {
                    const globalIndex = getGlobalIndex(token, 'token');
                    const isPrimary = hoverIndex >= 0
                      ? globalIndex === hoverIndex
                      : globalIndex === selectedIndex;
                    return (
                      <TokenMenuItem
                        key={token.tag}
                        ref={isPrimary && hoverIndex === -1 ? selectedItemRef : null}
                        token={token}
                        isPrimary={isPrimary}
                        onMouseEnter={() => {
                          setHoverIndex(globalIndex);
                          onHover(globalIndex);
                        }}
                        onClick={() => onSelect(token.tag)}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="border-t border-divider px-3 py-2 text-xs text-muted-foreground bg-card">
          <span className="inline-flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>⏎ Insert</span>
            <span>⎋ Close</span>
          </span>
        </div>
      </div>
    </FloatingPortal>
  );
}

interface SectionHeaderProps {
  sectionToken: TokenData;
  isPrimary: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ sectionToken, isPrimary, onMouseEnter, onClick }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors sticky top-0 z-10',
          'text-xs font-semibold',
          isPrimary
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
        )}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      >
        <Sparkles className={cn(
          "h-3.5 w-3.5 flex-shrink-0",
          isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
        )} />
        <div className="flex-1 min-w-0">
          <div className="truncate">{sectionToken.label}</div>
        </div>
        <code className={cn(
          "text-[10px] font-mono truncate max-w-[120px]",
          isPrimary ? "text-primary-foreground/80" : "text-muted-foreground/70"
        )}>
          {sectionToken.tag}
        </code>
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

interface TokenMenuItemProps {
  token: TokenData;
  isPrimary: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

const TokenMenuItem = forwardRef<HTMLDivElement, TokenMenuItemProps>(
  ({ token, isPrimary, onMouseEnter, onClick }, ref) => {
    const Icon = getIconForType(token.type);

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
          isPrimary
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/20 hover:bg-muted/30'
        )}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      >
        <Icon className={cn(
          "h-4 w-4 flex-shrink-0",
          isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
        )} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{token.label}</div>
          {token.help && (
            <div className={cn(
              "text-xs truncate",
              isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              {token.help}
            </div>
          )}
        </div>
        <code className={cn(
          "text-xs font-mono truncate max-w-[120px]",
          isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          {token.tag}
        </code>
      </div>
    );
  }
);

TokenMenuItem.displayName = 'TokenMenuItem';

function getIconForType(type: string) {
  switch (type) {
    case 'ShortText':
      return Type;
    case 'LongText':
      return AlignLeft;
    case 'Toggle':
      return ToggleLeft;
    case 'Utility':
      return Sparkles;
    default:
      return Hash;
  }
}
