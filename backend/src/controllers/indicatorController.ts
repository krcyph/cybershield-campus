import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  ThreatIndicator,
  IndicatorType,
  normalizeDomain,
  extractHostname,
  domainMatches,
} from '../models/ThreatIndicator';
import { Advisory } from '../models/Advisory';
import { AppError } from '../utils/AppError';

// ─── Helper ───────────────────────────────────────────────────────────────────

function assertValidObjectId(id: string, next: NextFunction): boolean {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError('Invalid indicator ID format.', 400));
    return false;
  }
  return true;
}

// ─── POST /api/indicators  (admin only) ──────────────────────────────────────

/**
 * Add a new suspicious domain or URL indicator.
 *
 * Normalisation rules:
 *   Domain type → normalizeDomain() applied (lowercase, strip www., strip trailing dot)
 *   URL type    → store the full normalized URL string (lowercase)
 *
 * The `value` field stored is the normalised form; `rawValue` keeps the original.
 * Uniqueness is enforced on the normalised `value`.
 */
export async function createIndicator(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const { value, type, description, relatedAdvisory } = req.body as {
      value: string;
      type: IndicatorType;
      description: string;
      relatedAdvisory?: string;
    };

    // Normalize the stored value based on type
    let normalizedValue: string;
    if (type === 'Domain') {
      normalizedValue = normalizeDomain(value);
      if (!normalizedValue) {
        return next(new AppError('Domain value is empty after normalization.', 400));
      }
    } else {
      // URL type: validate parsability before storing
      const hostname = extractHostname(value);
      if (!hostname) {
        return next(
          new AppError(
            'Invalid URL. Must start with http:// or https:// and contain a valid hostname.',
            400,
          ),
        );
      }
      // Store the normalized (lowercased) full URL
      normalizedValue = value.trim().toLowerCase();
    }

    // Verify relatedAdvisory exists and is Published (if provided)
    if (relatedAdvisory) {
      const adv = await Advisory.findById(relatedAdvisory).select('_id status');
      if (!adv) {
        return next(new AppError('Related advisory not found.', 404));
      }
    }

    const indicator = new ThreatIndicator({
      value:            normalizedValue,
      rawValue:         value.trim(),
      type,
      description,
      relatedAdvisory:  relatedAdvisory
        ? new mongoose.Types.ObjectId(relatedAdvisory)
        : undefined,
      addedBy: new mongoose.Types.ObjectId(req.user.id),
    });

    await indicator.save();
    await indicator.populate('addedBy', 'fullName email');
    if (indicator.relatedAdvisory) {
      await indicator.populate('relatedAdvisory', 'advisoryId title severity status');
    }

    res.status(201).json({
      success: true,
      message: 'Threat indicator added.',
      data: { indicator },
    });
  } catch (error) {
    // Let the global error handler convert Mongo duplicate-key (11000) → 409
    next(error);
  }
}

// ─── GET /api/indicators/check  (authenticated users) ────────────────────────

/**
 * Check whether a submitted URL matches any stored threat indicator.
 *
 * Logic:
 *   1. Parse the submitted URL and extract its hostname.
 *   2. For each stored Domain indicator: use domainMatches() — exact match OR
 *      legitimate subdomain of the flagged domain.
 *   3. For each stored URL indicator: compare normalized full-URL strings.
 *
 * Security guarantees:
 *   - Uses Node's URL parser — no substring matching.
 *   - "fake-example.com" does NOT match "example.com".
 *   - Malformed / non-http(s) URLs are rejected with a 400.
 *   - Only Published advisory details are returned; Draft/Archived are hidden.
 *   - Never makes an outbound request to the submitted URL.
 *   - Does not claim that a non-matched URL is safe.
 */
export async function checkIndicator(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawUrl = (req.query['url'] as string | undefined)?.trim();

    if (!rawUrl) {
      return next(new AppError('Query parameter "url" is required.', 400));
    }

    // Reject obviously unsupported inputs early
    if (rawUrl.length > 2000) {
      return next(new AppError('URL exceeds maximum allowed length of 2000 characters.', 400));
    }

    // Parse candidate hostname from submitted URL
    const candidateHostname = extractHostname(rawUrl);
    if (!candidateHostname) {
      return next(
        new AppError(
          'Invalid or unsupported URL. Only http:// and https:// URLs are accepted.',
          400,
        ),
      );
    }

    // Normalize the full submitted URL for URL-type comparisons
    const normalizedSubmitted = rawUrl.toLowerCase();

    // Load all active indicators
    const allIndicators = await ThreatIndicator.find({}).lean();

    // Find matching indicators
    const matchedIndicators = allIndicators.filter((ind) => {
      if (ind.type === 'Domain') {
        return domainMatches(ind.value, candidateHostname);
      } else {
        // URL type: exact normalized match
        const indHostname = extractHostname(ind.value);
        if (!indHostname) return false;
        // First check domain-level match, then fall back to full URL match
        return (
          domainMatches(ind.value, normalizedSubmitted) ||
          normalizedSubmitted === ind.value ||
          normalizedSubmitted.startsWith(ind.value)
        );
      }
    });

    const matched = matchedIndicators.length > 0;

    // Collect only Published advisory details for matched indicators
    const advisoryIds = matchedIndicators
      .map((ind) => ind.relatedAdvisory)
      .filter((id): id is mongoose.Types.ObjectId => id != null);

    const publishedAdvisories = advisoryIds.length > 0
      ? await Advisory.find({
          _id:    { $in: advisoryIds },
          status: 'Published',              // never expose Draft/Archived
        }).select('advisoryId title category severity recommendedActions')
      : [];

    res.status(200).json({
      success: true,
      data: {
        url:       rawUrl,
        hostname:  candidateHostname,
        matched,
        // Intentional: we do NOT say "safe" for unmatched URLs
        note: matched
          ? 'This URL matches one or more campus threat indicators.'
          : 'No campus threat indicator match found. This does not confirm the URL is safe.',
        indicators: matchedIndicators.map((ind) => ({
          type:        ind.type,
          value:       ind.rawValue,
          description: ind.description,
        })),
        relatedAdvisories: publishedAdvisories,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/indicators  (admin only) ───────────────────────────────────────

export async function getIndicators(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { type, page = '1', limit = '50' } = req.query as {
      type?: string;
      page?: string;
      limit?: string;
    };

    const filter: Record<string, string> = {};
    if (type) filter['type'] = type;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [indicators, total] = await Promise.all([
      ThreatIndicator.find(filter)
        .populate('addedBy', 'fullName email')
        .populate('relatedAdvisory', 'advisoryId title severity status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ThreatIndicator.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: indicators.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: { indicators },
    });
  } catch (error) {
    next(error);
  }
}

// ─── DELETE /api/indicators/:id  (admin only) ────────────────────────────────

export async function deleteIndicator(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValidObjectId(req.params['id'], next)) return;

    const indicator = await ThreatIndicator.findByIdAndDelete(req.params['id']);

    if (!indicator) {
      return next(new AppError('Indicator not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: `Threat indicator "${indicator.rawValue}" has been removed.`,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
