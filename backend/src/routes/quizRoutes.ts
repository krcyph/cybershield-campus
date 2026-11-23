import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getQuestions,
  submitQuiz,
  getMyAttempts,
  getLeaderboard,
} from '../controllers/quizController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All quiz routes require authentication
router.use(authenticate);

// ─── Rate limiter for quiz submission ─────────────────────────────────────────

/**
 * Prevent abuse of the submission endpoint.
 * 20 submissions per 15 minutes per IP is generous for genuine use
 * but prevents automated score-farming.
 */
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many quiz submissions from this IP. Please wait before submitting again.',
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/quiz/questions
 * Returns questions WITHOUT correct answers or explanations.
 * Supports ?category= and ?difficulty= filters.
 * Must be declared before /:id style routes if any are added later.
 */
router.get('/questions', getQuestions);

/**
 * GET /api/quiz/my-attempts
 * Return the authenticated student's attempt history.
 */
router.get('/my-attempts', getMyAttempts);

/**
 * GET /api/quiz/leaderboard
 * Public leaderboard — only full names and best scores.
 * Supports ?limit= (default 20, max 50).
 */
router.get('/leaderboard', getLeaderboard);

/**
 * POST /api/quiz/submit
 * Submit answers; score is calculated server-side only.
 * Any score value in the request body is ignored.
 */
router.post('/submit', submitLimiter, submitQuiz);

export default router;
