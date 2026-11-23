import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Incident, IncidentCategory, IncidentSeverity, IncidentStatus } from '../models/Incident';
import { AppError } from '../utils/AppError';
import { notifyIncidentStatusUpdated } from '../socket/notificationService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate a Mongo ObjectId string; return 400 if malformed.
 */
function assertValidObjectId(id: string, next: NextFunction): boolean {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError('Invalid incident ID format.', 400));
    return false;
  }
  return true;
}

// ─── POST /api/incidents ──────────────────────────────────────────────────────

/**
 * Submit a new incident report.
 * Authenticated students only.
 * The reporter is taken from req.user — never from the request body.
 */
export async function createIncident(
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
      suspiciousUrl,
      senderEmail,
    } = req.body as {
      title: string;
      description: string;
      category: IncidentCategory;
      severity: IncidentSeverity;
      suspiciousUrl?: string;
      senderEmail?: string;
    };

    const incident = new Incident({
      title,
      description,
      category,
      severity,
      suspiciousUrl: suspiciousUrl || undefined,
      senderEmail: senderEmail || undefined,
      reporter: new mongoose.Types.ObjectId(req.user.id),
      // incidentId and status are set automatically
    });

    await incident.save();

    // Populate reporter with safe fields before responding
    await incident.populate('reporter', 'fullName email enrollmentId department');

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully.',
      data: { incident },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/incidents/my ────────────────────────────────────────────────────

/**
 * Return only the incidents submitted by the authenticated student.
 */
export async function getMyIncidents(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const incidents = await Incident.find({ reporter: req.user.id })
      .populate('reporter', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: { incidents },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/incidents/:id ───────────────────────────────────────────────────

/**
 * Get a single incident by MongoDB _id.
 * - Students: can only view their own incidents.
 * - Admins: can view any incident.
 */
export async function getIncidentById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) return next(new AppError('Authentication required.', 401));

    const { id } = req.params;
    if (!assertValidObjectId(id, next)) return;

    const incident = await Incident.findById(id).populate(
      'reporter',
      'fullName email enrollmentId department',
    );

    if (!incident) {
      return next(new AppError('Incident not found.', 404));
    }

    // Students may only view their own reports
    if (
      req.user.role !== 'admin' &&
      incident.reporter._id.toString() !== req.user.id
    ) {
      return next(new AppError('You are not authorised to view this incident.', 403));
    }

    res.status(200).json({
      success: true,
      data: { incident },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/incidents (admin) ───────────────────────────────────────────────

/**
 * Return all incidents with optional filtering.
 * Admin only.
 * Supports query params: category, severity, status, page, limit
 */
export async function getAllIncidents(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { category, severity, status, page = '1', limit = '20' } = req.query as {
      category?: string;
      severity?: string;
      status?: string;
      page?: string;
      limit?: string;
    };

    // Build filter object — only add fields that were actually provided
    const filter: Record<string, string> = {};
    if (category) filter['category'] = category;
    if (severity) filter['severity'] = severity;
    if (status)   filter['status']   = status;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate('reporter', 'fullName email enrollmentId department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Incident.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: incidents.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: { incidents },
    });
  } catch (error) {
    next(error);
  }
}

// ─── PATCH /api/incidents/:id (admin) ────────────────────────────────────────

/**
 * Update status, severity and/or admin remarks.
 * Admin only.
 */
export async function updateIncident(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!assertValidObjectId(id, next)) return;

    const { status, severity, adminRemarks } = req.body as {
      status?: IncidentStatus;
      severity?: IncidentSeverity;
      adminRemarks?: string;
    };

    // Build update — only include fields that were actually provided
    const updates: Partial<{
      status: IncidentStatus;
      severity: IncidentSeverity;
      adminRemarks: string;
    }> = {};

    if (status !== undefined)       updates.status       = status;
    if (severity !== undefined)     updates.severity     = severity;
    if (adminRemarks !== undefined) updates.adminRemarks = adminRemarks;

    if (Object.keys(updates).length === 0) {
      return next(
        new AppError('No valid fields provided. Supply at least one of: status, severity, adminRemarks.', 400),
      );
    }

    const incident = await Incident.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate('reporter', 'fullName email enrollmentId department');

    if (!incident) {
      return next(new AppError('Incident not found.', 404));
    }

    // ── Emit real-time notification to the reporter ──────────────────────
    // Non-blocking: if Socket.io is not running this is a no-op.
    // We read the reporter ID from the populated document, not from req.body.
    const reporterDoc = incident.reporter as unknown as { _id: mongoose.Types.ObjectId };
    const reporterUserId = reporterDoc._id.toString();
    notifyIncidentStatusUpdated({
      incidentId:     incident.incidentId,
      incidentTitle:  incident.title,
      newStatus:      incident.status,
      newSeverity:    incident.severity,
      reporterUserId,
    });

    res.status(200).json({
      success: true,
      message: 'Incident updated successfully.',
      data: { incident },
    });
  } catch (error) {
    next(error);
  }
}

// ─── DELETE /api/incidents/:id (admin) ───────────────────────────────────────

/**
 * Permanently delete an incident.
 * Admin only.
 */
export async function deleteIncident(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!assertValidObjectId(id, next)) return;

    const incident = await Incident.findByIdAndDelete(id);

    if (!incident) {
      return next(new AppError('Incident not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: `Incident ${incident.incidentId} has been deleted.`,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
