import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  Advisory,
  AdvisoryCategory,
  AdvisorySeverity,
  AdvisoryStatus,
} from '../models/Advisory';
import { AppError } from '../utils/AppError';
import { notifyAdvisoryPublished } from '../socket/notificationService';

// ─── Helper ───────────────────────────────────────────────────────────────────

function assertValidObjectId(id: string, next: NextFunction): boolean {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError('Invalid advisory ID format.', 400));
    return false;
  }
  return true;
}

// ─── GET /api/advisories  (students + admins) ─────────────────────────────────

/**
 * Return published advisories.
 * Supports: category, severity, search, page, limit query params.
 * Students always see only Published. Admins see all statuses when no filter
 * is applied but can filter to any status explicitly.
 */
export async function getAdvisories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      category,
      severity,
      status,
      search,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string | undefined>;

    const isAdmin = req.user?.role === 'admin';

    // Students can only ever see Published advisories
    const statusFilter = isAdmin
      ? status ?? undefined          // admins: use the supplied filter, or no filter (all)
      : 'Published';                 // students: locked to Published

    const filter: Record<string, unknown> = {};
    if (statusFilter) filter['status'] = statusFilter;
    if (category)     filter['category'] = category;
    if (severity)     filter['severity'] = severity;

    if (search) {
      filter['$or'] = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [advisories, total] = await Promise.all([
      Advisory.find(filter)
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Advisory.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: advisories.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: { advisories },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/advisories/:id  (students + admins) ────────────────────────────

/**
 * Return a single advisory.
 * - Students: only Published advisories.
 * - Admins: any advisory.
 */
export async function getAdvisoryById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValidObjectId(req.params['id'], next)) return;

    const advisory = await Advisory.findById(req.params['id']).populate(
      'createdBy',
      'fullName email',
    );

    if (!advisory) {
      return next(new AppError('Advisory not found.', 404));
    }

    // Students can only view Published advisories
    if (req.user?.role !== 'admin' && advisory.status !== 'Published') {
      return next(new AppError('Advisory not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { advisory },
    });
  } catch (error) {
    next(error);
  }
}

// ─── POST /api/advisories  (admin only) ──────────────────────────────────────

export async function createAdvisory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const {
      title,
      description,
      category,
      severity,
      warningSigns,
      recommendedActions,
      suspiciousUrls,
    } = req.body as {
      title: string;
      description: string;
      category: AdvisoryCategory;
      severity: AdvisorySeverity;
      warningSigns?: string[];
      recommendedActions?: string[];
      suspiciousUrls?: string[];
    };

    const advisory = new Advisory({
      title,
      description,
      category,
      severity,
      warningSigns:        warningSigns        ?? [],
      recommendedActions:  recommendedActions  ?? [],
      suspiciousUrls:      suspiciousUrls      ?? [],
      status:              'Draft',          // always starts as Draft
      createdBy:           new mongoose.Types.ObjectId(req.user.id),
    });

    await advisory.save();
    await advisory.populate('createdBy', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Advisory created as Draft.',
      data: { advisory },
    });
  } catch (error) {
    next(error);
  }
}

// ─── PATCH /api/advisories/:id  (admin only) ─────────────────────────────────

export async function updateAdvisory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValidObjectId(req.params['id'], next)) return;

    const {
      title,
      description,
      category,
      severity,
      status,
      warningSigns,
      recommendedActions,
      suspiciousUrls,
    } = req.body as {
      title?: string;
      description?: string;
      category?: AdvisoryCategory;
      severity?: AdvisorySeverity;
      status?: AdvisoryStatus;
      warningSigns?: string[];
      recommendedActions?: string[];
      suspiciousUrls?: string[];
    };

    const updates: Record<string, unknown> = {};
    if (title              !== undefined) updates['title']             = title;
    if (description        !== undefined) updates['description']       = description;
    if (category           !== undefined) updates['category']          = category;
    if (severity           !== undefined) updates['severity']          = severity;
    if (status             !== undefined) updates['status']            = status;
    if (warningSigns       !== undefined) updates['warningSigns']      = warningSigns;
    if (recommendedActions !== undefined) updates['recommendedActions']= recommendedActions;
    if (suspiciousUrls     !== undefined) updates['suspiciousUrls']    = suspiciousUrls;

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields provided to update.', 400));
    }

    // Fetch the advisory before update to compare previous status
    const existingAdvisory = await Advisory.findById(req.params['id']).lean();
    if (!existingAdvisory) {
      return next(new AppError('Advisory not found.', 404));
    }
    const wasAlreadyPublished = existingAdvisory.status === 'Published';

    const advisory = await Advisory.findByIdAndUpdate(
      req.params['id'],
      { $set: updates },
      { new: true, runValidators: true },
    ).populate('createdBy', 'fullName email');

    if (!advisory) {
      return next(new AppError('Advisory not found.', 404));
    }

    // ── Emit advisory:published only when status transitions TO Published ──
    // Non-blocking: REST response is not delayed by this.
    // Draft saves and Archived transitions are intentionally excluded.
    if (advisory.status === 'Published' && !wasAlreadyPublished) {
      notifyAdvisoryPublished({
        advisoryId: advisory.advisoryId,
        title:      advisory.title,
        category:   advisory.category,
        severity:   advisory.severity,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advisory updated.',
      data: { advisory },
    });
  } catch (error) {
    next(error);
  }
}

// ─── DELETE /api/advisories/:id  (admin only) ────────────────────────────────

export async function deleteAdvisory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValidObjectId(req.params['id'], next)) return;

    const advisory = await Advisory.findByIdAndDelete(req.params['id']);

    if (!advisory) {
      return next(new AppError('Advisory not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: `Advisory ${advisory.advisoryId} has been deleted.`,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
