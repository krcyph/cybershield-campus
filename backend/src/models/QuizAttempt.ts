import mongoose, { Document, Schema } from 'mongoose';
import type { QuizCategory, QuizDifficulty } from '../data/quizQuestions';

// ─── Per-answer record ────────────────────────────────────────────────────────

export interface IAnswerRecord {
  questionId:    string;
  selectedId:    string;   // option id chosen by the student
  correctId:     string;   // correct option id (stored for review; not sent in score endpoint)
  isCorrect:     boolean;
  explanation:   string;
  questionText:  string;
}

// ─── Attempt document ─────────────────────────────────────────────────────────

export interface IQuizAttempt extends Document {
  _id:            mongoose.Types.ObjectId;
  student:        mongoose.Types.ObjectId;
  score:          number;
  totalQuestions: number;
  percentage:     number;    // 0–100, two decimal places
  categoryFilter: QuizCategory | null;
  difficultyFilter: QuizDifficulty | null;
  answers:        IAnswerRecord[];
  createdAt:      Date;
  updatedAt:      Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const answerRecordSchema = new Schema<IAnswerRecord>(
  {
    questionId:   { type: String, required: true },
    selectedId:   { type: String, required: true },
    correctId:    { type: String, required: true },
    isCorrect:    { type: Boolean, required: true },
    explanation:  { type: String, required: true },
    questionText: { type: String, required: true },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    score: {
      type: Number,
      required: true,
      min: [0, 'Score cannot be negative'],
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: [1, 'An attempt must include at least one question'],
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    categoryFilter: {
      type: String,
      default: null,
    },
    difficultyFilter: {
      type: String,
      default: null,
    },
    answers: {
      type: [answerRecordSchema],
      required: true,
      validate: {
        validator: (arr: IAnswerRecord[]) => arr.length >= 1,
        message: 'An attempt must include at least one answer',
      },
    },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

quizAttemptSchema.index({ student: 1, createdAt: -1 });
// Leaderboard: sort by score desc
quizAttemptSchema.index({ score: -1 });
quizAttemptSchema.index({ percentage: -1 });

// ─── toJSON ───────────────────────────────────────────────────────────────────

quizAttemptSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.__v;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ret;
  },
});

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
