/**
 * Hook for managing inline token autocomplete behavior
 *
 * Detects {{ trigger in textarea, manages menu visibility, keyboard navigation,
 * cursor positioning, and token insertion.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef, RefObject } from 'react';

export interface TokenData {
  tag: string;
  label: string;
  help: string | null;
  section: string;
  type: 'ShortText' | 'LongText' | 'Toggle' | 'Utility';
  isUtility?: boolean;
}

interface UseTokenAutocompleteProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onInsert: (token: string) => void;
  tokens: TokenData[];
}

interface UseTokenAutocompleteReturn {
  isOpen: boolean;
  filteredTokens: TokenData[];
  selectedIndex: number;
  cursorPosition: { x: number; y: number } | null;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleInsert: (token: string) => void;
  handleClose: () => void;
  handleHover: (index: number) => void;
  handleClearHover: (clearFn: () => void) => void;
  handleUpdateNavigableCount: (count: number) => void;
  handleExposeGetTag: (getFn: (index: number) => string | null) => void;
}

const DEBOUNCE_MS = 150;

export function useTokenAutocomplete({
  textareaRef,
  value,
  onInsert,
  tokens,
}: UseTokenAutocompleteProps): UseTokenAutocompleteReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clearHoverRef = useRef<(() => void) | null>(null);
  const navigableCountRef = useRef<number>(0);
  const getTagByIndexRef = useRef<((index: number) => string | null) | null>(null);

  // Filter tokens based on query
  const filteredTokens = useMemo(() => {
    if (!filterQuery) return tokens;

    const query = filterQuery.toLowerCase();
    return tokens.filter(
      (token) =>
        token.label.toLowerCase().includes(query) || token.tag.toLowerCase().includes(query)
    );
  }, [tokens, filterQuery]);

  // Reset selected index when filtered tokens change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTokens]);

  // Calculate cursor position in pixels for floating menu
  const calculateCursorPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return null;

    const cursorIndex = textarea.selectionStart;
    const textareaRect = textarea.getBoundingClientRect();

    // Create a mirror div to measure text position
    const div = document.createElement('div');
    const style = window.getComputedStyle(textarea);

    // Copy relevant styles to mirror div
    const stylesToCopy = [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'letterSpacing',
      'lineHeight',
      'padding',
      'border',
      'boxSizing',
      'whiteSpace',
      'wordWrap',
      'overflowWrap',
    ] as const;

    stylesToCopy.forEach((prop) => {
      const value = style.getPropertyValue(prop);
      div.style.setProperty(prop, value);
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.width = `${textarea.clientWidth}px`;
    div.style.height = 'auto';
    div.style.top = '0';
    div.style.left = '0';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';

    // Add text up to cursor
    const textBeforeCursor = value.substring(0, cursorIndex);
    div.textContent = textBeforeCursor;

    // Add span at cursor position
    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);

    document.body.appendChild(div);

    const spanRect = span.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();

    // Calculate offset within the mirror div
    const offsetX = spanRect.left - divRect.left;
    const offsetY = spanRect.top - divRect.top;

    document.body.removeChild(div);

    // Calculate position relative to textarea position, accounting for scroll
    // offsetX and offsetY already include padding since we copied styles to mirror div
    const x = textareaRect.left + offsetX;
    const y = textareaRect.top + offsetY - textarea.scrollTop + parseInt(style.lineHeight || '20');

    return { x, y };
  }, [textareaRef, value]);

  // Check for {{ trigger and extract filter query
  const checkForTrigger = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorIndex = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorIndex);

    // Find last occurrence of {{
    const lastTriggerIndex = textBeforeCursor.lastIndexOf('{{');

    if (lastTriggerIndex === -1) {
      setIsOpen(false);
      setFilterQuery('');
      return;
    }

    // Check if there's a closing }} after the trigger
    const textAfterTrigger = textBeforeCursor.substring(lastTriggerIndex + 2);
    if (textAfterTrigger.includes('}}')) {
      setIsOpen(false);
      setFilterQuery('');
      return;
    }

    // Extract query between {{ and cursor
    const query = textAfterTrigger;

    // Open menu and set filter
    setIsOpen(true);
    setFilterQuery(query);

    // Calculate cursor position with debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const position = calculateCursorPosition();
      setCursorPosition(position);
    }, DEBOUNCE_MS);
  }, [textareaRef, value, calculateCursorPosition]);

  // Watch for changes in value to detect trigger
  useEffect(() => {
    checkForTrigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close menu
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setFilterQuery('');
    setSelectedIndex(0);
  }, []);

  // Insert token at cursor position
  const handleInsert = useCallback(
    (token: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorIndex = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorIndex);

      // Find start of {{ trigger
      const lastTriggerIndex = textBeforeCursor.lastIndexOf('{{');

      if (lastTriggerIndex === -1) {
        // Fallback: just insert at cursor
        onInsert(token);
      } else {
        // Replace from {{ to cursor with token
        onInsert(token);
      }

      // Close menu
      setIsOpen(false);
      setFilterQuery('');
    },
    [textareaRef, value, onInsert]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isOpen) return;

      const totalCount = navigableCountRef.current;
      if (totalCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (clearHoverRef.current) clearHoverRef.current(); // Clear hover state when using keyboard
          setSelectedIndex((prev) => (prev + 1) % totalCount);
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (clearHoverRef.current) clearHoverRef.current(); // Clear hover state when using keyboard
          setSelectedIndex((prev) => (prev - 1 + totalCount) % totalCount);
          break;

        case 'Enter':
          e.preventDefault();
          if (getTagByIndexRef.current) {
            const tag = getTagByIndexRef.current(selectedIndex);
            if (tag) {
              handleInsert(tag);
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          handleClose();
          break;

        default:
          // Let other keys pass through normally
          break;
      }
    },
    [isOpen, handleClose, handleInsert, selectedIndex]
  );


  // Update selected index when hovering
  const handleHover = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Store the clear hover function from the menu
  const handleClearHover = useCallback((clearFn: () => void) => {
    clearHoverRef.current = clearFn;
  }, []);

  // Update navigable count from menu
  const handleUpdateNavigableCount = useCallback((count: number) => {
    navigableCountRef.current = count;
  }, []);

  // Store the get tag function from menu
  const handleExposeGetTag = useCallback((getFn: (index: number) => string | null) => {
    getTagByIndexRef.current = getFn;
  }, []);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    filteredTokens,
    selectedIndex,
    cursorPosition,
    handleKeyDown,
    handleInsert,
    handleClose,
    handleHover,
    handleClearHover,
    handleUpdateNavigableCount,
    handleExposeGetTag,
  };
}
