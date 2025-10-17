/**
 * Blueprint Token Picker Component
 *
 * Shows available tokens based on blueprint schema (not session data)
 */

'use client';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from 'cmdk';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { BlueprintWithSections } from '@/features/blueprints/types/blueprint';

interface BlueprintTokenPickerProps {
  blueprint: BlueprintWithSections;
  onInsert: (token: string) => void;
  trigger: React.ReactNode;
}

export function BlueprintTokenPicker({ blueprint, onInsert, trigger }: BlueprintTokenPickerProps) {
  // Build token list from blueprint schema
  const fieldTokens = blueprint.sections.flatMap((section) =>
    section.fields.map((field) => ({
      token: `{{field:${field.key}}}`,
      label: field.label,
      description: `Field: ${field.key}`,
      category: 'field',
    }))
  );

  const sectionTokens = blueprint.sections.map((section) => ({
    token: `{{section:${section.id}}}`,
    label: section.title,
    description: `Section: All fields from "${section.title}"`,
    category: 'section',
  }));

  const legacyTokens = [
    {
      token: '{{fields_json}}',
      label: 'All Fields (JSON)',
      description: 'Legacy: All field values as JSON',
      category: 'legacy',
    },
    {
      token: '{{notes_json}}',
      label: 'All Notes (JSON)',
      description: 'Legacy: All section notes as JSON',
      category: 'legacy',
    },
  ];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'field':
        return <Badge className="bg-blue-500/10 text-blue-500">Field</Badge>;
      case 'section':
        return <Badge className="bg-purple-500/10 text-purple-500">Section</Badge>;
      case 'legacy':
        return <Badge className="bg-gray-500/10 text-gray-500">Legacy</Badge>;
      default:
        return null;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tokens..." />
          <CommandEmpty>No tokens found.</CommandEmpty>

          <div className="max-h-[400px] overflow-y-auto">
            {/* Field Tokens */}
            {fieldTokens.length > 0 && (
              <CommandGroup heading="Field Tokens">
                {fieldTokens.map((item) => (
                  <CommandItem
                    key={item.token}
                    onSelect={() => onInsert(item.token)}
                    className="flex items-start gap-3 py-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{item.token}</code>
                        {getCategoryBadge(item.category)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Section Tokens */}
            {sectionTokens.length > 0 && (
              <CommandGroup heading="Section Tokens">
                {sectionTokens.map((item) => (
                  <CommandItem
                    key={item.token}
                    onSelect={() => onInsert(item.token)}
                    className="flex items-start gap-3 py-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{item.token}</code>
                        {getCategoryBadge(item.category)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Legacy Tokens */}
            <CommandGroup heading="Legacy Tokens">
              {legacyTokens.map((item) => (
                <CommandItem
                  key={item.token}
                  onSelect={() => onInsert(item.token)}
                  className="flex items-start gap-3 py-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs">{item.token}</code>
                      {getCategoryBadge(item.category)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
