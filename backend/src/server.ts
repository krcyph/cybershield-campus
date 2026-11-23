import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first — before any other module reads process.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import http from 'http';
import app from './app';
import { connectDB } from './config/database';
import { env } from './config/env';
import { initSocketServer } from './socket/socketServer';

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB before accepting HTTP traffic
    await connectDB();

    // Create a plain Node.js HTTP server wrapping the Express app.
    // Socket.io is attached to this server so both share the same port.
    const server = http.createServer(app);

    // Attach Socket.io to the existing HTTP server
    initSocketServer(server);

    server.listen(env.PORT, () => {
      console.log(`🚀  CyberShield Campus API running on port ${env.PORT}`);
      console.log(`    Environment : ${env.NODE_ENV}`);
      console.log(`    Frontend URL: ${env.FRONTEND_URL}`);
      console.log(`    Health check: http://localhost:${env.PORT}/health`);
      console.log(`    WebSocket  : ws://localhost:${env.PORT}`);
    });

    // ─── Graceful shutdown ─────────────────────────────────────────────────

    const shutdown = (signal: string) => {
      console.log(`\n${signal} received — shutting down gracefully…`);
      server.close(() => {
        console.log('💤  HTTP server closed.');
        process.exit(0);
      });

      // Force-close after 10 seconds if something hangs
      setTimeout(() => {
        console.error('⏱️  Forced shutdown after 10s timeout.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('🔴  Unhandled Promise Rejection:', reason);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('❌  Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
