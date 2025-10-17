/**
 * Token Resolution Hook
 *
 * Resolves tokens in a template with debouncing
 */

import { useState, useEffect } from 'react';
import { parseTokens } from '../utils/token-parser';
import { TokenValidationError } from '../types/tokens';

type TokenResolutionState = {
  resolved: string | null;
  errors: TokenValidationError[];
  loading: boolean;
};

export function useTokenResolution(
  sessionId: string,
  template: string
): TokenResolutionState {
  const [state, setState] = useState<TokenResolutionState>({
    resolved: null,
    errors: [],
    loading: false,
  });

  useEffect(() => {
    if (!template.trim()) {
      setState({ resolved: null, errors: [], loading: false });
      return;
    }

    // Debounce resolution (300ms like autosave)
    const timeoutId = setTimeout(async () => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        // Extract tokens from template
        const tokens = parseTokens(template);

        if (tokens.length === 0) {
          // No tokens to resolve, just return template
          setState({ resolved: template, errors: [], loading: false });
          return;
        }

        // Fetch token metadata to validate and resolve
        const response = await fetch(`/api/v1/sessions/${sessionId}/tokens`);
        const result = await response.json();

        if (!result.ok) {
          setState({
            resolved: null,
            errors: [{ token: '', type: 'field', message: 'Failed to fetch token metadata' }],
            loading: false,
          });
          return;
        }

        // For preview, we'll do client-side resolution
        // In a full implementation, you could call an API endpoint to resolve server-side
        // For now, just show the template with token validation
        const tokenData = result.data;
        const validationErrors: TokenValidationError[] = [];

        tokens.forEach((token) => {
          if (token.type === 'field') {
            const exists = tokenData.fields.some((f: { fieldKey: string }) => f.fieldKey === token.key);
            if (!exists) {
              validationErrors.push({
                token: token.raw,
                type: 'field',
                message: `Field not found: ${token.key}`,
              });
            }
          }
        });

        // Simple resolution for preview (replace with actual values)
        let resolved = template;
        tokens.forEach((token) => {
          if (token.type === 'field') {
            const field = tokenData.fields.find((f: { fieldKey: string }) => f.fieldKey === token.key);
            if (field) {
              resolved = resolved.replace(token.raw, field.value || '(empty)');
            }
          }
          // Add more resolution logic as needed
        });

        setState({
          resolved: validationErrors.length === 0 ? resolved : template,
          errors: validationErrors,
          loading: false,
        });
      } catch (err) {
        setState({
          resolved: null,
          errors: [{ token: '', type: 'field', message: 'Resolution error' }],
          loading: false,
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [sessionId, template]);

  return state;
}
