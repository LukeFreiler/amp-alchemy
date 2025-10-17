/**
 * Floating autocomplete menu for token insertion
 *
 * Displays filtered blueprint field tokens organized by section with keyboard navigation.
 * Shows recently used tokens at the top for quick access.
 */

'use client';

import { RefObject, useMemo } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { Type, AlignLeft, ToggleLeft, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenData } from '@/features/blueprints/hooks/use-token-autocomplete';

interface TokenAutocompleteMenuProps {
  isOpen: boolean;
  tokens: TokenData[];
  recentTokens: string[];
  selectedIndex: number;
  cursorPosition: { x: number; y: number };
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onSelect: (token: string) => void;
  onClose: () => void;
}

export function TokenAutocompleteMenu({
  isOpen,
  tokens,
  recentTokens,
  selectedIndex,
  cursorPosition,
  onSelect,
}: TokenAutocompleteMenuProps) {
  // Group tokens by section
  const groupedTokens = useMemo(() => {
    const groups = new Map<string, TokenData[]>();

    tokens.forEach((token) => {
      const section = token.section;
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)!.push(token);
    });

    return Array.from(groups.entries()).map(([section, sectionTokens]) => ({
      section,
      tokens: sectionTokens,
    }));
  }, [tokens]);

  // Get recently used tokens that are in the current filtered set
  const recentTokensData = useMemo(() => {
    return recentTokens
      .map((tag) => tokens.find((t) => t.tag === tag))
      .filter((t): t is TokenData => t !== undefined);
  }, [recentTokens, tokens]);

  if (!isOpen) return null;

  // Calculate global index for each token
  const getGlobalIndex = (token: TokenData): number => {
    let index = 0;

    // Add recent tokens count
    if (recentTokensData.length > 0) {
      const recentIndex = recentTokensData.findIndex((t) => t.tag === token.tag);
      if (recentIndex !== -1) {
        return recentIndex;
      }
      index += recentTokensData.length;
    }

    // Add tokens from sections
    for (const group of groupedTokens) {
      const tokenIndex = group.tokens.findIndex((t) => t.tag === token.tag);
      if (tokenIndex !== -1) {
        return index + tokenIndex;
      }
      index += group.tokens.length;
    }

    return -1;
  };

  return (
    <FloatingPortal>
      <div
        className="fixed z-50 w-[400px] max-h-[300px] bg-elevated border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          left: `${cursorPosition.x}px`,
          top: `${cursorPosition.y + 4}px`,
        }}
      >
        {/* Recently Used Section */}
        {recentTokensData.length > 0 && (
          <div className="border-b border-divider">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-card">
              Recently Used
            </div>
            <div className="max-h-[120px] overflow-y-auto">
              {recentTokensData.map((token) => (
                <TokenMenuItem
                  key={token.tag}
                  token={token}
                  selected={getGlobalIndex(token) === selectedIndex}
                  onClick={() => onSelect(token.tag)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Tokens by Section */}
        <div className="overflow-y-auto max-h-[240px]">
          {groupedTokens.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching fields found
            </div>
          ) : (
            groupedTokens.map((group) => (
              <div key={group.section}>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-card sticky top-0">
                  {group.section}
                </div>
                {group.tokens.map((token) => (
                  <TokenMenuItem
                    key={token.tag}
                    token={token}
                    selected={getGlobalIndex(token) === selectedIndex}
                    onClick={() => onSelect(token.tag)}
                  />
                ))}
              </div>
            ))
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

interface TokenMenuItemProps {
  token: TokenData;
  selected: boolean;
  onClick: () => void;
}

function TokenMenuItem({ token, selected, onClick }: TokenMenuItemProps) {
  const Icon = getIconForType(token.type);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
        selected ? 'bg-hover' : 'hover:bg-hover'
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{token.label}</div>
        {token.help && <div className="text-xs text-muted-foreground truncate">{token.help}</div>}
      </div>
      <code className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
        {token.tag}
      </code>
    </div>
  );
}

function getIconForType(type: string) {
  switch (type) {
    case 'ShortText':
      return Type;
    case 'LongText':
      return AlignLeft;
    case 'Toggle':
      return ToggleLeft;
    default:
      return Hash;
  }
}
