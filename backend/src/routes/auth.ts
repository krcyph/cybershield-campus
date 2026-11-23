import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { registerValidation, loginValidation, validate } from '../utils/validation';

const router = Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────

/**
 * Strict rate limit for auth mutation endpoints (register / login).
 * Applies per IP address.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Slightly more lenient limiter for read-only profile endpoint.
 */
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Public — creates a new student account.
 * Admin registration is NOT available through any public route.
 */
router.post(
  '/register',
  authLimiter,
  registerValidation,
  validate,
  register,
);

/**
 * POST /api/auth/login
 * Public — authenticates a user and returns a JWT.
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  login,
);

/**
 * GET /api/auth/me
 * Protected — returns the authenticated user's profile.
 */
router.get(
  '/me',
  profileLimiter,
  authenticate,
  getMe,
);

export default router;
