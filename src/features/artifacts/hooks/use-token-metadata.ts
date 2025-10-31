/**
 * Token Metadata Hook
 *
 * Fetches available tokens for a session
 */

import { useState, useEffect } from 'react';
import { TokenMetadataResponse } from '../types/tokens';

type TokenMetadataState = {
  tokens: TokenMetadataResponse | null;
  loading: boolean;
  error: string | null;
};

export function useTokenMetadata(sessionId: string): TokenMetadataState {
  const [state, setState] = useState<TokenMetadataState>({
    tokens: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchTokens = async () => {
      try {
        const response = await fetch(`/api/v1/sessions/${sessionId}/tokens`);
        const result = await response.json();

        if (cancelled) return;

        if (result.ok) {
          setState({ tokens: result.data, loading: false, error: null });
        } else {
          setState({
            tokens: null,
            loading: false,
            error: result.error?.message || 'Failed to fetch tokens',
          });
        }
      } catch (err) {
        console.error('Failed to fetch token metadata:', err);
        if (cancelled) return;
        setState({ tokens: null, loading: false, error: 'Network error' });
      }
    };

    fetchTokens();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return state;
}
