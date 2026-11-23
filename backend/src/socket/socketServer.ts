/**
 * Socket.io Server — CyberShield Campus
 *
 * Singleton that wraps a socket.io Server instance.
 * Initialised once in server.ts by calling initSocketServer(httpServer).
 * Consumed everywhere else via getSocketServer().
 *
 * Security model:
 *   - Every connection must present a valid JWT in the handshake auth object.
 *   - Room membership is derived exclusively from the verified JWT payload.
 *   - Clients cannot join arbitrary rooms.
 *   - Expired or tampered tokens are rejected immediately.
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SocketUser {
  id:       string;
  email:    string;
  role:     UserRole;
  fullName: string;
}

/** All custom socket data is stored here — not on the raw socket object */
declare module 'socket.io' {
  interface Socket {
    user: SocketUser;
  }
}

/** Payload shape we sign into JWTs */
interface JwtPayload {
  id:    string;
  email: string;
  role:  UserRole;
}

// ─── Room naming ──────────────────────────────────────────────────────────────

/**
 * User-specific room: student or admin receives events targeted at them.
 * Named by their MongoDB user ID so it cannot be guessed.
 */
export function userRoom(userId: string): string {
  return `user:${userId}`;
}

/**
 * Broadcast room joined by all authenticated students.
 * Used for advisory publication broadcasts.
 */
export const STUDENT_BROADCAST_ROOM = 'students';

/** Room joined by authenticated admins. */
export const ADMIN_ROOM = 'admins';

// ─── Singleton ─────────────────────────────────────────────────────────────────

let io: SocketServer | null = null;

// ─── Initialisation ───────────────────────────────────────────────────────────

export function initSocketServer(httpServer: HttpServer): SocketServer {
  if (io) return io;

  io = new SocketServer(httpServer, {
    cors: {
      origin:      env.FRONTEND_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    // Longer ping timeouts so mobile / university Wi-Fi disconnections are
    // handled gracefully without flooding reconnect logs.
    pingTimeout:  60_000,
    pingInterval: 25_000,
  });

  // ── JWT authentication middleware ──────────────────────────────────────────
  io.use((socket: Socket, next) => {
    try {
      // Clients must pass the token in handshake.auth.token
      const token = socket.handshake.auth['token'] as string | undefined;

      if (!token) {
        return next(new Error('AUTH_REQUIRED: No token provided'));
      }

      let payload: JwtPayload;
      try {
        payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          return next(new Error('AUTH_EXPIRED: Token has expired'));
        }
        return next(new Error('AUTH_INVALID: Invalid token'));
      }

      // Attach verified identity — derived from token only, never from client data
      socket.user = {
        id:       payload.id,
        email:    payload.email,
        role:     payload.role,
        fullName: '',      // not stored in JWT; acceptable for socket context
      };

      next();
    } catch {
      next(new Error('AUTH_ERROR: Authentication failed'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const { id: userId, role } = socket.user;

    // Always join the user-specific room for targeted notifications
    void socket.join(userRoom(userId));

    // Role-based broadcast room assignment — determined by verified JWT, not client
    if (role === 'admin') {
      void socket.join(ADMIN_ROOM);
    } else {
      // All other roles (students) join the student broadcast room
      void socket.join(STUDENT_BROADCAST_ROOM);
    }

    console.log(
      `🔌  Socket connected: userId=${userId} role=${role} socketId=${socket.id}`,
    );

    socket.on('disconnect', (reason) => {
      console.log(
        `🔌  Socket disconnected: userId=${userId} socketId=${socket.id} reason=${reason}`,
      );
    });

    // Reject any attempt by the client to join rooms directly.
    // We deliberately do not listen for 'joinRoom' or similar events.
  });

  console.log('✅  Socket.io server initialised');
  return io;
}

// ─── Accessor ─────────────────────────────────────────────────────────────────

/**
 * Returns the initialised Socket.io server.
 * Callers (controllers) should check for null and skip emission if the
 * socket server has not been initialised (e.g. in test environments).
 */
export function getSocketServer(): SocketServer | null {
  return io;
}
