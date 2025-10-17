/**
 * Blueprint Token Picker Component
 *
 * Simple, clean token browser with human-readable tags
 */

'use client';

import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BlueprintWithSections } from '@/features/blueprints/types/blueprint';
import { Hash } from 'lucide-react';

interface BlueprintTokenPickerProps {
  blueprint: BlueprintWithSections;
  onInsert: (token: string) => void;
  trigger: React.ReactNode;
}

export function BlueprintTokenPicker({ blueprint, onInsert, trigger }: BlueprintTokenPickerProps) {
  const [open, setOpen] = useState(false);

  // Build simple, readable tokens organized by section
  const tokensBySection = blueprint.sections.map((section) => ({
    sectionName: section.title,
    tokens: section.fields.map((field) => ({
      tag: `{{${field.key}}}`,
      label: field.label,
      help: field.help_text,
    })),
  }));

  const handleSelect = (token: string) => {
    onInsert(token);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start" side="bottom">
        <Command>
          <CommandInput placeholder="Search fields..." />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No fields found.</CommandEmpty>

            {tokensBySection.map((section, idx) => (
              <CommandGroup key={idx} heading={section.sectionName}>
                {section.tokens.map((token, tidx) => (
                  <CommandItem
                    key={tidx}
                    onSelect={() => handleSelect(token.tag)}
                    className="flex items-center justify-between gap-4 px-3 py-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{token.label}</span>
                      </div>
                      {token.help && (
                        <p className="ml-5 text-xs text-muted-foreground">{token.help}</p>
                      )}
                    </div>
                    <code className="text-xs text-muted-foreground">{token.tag}</code>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
