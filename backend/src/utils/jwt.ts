import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Sign a JWT for the given user.
 * The secret and expiry are always read from env — never hardcoded.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}
