import { Router } from 'express';
import {
  createIndicator,
  checkIndicator,
  getIndicators,
  deleteIndicator,
} from '../controllers/indicatorController';
import { authenticate, authorize } from '../middleware/auth';
import { createIndicatorValidation, validate } from '../utils/validation';

const router = Router();

// All indicator routes require authentication
router.use(authenticate);

// ─── Authenticated users (students + admins) ──────────────────────────────────

/**
 * GET /api/indicators/check?url=<url>
 * Check whether a URL matches any stored threat indicator.
 * Must be declared BEFORE /:id to avoid "check" being treated as a Mongo ID.
 */
router.get('/check', checkIndicator);

// ─── Admin only ───────────────────────────────────────────────────────────────

/**
 * POST /api/indicators
 * Add a new suspicious domain or URL.
 */
router.post(
  '/',
  authorize('admin'),
  createIndicatorValidation,
  validate,
  createIndicator,
);

/**
 * GET /api/indicators
 * List all stored indicators. Supports ?type= &page= &limit=
 */
router.get('/', authorize('admin'), getIndicators);

/**
 * DELETE /api/indicators/:id
 * Remove an indicator permanently.
 */
router.delete('/:id', authorize('admin'), deleteIndicator);

export default router;
