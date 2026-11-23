import mongoose, { Document, Schema } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const INCIDENT_CATEGORIES = [
  'Phishing Email',
  'Suspicious URL',
  'Fake Internship Offer',
  'Account Compromise',
  'Payment / QR Code Scam',
  'Impersonation',
  'Other',
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export const INCIDENT_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = [
  'Reported',
  'Investigating',
  'Resolved',
  'Rejected',
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

// ─── Document interface ───────────────────────────────────────────────────────

export interface IIncident extends Document {
  _id: mongoose.Types.ObjectId;
  incidentId: string;           // Human-readable ID: INC-1001
  title: string;
  description: string;
  category: IncidentCategory;
  suspiciousUrl?: string;
  senderEmail?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reporter: mongoose.Types.ObjectId;
  adminRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auto-increment counter helper ───────────────────────────────────────────

/**
 * Simple counter stored as a separate collection document.
 * Ensures INC-XXXX IDs are unique and monotonically increasing.
 */
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

const Counter = mongoose.model('Counter', counterSchema);

async function getNextIncidentId(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    'incidentId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `INC-${counter.seq}`;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const incidentSchema = new Schema<IIncident>(
  {
    incidentId: {
      type: String,
      unique: true,
      // Set in pre-save hook; not supplied by client
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: INCIDENT_CATEGORIES,
        message: 'Invalid incident category',
      },
    },
    suspiciousUrl: {
      type: String,
      trim: true,
      maxlength: [2000, 'URL cannot exceed 2000 characters'],
    },
    senderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid sender email address'],
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: INCIDENT_SEVERITIES,
        message: 'Severity must be Low, Medium, High or Critical',
      },
    },
    status: {
      type: String,
      enum: {
        values: INCIDENT_STATUSES,
        message: 'Invalid incident status',
      },
      default: 'Reported',
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    adminRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin remarks cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

incidentSchema.index({ reporter: 1, createdAt: -1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ category: 1 });

// ─── Pre-save: assign incidentId ──────────────────────────────────────────────

incidentSchema.pre<IIncident>('save', async function (next) {
  if (this.isNew) {
    this.incidentId = await getNextIncidentId();
  }
  next();
});

// ─── toJSON: strip internal fields ───────────────────────────────────────────

incidentSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.__v;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ret;
  },
});

export const Incident = mongoose.model<IIncident>('Incident', incidentSchema);
