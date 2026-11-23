import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { QUIZ_QUESTIONS, QuizCategory, QuizDifficulty } from '../data/quizQuestions';
import { QuizAttempt } from '../models/QuizAttempt';
import { AppError } from '../utils/AppError';

// ─── Helper: safe question (strips correctId and explanation) ─────────────────

function toSafeQuestion(q: typeof QUIZ_QUESTIONS[number]) {
  return {
    id:         q.id,
    question:   q.question,
    options:    q.options,          // only id + text, no correct marker
    category:   q.category,
    difficulty: q.difficulty,
    // correctId and explanation are intentionally omitted
  };
}

// ─── GET /api/quiz/questions ──────────────────────────────────────────────────

/**
 * Return quiz questions without correct answers or explanations.
 * Supports optional ?category= and ?difficulty= filters.
 */
export async function getQuestions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { category, difficulty } = req.query as {
      category?:   string;
      difficulty?: string;
    };

    let questions = [...QUIZ_QUESTIONS];

    if (category) {
      questions = questions.filter(q => q.category === category);
    }
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    if (questions.length === 0) {
      res.status(200).json({
        success: true,
        count: 0,
        data: { questions: [] },
      });
      return;
    }

    res.status(200).json({
      success: true,
      count: questions.length,
      data: {
        questions: questions.map(toSafeQuestion),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── POST /api/quiz/submit ────────────────────────────────────────────────────

interface SubmittedAnswer {
  questionId: string;
  selectedId: string;
}

/**
 * Accept submitted answers, score them server-side, save the attempt and
 * return a full result breakdown.
 *
 * Security guarantees:
 *   - Score is calculated exclusively from the server-side question dataset.
 *   - Any score value sent in the request body is completely ignored.
 *   - Correct answers are only revealed as part of the post-submission review.
 *   - Duplicate question IDs within a single attempt are rejected.
 */
export async function submitQuiz(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const { answers } = req.body as { answers: SubmittedAnswer[] };

    // ── Validate structure ──────────────────────────────────────────────────
    if (!Array.isArray(answers) || answers.length === 0) {
      return next(new AppError('answers must be a non-empty array.', 400));
    }
    if (answers.length > QUIZ_QUESTIONS.length) {
      return next(
        new AppError(
          `Cannot submit more than ${QUIZ_QUESTIONS.length} answers in a single attempt.`,
          400,
        ),
      );
    }

    // ── Reject duplicate question IDs ──────────────────────────────────────
    const seenIds = new Set<string>();
    for (const ans of answers) {
      if (!ans.questionId || typeof ans.questionId !== 'string') {
        return next(new AppError('Each answer must include a valid questionId string.', 400));
      }
      if (!ans.selectedId || typeof ans.selectedId !== 'string') {
        return next(new AppError('Each answer must include a valid selectedId string.', 400));
      }
      if (seenIds.has(ans.questionId)) {
        return next(
          new AppError(
            `Duplicate question ID "${ans.questionId}" in submission. Each question may appear at most once.`,
            400,
          ),
        );
      }
      seenIds.add(ans.questionId);
    }

    // Build a lookup map from the authoritative dataset
    const questionMap = new Map(QUIZ_QUESTIONS.map(q => [q.id, q]));

    // ── Validate all question IDs exist ────────────────────────────────────
    const unknownIds = answers
      .map(a => a.questionId)
      .filter(id => !questionMap.has(id));

    if (unknownIds.length > 0) {
      return next(
        new AppError(
          `Unknown question ID(s): ${unknownIds.join(', ')}. Submit only valid question IDs returned by GET /api/quiz/questions.`,
          400,
        ),
      );
    }

    // ── Validate selected option IDs ───────────────────────────────────────
    for (const ans of answers) {
      const q = questionMap.get(ans.questionId)!;
      const validOptionIds = q.options.map(o => o.id);
      if (!validOptionIds.includes(ans.selectedId)) {
        return next(
          new AppError(
            `Invalid option "${ans.selectedId}" for question "${ans.questionId}". Valid options: ${validOptionIds.join(', ')}.`,
            400,
          ),
        );
      }
    }

    // ── Score server-side ──────────────────────────────────────────────────
    let score = 0;
    const answerRecords = answers.map(ans => {
      const q = questionMap.get(ans.questionId)!;
      const isCorrect = ans.selectedId === q.correctId;
      if (isCorrect) score++;
      return {
        questionId:   q.id,
        selectedId:   ans.selectedId,
        correctId:    q.correctId,
        isCorrect,
        explanation:  q.explanation,
        questionText: q.question,
      };
    });

    const totalQuestions = answers.length;
    const percentage = parseFloat(((score / totalQuestions) * 100).toFixed(2));

    // ── Detect category / difficulty filters used ─────────────────────────
    const usedCategories = new Set(answers.map(a => questionMap.get(a.questionId)!.category));
    const usedDifficulties = new Set(answers.map(a => questionMap.get(a.questionId)!.difficulty));

    const categoryFilter =
      usedCategories.size === 1 ? (Array.from(usedCategories)[0] as QuizCategory) : null;
    const difficultyFilter =
      usedDifficulties.size === 1 ? (Array.from(usedDifficulties)[0] as QuizDifficulty) : null;

    // ── Save attempt ───────────────────────────────────────────────────────
    const attempt = await QuizAttempt.create({
      student:          new mongoose.Types.ObjectId(req.user.id),
      score,
      totalQuestions,
      percentage,
      categoryFilter,
      difficultyFilter,
      answers:          answerRecords,
    });

    // ── Build response ─────────────────────────────────────────────────────
    res.status(201).json({
      success: true,
      message: 'Quiz attempt submitted.',
      data: {
        attemptId:      attempt._id,
        score,
        totalQuestions,
        percentage,
        correctCount:   score,
        incorrectCount: totalQuestions - score,
        // Post-submission review includes correct answers and explanations
        review: answerRecords.map(r => ({
          questionId:   r.questionId,
          questionText: r.questionText,
          selectedId:   r.selectedId,
          correctId:    r.correctId,
          isCorrect:    r.isCorrect,
          explanation:  r.explanation,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/quiz/my-attempts ────────────────────────────────────────────────

/**
 * Return the authenticated student's quiz attempt history.
 * Does not expose other students' data.
 */
export async function getMyAttempts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const attempts = await QuizAttempt.find({ student: req.user.id })
      .select('score totalQuestions percentage categoryFilter difficultyFilter createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: { attempts },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/quiz/leaderboard ────────────────────────────────────────────────

/**
 * Return a leaderboard of top quiz performers.
 * Shows only student full names and scores — no emails, no IDs, no passwords.
 *
 * Strategy: for each student, take their BEST attempt by percentage, then
 * rank by percentage desc, ties broken by score desc.
 */
export async function getLeaderboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = Math.min(50, Math.max(1, parseInt((req.query['limit'] as string) ?? '20', 10)));

    // Aggregate: best attempt per student
    const leaderboard = await QuizAttempt.aggregate([
      {
        $group: {
          _id:            '$student',
          bestPercentage: { $max: '$percentage' },
          bestScore:      { $max: '$score' },
          totalAttempts:  { $sum: 1 },
        },
      },
      { $sort: { bestPercentage: -1, bestScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          _id:            0,
          // Only expose full name — never email, password hash or enrollment ID
          fullName:       '$studentInfo.fullName',
          bestPercentage: 1,
          bestScore:      1,
          totalAttempts:  1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: { leaderboard },
    });
  } catch (error) {
    next(error);
  }
}
