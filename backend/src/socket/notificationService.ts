/**
 * Notification Service — CyberShield Campus
 *
 * Typed helpers that controllers call to emit Socket.io events.
 * All emit calls are non-blocking: REST responses are never delayed by them.
 * If the socket server is not initialised (e.g. tests), calls are silently
 * skipped — REST APIs remain fully functional.
 */

import { getSocketServer, userRoom, STUDENT_BROADCAST_ROOM } from './socketServer';

// ─── Event names (single source of truth) ────────────────────────────────────

export const EVENTS = {
  INCIDENT_STATUS_UPDATED: 'incident:statusUpdated',
  ADVISORY_PUBLISHED:      'advisory:published',
  NOTIFICATION_NEW:        'notification:new',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];

// ─── Shared notification payload ──────────────────────────────────────────────

export interface NotificationPayload {
  type:        EventName;
  title:       string;
  message:     string;
  referenceId: string;    // incidentId or advisoryId — never MongoDB _id
  timestamp:   string;    // ISO 8601
}

// ─── notifyIncidentStatusUpdated ─────────────────────────────────────────────

export interface IncidentStatusPayload {
  incidentId:    string;    // e.g. "INC-1001"
  incidentTitle: string;
  newStatus:     string;
  newSeverity:   string;
  reporterUserId: string;   // MongoDB _id of the reporter — used to target room
}

/**
 * Notify the original incident reporter that an admin has updated their
 * incident status.
 *
 * Emits ONLY to the specific student's user room — no other student sees this.
 * Does NOT include the incident description or admin remarks to avoid leaking
 * potentially sensitive investigation notes to the reporter prematurely.
 */
export function notifyIncidentStatusUpdated(payload: IncidentStatusPayload): void {
  const io = getSocketServer();
  if (!io) return;

  const notification: NotificationPayload = {
    type:        EVENTS.INCIDENT_STATUS_UPDATED,
    title:       'Incident Update',
    message:     `Your incident "${payload.incidentTitle}" (${payload.incidentId}) status has been updated to: ${payload.newStatus}.`,
    referenceId: payload.incidentId,
    timestamp:   new Date().toISOString(),
  };

  // Targeted — only the reporter's user room
  const room = userRoom(payload.reporterUserId);
  io.to(room).emit(EVENTS.INCIDENT_STATUS_UPDATED, notification);
  io.to(room).emit(EVENTS.NOTIFICATION_NEW, notification);
}

// ─── notifyAdvisoryPublished ──────────────────────────────────────────────────

export interface AdvisoryPublishedPayload {
  advisoryId: string;    // e.g. "ADV-1001"
  title:      string;
  category:   string;
  severity:   string;
}

/**
 * Broadcast to ALL connected students that a new advisory has been published.
 *
 * Emits to STUDENT_BROADCAST_ROOM — only students who are currently connected
 * receive this in real time. Students who connect later will read advisories
 * through the REST API instead.
 *
 * Only title, category and severity are broadcast — description and
 * suspicious URLs are not included to keep the broadcast payload minimal.
 */
export function notifyAdvisoryPublished(payload: AdvisoryPublishedPayload): void {
  const io = getSocketServer();
  if (!io) return;

  const notification: NotificationPayload = {
    type:        EVENTS.ADVISORY_PUBLISHED,
    title:       'New Security Advisory',
    message:     `[${payload.severity}] ${payload.title} — Category: ${payload.category}. View the full advisory in the portal.`,
    referenceId: payload.advisoryId,
    timestamp:   new Date().toISOString(),
  };

  io.to(STUDENT_BROADCAST_ROOM).emit(EVENTS.ADVISORY_PUBLISHED, notification);
  io.to(STUDENT_BROADCAST_ROOM).emit(EVENTS.NOTIFICATION_NEW, notification);
}
