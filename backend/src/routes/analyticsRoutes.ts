import { Router } from 'express';
import { getDashboard } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/dashboard
 *
 * Admin → campus-wide statistics (incidents, advisories, users, quiz)
 * Student → personal statistics only (own incidents + own quiz history)
 *
 * Role is determined from the JWT — no role parameter is accepted from the client.
 */
router.get('/dashboard', getDashboard);

export default router;
