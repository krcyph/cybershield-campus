/**
 * CyberShield Campus — Socket.io Client Manager
 *
 * Singleton that manages a single socket.io connection per browser session.
 *
 * Authentication contract (must match backend socketServer.ts):
 *   - Token passed in handshake.auth.token
 *   - Backend verifies the JWT and derives userId + role from it
 *   - Backend assigns rooms server-side (user:{id}, students, admins)
 *   - Clients never send room-join requests
 *
 * Usage:
 *   connectSocket(token)  — call after login / session restore
 *   disconnectSocket()    — call on logout
 *   getSocket()           — returns the active Socket or null
 */

import { io, Socket } from 'socket.io-client';
import { tokenStore } from './api';

// ─── Event names (mirror of backend notificationService.ts) ──────────────────
// These are the ONLY events the frontend listens to.
// If the backend adds new events, add them here too.

export const SOCKET_EVENTS = {
  /** Targeted to the reporter's own room — incident status changed by admin */
  INCIDENT_STATUS_UPDATED: 'incident:statusUpdated',
  /** Broadcast to all connected students — a new advisory was published */
  ADVISORY_PUBLISHED: 'advisory:published',
  /** Backend emits this alongside both specific events — a catch-all listener */
  NOTIFICATION_NEW: 'notification:new',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// ─── Notification payload shape (mirrors backend NotificationPayload) ─────────

export interface NotificationPayload {
  type:        SocketEventName;
  title:       string;
  message:     string;
  referenceId: string;   // incidentId or advisoryId — never MongoDB _id
  timestamp:   string;   // ISO 8601
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let socket: Socket | null = null;

function getWsUrl(): string {
  // Falls back to same origin as the API if not explicitly set
  const url = process.env['NEXT_PUBLIC_WS_URL'];
  return url ?? 'http://localhost:5000';
}

// ─── Connect ──────────────────────────────────────────────────────────────────

/**
 * Create and connect the socket using the provided JWT.
 * Safe to call multiple times — returns the existing socket if already connected.
 * The token is passed in handshake.auth.token as the backend expects.
 */
export function connectSocket(token: string): Socket {
  // If a socket already exists and is connected with the same auth, reuse it.
  if (socket && socket.connected) {
    return socket;
  }

  // If a socket exists but is disconnected (e.g. from a previous session), clean it up.
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(getWsUrl(), {
    // Backend auth middleware reads from handshake.auth.token
    auth: { token },
    // Reconnect with exponential backoff — do not flood the server
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10_000,
    // Use WebSocket first, fall back to polling
    transports: ['websocket', 'polling'],
    // Do not auto-connect — connect() is called explicitly below
    autoConnect: false,
  });

  socket.on('connect', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Socket] Connected:', socket?.id);
    }
  });

  socket.on('connect_error', (err) => {
    if (process.env.NODE_ENV === 'development') {
      // Error message may contain AUTH_REQUIRED / AUTH_EXPIRED — log in dev only
      console.warn('[Socket] Connection error:', err.message);
    }
  });

  socket.on('disconnect', (reason) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Socket] Disconnected:', reason);
    }
  });

  socket.connect();
  return socket;
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

/**
 * Disconnect and destroy the socket.
 * Called on logout or session expiry.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// ─── Accessor ─────────────────────────────────────────────────────────────────

/** Returns the active Socket instance, or null if not connected. */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Convenience: connect using the token currently in localStorage.
 * Returns null if no token is available.
 */
export function connectSocketFromStorage(): Socket | null {
  const token = tokenStore.get();
  if (!token) return null;
  return connectSocket(token);
}
