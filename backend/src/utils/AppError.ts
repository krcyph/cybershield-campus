import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintain proper stack trace (V8-specific)
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Global error handler ─────────────────────────────────────────────────────

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Mongoose duplicate-key error — Mongoose uses numeric code 11000 on the raw object
  if ('code' in err && (err as unknown as { code: number }).code === 11_000) {
    res.status(409).json({
      success: false,
      message: 'An account with this email address already exists.',
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const mongooseErr = err as unknown as { errors: Record<string, { message: string }> };
    const messages = Object.values(mongooseErr.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      message: messages.join('. '),
    });
    return;
  }

  // Operational errors (thrown by AppError)
  if ('isOperational' in err && (err as AppError).isOperational) {
    res.status((err as AppError).statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Programming / unknown errors
  const statusCode = 'statusCode' in err ? (err as AppError).statusCode : 500;
  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message;

  console.error('🔴  Unhandled error:', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
