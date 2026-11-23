import { Router } from 'express';
import {
  getAdvisories,
  getAdvisoryById,
  createAdvisory,
  updateAdvisory,
  deleteAdvisory,
} from '../controllers/advisoryController';
import { authenticate, authorize } from '../middleware/auth';
import {
  createAdvisoryValidation,
  updateAdvisoryValidation,
  validate,
} from '../utils/validation';

const router = Router();

// All advisory routes require authentication
router.use(authenticate);

// ─── Student + Admin ──────────────────────────────────────────────────────────

/**
 * GET /api/advisories
 * Students see only Published.
 * Admins see all (or filtered by ?status=).
 * Supports: ?category= &severity= &status= &search= &page= &limit=
 */
router.get('/', getAdvisories);

/**
 * GET /api/advisories/:id
 * Students see only Published; admins see any.
 */
router.get('/:id', getAdvisoryById);

// ─── Admin only ───────────────────────────────────────────────────────────────

/**
 * POST /api/advisories
 * Create a new advisory (starts as Draft).
 */
router.post(
  '/',
  authorize('admin'),
  createAdvisoryValidation,
  validate,
  createAdvisory,
);

/**
 * PATCH /api/advisories/:id
 * Edit advisory fields and/or change status.
 */
router.patch(
  '/:id',
  authorize('admin'),
  updateAdvisoryValidation,
  validate,
  updateAdvisory,
);

/**
 * DELETE /api/advisories/:id
 * Permanently delete an advisory.
 */
router.delete('/:id', authorize('admin'), deleteAdvisory);

export default router;
