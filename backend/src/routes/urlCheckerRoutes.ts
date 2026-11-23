import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  analyzeUrlHandler,
  analyzeUrlValidation,
  validate,
} from '../controllers/urlCheckerController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Stricter rate limit for the analysis endpoint.
 * URL analysis involves a DB read on every request, so we cap it more tightly
 * than the global limiter to prevent abuse.
 */
const urlCheckerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many URL analysis requests from this IP. Please try again after 15 minutes.',
  },
});

// All url-checker routes require authentication
router.use(authenticate);

/**
 * POST /api/url-checker/analyze
 * Analyse a URL and return a structured risk assessment.
 * Requires JWT. Never fetches or loads the submitted URL.
 */
router.post(
  '/analyze',
  urlCheckerLimiter,
  analyzeUrlValidation,
  validate,
  analyzeUrlHandler,
);

export default router;
