'use client';

/**
 * CyberShield Campus — Notification Bell
 *
 * A self-contained bell icon button with:
 *   - Unread count badge
 *   - Click-to-open dropdown panel
 *   - Per-notification display (title, message, timestamp)
 *   - Mark all read + Clear all actions
 *   - Click-outside to close
 *
 * Reads from NotificationContext — no prop drilling needed.
 * Consistent with the existing dark CyberShield design.
 */

import { useEffect, useRef, useState } from 'react';
import { Bell, X, CheckCheck, Trash2, ShieldAlert, FileWarning } from 'lucide-react';
import { useNotifications } from '@/lib/notifications';
import type { AppNotification } from '@/lib/notifications';
import { SOCKET_EVENTS } from '@/lib/socket';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function NotificationIcon({ type }: { type: AppNotification['type'] }) {
  if (type === SOCKET_EVENTS.INCIDENT_STATUS_UPDATED) {
    return <FileWarning size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />;
  }
  return <ShieldAlert size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Mark all read when the panel opens
  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      // Slight delay so badge is still visible during the open animation
      setTimeout(() => markAllRead(), 300);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {unreadCount === 0 && notifications.length === 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-700 rounded-full" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#111827] border border-slate-700 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded-md hover:bg-slate-800"
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-md hover:bg-slate-800"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-slate-800"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No notifications yet.</p>
                <p className="text-xs text-slate-600 mt-1">Incident updates and new advisories will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 transition-colors ${notif.read ? 'opacity-60' : 'bg-blue-950/10'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <NotificationIcon type={notif.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed break-words">{notif.message}</p>
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <span className="text-[10px] text-slate-600 font-mono">{notif.referenceId}</span>
                        <span className="text-[10px] text-slate-600 flex-shrink-0">{relativeTime(notif.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-800 bg-[#0d1421]">
              <p className="text-[10px] text-slate-600 text-center">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} this session
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
