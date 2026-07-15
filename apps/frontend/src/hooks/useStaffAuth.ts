import { useState, useCallback } from 'react';
import { setStaffToken } from '../auth/staffToken';

interface AuthResponse {
  token: string;
  expiresIn: number; // seconds
}

/**
 * Hook to manage staff authentication state.
 * Stores the token in memory only (no localStorage) and clears it on expiry or page reload.
 */
export function useStaffAuth() {
  const [token, setTokenState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sync token state to the global in-memory staffToken wrapper
  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    setIsAuthenticated(!!t);
    setStaffToken(t);
  }, []);

  const login = useCallback(async (code: string) => {
    const response = await fetch('/api/staff/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed');
    }
    const data: AuthResponse = await response.json();
    setToken(data.token);
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  return { token, isAuthenticated, login, logout };
}
