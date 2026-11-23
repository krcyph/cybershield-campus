'use client';

/**
 * CyberShield Campus — Notification Context
 *
 * Manages in-memory notifications received over Socket.io.
 * Notifications are NOT persisted to a database — they live for the session.
 *
 * Socket lifecycle:
 *   - Connect when a user is authenticated (token available, user loaded).
 *   - Disconnect on logout.
 *   - Register NOTIFICATION_NEW listener once; clean up on unmount/user change.
 *
 * Event names (from lib/socket.ts, mirrors backend notificationService.ts):
 *   - notification:new  — catch-all emitted alongside every specific event
 *
 * We listen only to notification:new so we receive exactly one notification
 * per event regardless of which specific event was also emitted.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './auth';
import { tokenStore } from './api';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  SOCKET_EVENTS,
  type NotificationPayload,
} from './socket';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppNotification extends NotificationPayload {
  /** Client-side unique ID for React keys and deduplication */
  id:   string;
  read: boolean;
}

interface NotificationContextValue {
  notifications:  AppNotification[];
  unreadCount:    number;
  markAllRead():  void;
  clearAll():     void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0;
function nextId(): string {
  return `notif-${Date.now()}-${++_idCounter}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Track the user ID the socket was last connected for — used to detect user changes
  const connectedForUserRef = useRef<string | null>(null);

  const addNotification = useCallback((payload: NotificationPayload) => {
    setNotifications((prev) => {
      // Deduplicate: drop if the same referenceId + type arrived within 2 s
      const isDuplicate = prev.some(
        (n) =>
          n.referenceId === payload.referenceId &&
          n.type === payload.type &&
          Date.now() - new Date(n.timestamp).getTime() < 2000,
      );
      if (isDuplicate) return prev;
      const newNotif: AppNotification = { ...payload, id: nextId(), read: false };
      // Newest first, cap at 50
      return [newNotif, ...prev].slice(0, 50);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Socket lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    // Wait until auth has resolved
    if (authLoading) return;

    if (!user) {
      // Logged out — disconnect and schedule clear asynchronously
      // (satisfies the react-hooks/set-state-in-effect lint rule)
      disconnectSocket();
      connectedForUserRef.current = null;
      Promise.resolve().then(() => setNotifications([]));
      return;
    }

    // User is authenticated — connect if not already connected for this user
    const token = tokenStore.get();
    if (!token) return;

    // If we're already connected for this exact user, just ensure the listener is registered
    if (connectedForUserRef.current !== user.id) {
      // Different user (e.g. re-login) — disconnect the old socket first
      disconnectSocket();
      connectedForUserRef.current = user.id;
      connectSocket(token);
    }

    const sock = getSocket();
    if (!sock) return;

    // Register the catch-all notification listener.
    // Using notification:new means we receive exactly one notification per
    // backend event (backend emits the specific event AND notification:new).
    const handler = (payload: NotificationPayload) => {
      addNotification(payload);
    };

    sock.on(SOCKET_EVENTS.NOTIFICATION_NEW, handler);

    // Cleanup: remove this specific listener on re-run or unmount.
    // The socket itself stays connected — only the listener is removed here.
    return () => {
      sock.off(SOCKET_EVENTS.NOTIFICATION_NEW, handler);
    };
  }, [user, authLoading, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
