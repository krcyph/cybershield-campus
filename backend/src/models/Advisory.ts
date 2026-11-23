import mongoose, { Document, Schema } from 'mongoose';

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const ADVISORY_CATEGORIES = [
  'Fake Internship',
  'Phishing Email',
  'University Impersonation',
  'Payment / QR Code Scam',
  'Fake Registration Form',
  'Account Security',
  'General Security Warning',
] as const;

export type AdvisoryCategory = (typeof ADVISORY_CATEGORIES)[number];

export const ADVISORY_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type AdvisorySeverity = (typeof ADVISORY_SEVERITIES)[number];

export const ADVISORY_STATUSES = ['Draft', 'Published', 'Archived'] as const;
export type AdvisoryStatus = (typeof ADVISORY_STATUSES)[number];

// ─── Document interface ────────────────────────────────────────────────────────

export interface IAdvisory extends Document {
  _id: mongoose.Types.ObjectId;
  advisoryId: string;             // Human-readable ID: ADV-1001
  title: string;
  description: string;
  category: AdvisoryCategory;
  severity: AdvisorySeverity;
  warningSigns: string[];
  recommendedActions: string[];
  suspiciousUrls: string[];
  status: AdvisoryStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auto-increment counter ────────────────────────────────────────────────────

const advisoryCounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

const AdvisoryCounter = mongoose.model('AdvisoryCounter', advisoryCounterSchema);

async function getNextAdvisoryId(): Promise<string> {
  const counter = await AdvisoryCounter.findByIdAndUpdate(
    'advisoryId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `ADV-${counter.seq}`;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const advisorySchema = new Schema<IAdvisory>(
  {
    advisoryId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ADVISORY_CATEGORIES,
        message: 'Invalid advisory category',
      },
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: ADVISORY_SEVERITIES,
        message: 'Severity must be Low, Medium, High or Critical',
      },
    },
    warningSigns: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 20,
        message: 'Warning signs cannot exceed 20 items',
      },
    },
    recommendedActions: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 20,
        message: 'Recommended actions cannot exceed 20 items',
      },
    },
    suspiciousUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 50,
        message: 'Suspicious URLs list cannot exceed 50 items',
      },
    },
    status: {
      type: String,
      enum: {
        values: ADVISORY_STATUSES,
        message: 'Status must be Draft, Published or Archived',
      },
      default: 'Draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created-by user reference is required'],
    },
  },
  { timestamps: true },
);

// ─── Indexes ───────────────────────────────────────────────────────────────────

advisorySchema.index({ status: 1, createdAt: -1 });
advisorySchema.index({ category: 1 });
advisorySchema.index({ severity: 1 });

// ─── Pre-save: assign advisoryId ──────────────────────────────────────────────

advisorySchema.pre<IAdvisory>('save', async function (next) {
  if (this.isNew) {
    this.advisoryId = await getNextAdvisoryId();
  }
  next();
});

// ─── toJSON ───────────────────────────────────────────────────────────────────

advisorySchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.__v;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ret;
  },
});

export const Advisory = mongoose.model<IAdvisory>('Advisory', advisorySchema);
