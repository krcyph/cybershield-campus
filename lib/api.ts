/**
 * CyberShield Campus — Centralized API Client
 *
 * Thin fetch wrapper that:
 *  - Reads NEXT_PUBLIC_API_URL from env (never hardcodes the backend URL).
 *  - Attaches the JWT Bearer token stored in localStorage on authenticated calls.
 *  - Normalises errors into a typed ApiError.
 *  - Clears the session and redirects to /login on 401 responses.
 */

// ─── Base URL ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    // Fallback for local development; never commit a real URL here.
    return 'http://localhost:5000/api';
  }
  return url.replace(/\/$/, ''); // strip trailing slash
}

// ─── Error type ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly raw?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────
// Token is stored in localStorage; accessible only from client-side code.
// This is intentional — the app uses client-side navigation throughout.

const TOKEN_KEY = 'cs_token';

export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    // Mirror into a cookie so the Next.js Edge middleware can read it.
    // SameSite=Lax prevents CSRF while still allowing normal navigation.
    document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax`;
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    // Expire the cookie so the middleware stops seeing it.
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  },
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

type RequestOptions = {
  /** If true, the Authorization header is NOT attached (public endpoints). */
  public?: boolean;
};

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!options?.public) {
    const token = tokenStore.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(0, 'Network error — the server may be unreachable.');
  }

  // Handle 401: session expired or invalid — clear token and redirect
  if (res.status === 401) {
    tokenStore.clear();
    if (typeof window !== 'undefined') {
      // This module runs outside of React component context (no useRouter available),
      // so a full navigation is intentional here.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, `Unexpected response from server (${res.status}).`);
  }

  if (!res.ok) {
    const msg =
      (json as { message?: string })?.message ??
      `Request failed with status ${res.status}.`;
    throw new ApiError(res.status, msg, json);
  }

  return json as T;
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options);
  },
  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options);
  },
  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options);
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  },
};
