import { Router } from 'express';
import {
  createIncident,
  getMyIncidents,
  getIncidentById,
  getAllIncidents,
  updateIncident,
  deleteIncident,
} from '../controllers/incidentController';
import { authenticate, authorize } from '../middleware/auth';
import {
  createIncidentValidation,
  updateIncidentValidation,
  validate,
} from '../utils/validation';

const router = Router();

// All incident routes require authentication
router.use(authenticate);

// ─── Student routes ───────────────────────────────────────────────────────────

/**
 * POST /api/incidents
 * Submit a new incident report (authenticated students and admins).
 */
router.post(
  '/',
  createIncidentValidation,
  validate,
  createIncident,
);

/**
 * GET /api/incidents/my
 * Return incidents submitted by the currently authenticated user.
 * Must be declared BEFORE /:id to avoid "my" being treated as a Mongo ID.
 */
router.get('/my', getMyIncidents);

/**
 * GET /api/incidents/:id
 * Students see only their own; admins see any.
 */
router.get('/:id', getIncidentById);

// ─── Admin-only routes ────────────────────────────────────────────────────────

/**
 * GET /api/incidents
 * Return all incidents with optional filters (admin only).
 */
router.get(
  '/',
  authorize('admin'),
  getAllIncidents,
);

/**
 * PATCH /api/incidents/:id
 * Update status, severity and/or admin remarks (admin only).
 */
router.patch(
  '/:id',
  authorize('admin'),
  updateIncidentValidation,
  validate,
  updateIncident,
);

/**
 * DELETE /api/incidents/:id
 * Delete an incident permanently (admin only).
 */
router.delete(
  '/:id',
  authorize('admin'),
  deleteIncident,
);

export default router;
