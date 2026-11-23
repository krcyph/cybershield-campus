'use client';

/**
 * CyberShield Campus — Auth Context
 *
 * Provides the authenticated user and helpers (login, logout) to the whole
 * component tree.  Token is persisted in localStorage via tokenStore.
 *
 * Usage:
 *   - Wrap the root layout's body in <AuthProvider>.
 *   - Anywhere in a client component: const { user, loading } = useAuth();
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore, ApiError } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'admin';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  enrollmentId?: string;
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the initial /api/auth/me check is in flight. */
  loading: boolean;
  /** Call after a successful login — stores the token and sets the user. */
  login(user: AuthUser, token: string): void;
  logout(): void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface MeResponse {
  success: boolean;
  data: { user: AuthUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const login = useCallback((authUser: AuthUser, token: string) => {
    tokenStore.set(token);
    setUser(authUser);
  }, []);

  // On mount: if a token exists, re-hydrate the user via /api/auth/me.
  // Also syncs the cookie so the middleware can read it immediately.
  useEffect(() => {
    const token = tokenStore.get();

    // Always resolve the loading state asynchronously to satisfy the
    // react-hooks/set-state-in-effect rule (no synchronous setState in effect body).
    const resolve = (authedUser: typeof user) => {
      setUser(authedUser);
      setLoading(false);
    };

    if (!token) {
      Promise.resolve().then(() => resolve(null));
      return;
    }

    // Re-sync cookie in case it was cleared (e.g. browser cookie expiry)
    tokenStore.set(token);

    api
      .get<MeResponse>('/auth/me')
      .then((res) => resolve(res.data.user))
      .catch((err) => {
        // 401 → token expired; tokenStore and redirect already handled in api.ts
        if (!(err instanceof ApiError && err.status === 401)) {
          tokenStore.clear();
        }
        resolve(null);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
