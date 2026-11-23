import mongoose, { Document, Schema } from 'mongoose';

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const INDICATOR_TYPES = ['Domain', 'URL'] as const;
export type IndicatorType = (typeof INDICATOR_TYPES)[number];

// ─── Document interface ────────────────────────────────────────────────────────

export interface IThreatIndicator extends Document {
  _id: mongoose.Types.ObjectId;
  value: string;              // normalized value stored for consistent matching
  rawValue: string;           // original value as submitted
  type: IndicatorType;
  description: string;
  relatedAdvisory?: mongoose.Types.ObjectId;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a domain string for consistent storage and matching:
 * - lowercase
 * - strip leading/trailing whitespace
 * - remove any trailing dot (FQDN form)
 * - strip "www." prefix so both bare and www. variants match
 */
export function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/\.+$/, '')        // remove trailing dots
    .replace(/^www\./, '');     // strip leading www.
}

/**
 * Extract and normalise the hostname from a URL string.
 * Returns null if the URL is malformed or uses an unsupported protocol.
 */
export function extractHostname(raw: string): string | null {
  try {
    // Prepend https:// for bare domains so URL() can parse them
    const urlString = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(urlString);

    // Only accept http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return normalizeDomain(parsed.hostname);
  } catch {
    return null;
  }
}

/**
 * Given a flagged (stored) domain and a candidate hostname to test,
 * return true only when:
 *   - they are an exact match, OR
 *   - the candidate is a legitimate subdomain of the flagged domain
 *     (i.e. candidate ends with ".flaggedDomain")
 *
 * This prevents "fake-example.com" from matching "example.com".
 */
export function domainMatches(flagged: string, candidate: string): boolean {
  if (candidate === flagged) return true;
  // Subdomain check: candidate must end with ".<flaggedDomain>"
  if (candidate.endsWith(`.${flagged}`)) return true;
  return false;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const threatIndicatorSchema = new Schema<IThreatIndicator>(
  {
    value: {
      type: String,
      required: true,
      unique: true,       // prevents duplicates at the DB level
      trim: true,
      lowercase: true,
    },
    rawValue: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: INDICATOR_TYPES,
        message: 'Type must be Domain or URL',
      },
    },
    description: {
      type: String,
      required: [true, 'Description / reason is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    relatedAdvisory: {
      type: Schema.Types.ObjectId,
      ref: 'Advisory',
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

// ─── Indexes ───────────────────────────────────────────────────────────────────

threatIndicatorSchema.index({ type: 1 });
threatIndicatorSchema.index({ relatedAdvisory: 1 });

// ─── toJSON ───────────────────────────────────────────────────────────────────

threatIndicatorSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.__v;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ret;
  },
});

export const ThreatIndicator = mongoose.model<IThreatIndicator>(
  'ThreatIndicator',
  threatIndicatorSchema,
);
