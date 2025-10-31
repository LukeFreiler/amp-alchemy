/**
 * Token Picker Component
 *
 * Command palette-style interface for selecting and inserting tokens
 */

'use client';

import { useState } from 'react';
import { Command } from 'cmdk';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { TokenMetadataResponse } from '../types/tokens';

interface TokenPickerProps {
  tokens: TokenMetadataResponse | null;
  loading: boolean;
  onInsert: (token: string) => void;
  trigger: React.ReactNode;
}

export function TokenPicker({ tokens, loading, onInsert, trigger }: TokenPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSelect = (token: string) => {
    onInsert(token);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Command shouldFilter={true}>
          <Command.Input
            placeholder="Search tokens..."
            value={search}
            onValueChange={setSearch}
            className="h-10 border-b border-border px-3 text-sm outline-none"
          />
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tokens...
              </div>
            ) : (
              'No tokens found'
            )}
          </Command.Empty>

          {tokens && (
            <Command.List className="max-h-80 overflow-y-auto p-2">
              {/* Field Tokens */}
              {tokens.fields.length > 0 && (
                <Command.Group heading={`FIELDS (${tokens.fields.length})`}>
                  {tokens.fields.map((field) => (
                    <Command.Item
                      key={field.token}
                      value={`${field.token} ${field.label} ${field.sectionTitle}`}
                      onSelect={() => handleSelect(field.token)}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-accent aria-selected:bg-accent"
                    >
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 bg-blue-500/10 text-xs"
                      >
                        field
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{field.label}</div>
                        <div className="text-xs text-muted-foreground">{field.sectionTitle}</div>
                        {field.value && (
                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            &ldquo;{field.value}&rdquo;
                          </div>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Section Tokens */}
              {tokens.sections.length > 0 && (
                <Command.Group heading={`SECTIONS (${tokens.sections.length})`}>
                  {tokens.sections.map((section) => (
                    <Command.Item
                      key={section.token}
                      value={`${section.token} ${section.label}`}
                      onSelect={() => handleSelect(section.token)}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-accent aria-selected:bg-accent"
                    >
                      <Badge
                        variant="outline"
                        className="border-purple-500/30 bg-purple-500/10 text-xs"
                      >
                        section
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{section.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {section.fieldCount} field{section.fieldCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Notes Tokens */}
              {tokens.notes.length > 0 && (
                <Command.Group heading={`NOTES (${tokens.notes.length})`}>
                  {tokens.notes.map((note) => (
                    <Command.Item
                      key={note.token}
                      value={`${note.token} ${note.label}`}
                      onSelect={() => handleSelect(note.token)}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-accent aria-selected:bg-accent"
                    >
                      <Badge
                        variant="outline"
                        className="border-green-500/30 bg-green-500/10 text-xs"
                      >
                        notes
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{note.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {note.hasContent ? 'Has content' : 'Empty'}
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Legacy Tokens */}
              <Command.Group heading="LEGACY">
                <Command.Item
                  value={`${tokens.legacy.fields_json.token} ${tokens.legacy.fields_json.label}`}
                  onSelect={() => handleSelect(tokens.legacy.fields_json.token)}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-accent aria-selected:bg-accent"
                >
                  <Badge variant="outline" className="text-xs">
                    json
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{tokens.legacy.fields_json.label}</div>
                    <div className="text-xs text-muted-foreground">Deprecated</div>
                  </div>
                </Command.Item>
                <Command.Item
                  value={`${tokens.legacy.notes_json.token} ${tokens.legacy.notes_json.label}`}
                  onSelect={() => handleSelect(tokens.legacy.notes_json.token)}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-accent aria-selected:bg-accent"
                >
                  <Badge variant="outline" className="text-xs">
                    json
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{tokens.legacy.notes_json.label}</div>
                    <div className="text-xs text-muted-foreground">Deprecated</div>
                  </div>
                </Command.Item>
              </Command.Group>
            </Command.List>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
