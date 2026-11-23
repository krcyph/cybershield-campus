import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Incident } from '../models/Incident';
import { Advisory } from '../models/Advisory';
import { User } from '../models/User';
import { QuizAttempt } from '../models/QuizAttempt';
import { AppError } from '../utils/AppError';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a Date representing midnight N months ago from now. */
function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── GET /api/analytics/dashboard ────────────────────────────────────────────

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) return next(new AppError('Authentication required.', 401));

    if (req.user.role === 'admin') {
      await adminAnalytics(res, next);
    } else {
      await studentAnalytics(req.user.id, res, next);
    }
  } catch (error) {
    next(error);
  }
}

// ─── Admin analytics ──────────────────────────────────────────────────────────

async function adminAnalytics(res: Response, next: NextFunction): Promise<void> {
  try {
    // Run all aggregations concurrently — no sequential waiting
    const [
      incidentStatusCounts,
      incidentCategoryCounts,
      incidentSeverityCounts,
      monthlyTrend,
      advisoryCount,
      studentCount,
      quizStats,
    ] = await Promise.all([

      // ── Incidents: total + per-status ───────────────────────────────────
      Incident.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // ── Incidents: grouped by category ────────────────────────────────
      Incident.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // ── Incidents: grouped by severity ────────────────────────────────
      Incident.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // ── Monthly incident trend — last 6 months ─────────────────────────
      Incident.aggregate<{ _id: { year: number; month: number }; count: number }>([
        { $match: { createdAt: { $gte: monthsAgo(6) } } },
        {
          $group: {
            _id: {
              year:  { $year:  '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // ── Published advisories ───────────────────────────────────────────
      Advisory.countDocuments({ status: 'Published' }),

      // ── Registered students (role = student) ──────────────────────────
      User.countDocuments({ role: 'student' }),

      // ── Quiz stats: total attempts + average score ────────────────────
      QuizAttempt.aggregate<{ totalAttempts: number; avgPercentage: number }>([
        {
          $group: {
            _id:            null,
            totalAttempts:  { $sum: 1 },
            avgPercentage:  { $avg: '$percentage' },
          },
        },
      ]),
    ]);

    // ── Flatten status counts ──────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    for (const row of incidentStatusCounts) {
      statusMap[row._id] = row.count;
    }
    const totalIncidents =
      Object.values(statusMap).reduce((sum, v) => sum + v, 0);

    // ── Flatten severity counts + derive high+critical ─────────────────
    const severityMap: Record<string, number> = {};
    for (const row of incidentSeverityCounts) {
      severityMap[row._id] = row.count;
    }
    const highCriticalCount =
      (severityMap['High'] ?? 0) + (severityMap['Critical'] ?? 0);

    // ── Format monthly trend ───────────────────────────────────────────
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendFormatted = monthlyTrend.map(row => ({
      label:  `${monthNames[row._id.month - 1]} ${row._id.year}`,
      year:   row._id.year,
      month:  row._id.month,
      count:  row.count,
    }));

    // ── Quiz summary ──────────────────────────────────────────────────
    const quizSummary = quizStats[0] ?? { totalAttempts: 0, avgPercentage: 0 };

    res.status(200).json({
      success: true,
      role: 'admin',
      data: {
        incidents: {
          total:          totalIncidents,
          byStatus: {
            reported:     statusMap['Reported']     ?? 0,
            investigating:statusMap['Investigating'] ?? 0,
            resolved:     statusMap['Resolved']     ?? 0,
            rejected:     statusMap['Rejected']     ?? 0,
          },
          highAndCritical: highCriticalCount,
          byCategory: incidentCategoryCounts.map(r => ({
            category: r._id,
            count:    r.count,
          })),
          bySeverity: incidentSeverityCounts.map(r => ({
            severity: r._id,
            count:    r.count,
          })),
          monthlyTrend: trendFormatted,
        },
        advisories: {
          totalPublished: advisoryCount,
        },
        users: {
          totalStudents: studentCount,
        },
        quiz: {
          totalAttempts:      quizSummary.totalAttempts,
          averagePercentage:  parseFloat((quizSummary.avgPercentage ?? 0).toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Student analytics ────────────────────────────────────────────────────────

async function studentAnalytics(
  studentId: string,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const oid = new mongoose.Types.ObjectId(studentId);

    const [
      incidentStatusCounts,
      recentIncidents,
      quizStats,
      latestAttempt,
    ] = await Promise.all([

      // ── Student's incidents: grouped by status ─────────────────────────
      Incident.aggregate<{ _id: string; count: number }>([
        { $match: { reporter: oid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // ── 5 most recent incidents (safe fields only) ─────────────────────
      Incident.find({ reporter: oid })
        .select('incidentId title category severity status createdAt')
        .sort({ createdAt: -1 })
        .limit(5),

      // ── Student's quiz: attempt count + avg percentage ─────────────────
      QuizAttempt.aggregate<{ totalAttempts: number; avgPercentage: number }>([
        { $match: { student: oid } },
        {
          $group: {
            _id:           null,
            totalAttempts: { $sum: 1 },
            avgPercentage: { $avg: '$percentage' },
          },
        },
      ]),

      // ── Latest quiz attempt ────────────────────────────────────────────
      QuizAttempt.findOne({ student: oid })
        .select('score totalQuestions percentage createdAt')
        .sort({ createdAt: -1 }),
    ]);

    // ── Flatten incident status counts ─────────────────────────────────
    const statusMap: Record<string, number> = {};
    for (const row of incidentStatusCounts) {
      statusMap[row._id] = row.count;
    }
    const totalIncidents = Object.values(statusMap).reduce((s, v) => s + v, 0);
    const pendingIncidents =
      (statusMap['Reported'] ?? 0) + (statusMap['Investigating'] ?? 0);

    // ── Quiz summary ──────────────────────────────────────────────────
    const quizSummary = quizStats[0] ?? { totalAttempts: 0, avgPercentage: 0 };

    res.status(200).json({
      success: true,
      role: 'student',
      data: {
        incidents: {
          total:    totalIncidents,
          pending:  pendingIncidents,
          resolved: statusMap['Resolved'] ?? 0,
          rejected: statusMap['Rejected'] ?? 0,
          recent:   recentIncidents,
        },
        quiz: {
          totalAttempts:      quizSummary.totalAttempts,
          averagePercentage:  parseFloat((quizSummary.avgPercentage ?? 0).toFixed(2)),
          latestScore:        latestAttempt?.score        ?? null,
          latestTotal:        latestAttempt?.totalQuestions ?? null,
          latestPercentage:   latestAttempt?.percentage   ?? null,
          latestAttemptDate:  latestAttempt?.createdAt    ?? null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
