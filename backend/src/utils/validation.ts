import { Request, Response, NextFunction } from 'express';
import { validationResult, body, ValidationChain } from 'express-validator';
import {
  INCIDENT_CATEGORIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
} from '../models/Incident';
import {
  ADVISORY_CATEGORIES,
  ADVISORY_SEVERITIES,
  ADVISORY_STATUSES,
} from '../models/Advisory';
import { INDICATOR_TYPES } from '../models/ThreatIndicator';

// ─── Validation runner middleware ─────────────────────────────────────────────

/**
 * Run after a chain of `body(...)` validators.
 * Returns 400 with the first validation error if any exist.
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg as string,
      errors: errors.array(),
    });
    return;
  }
  next();
}

// ─── Auth: register ───────────────────────────────────────────────────────────

export const registerValidation: ValidationChain[] = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),

  body('enrollmentId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Enrollment ID cannot exceed 50 characters'),
];

// ─── Auth: login ──────────────────────────────────────────────────────────────

export const loginValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// ─── Incident: create ─────────────────────────────────────────────────────────

export const createIncidentValidation: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 3000 })
    .withMessage('Description must be between 20 and 3000 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn([...INCIDENT_CATEGORIES])
    .withMessage(`Category must be one of: ${INCIDENT_CATEGORIES.join(', ')}`),

  body('severity')
    .trim()
    .notEmpty()
    .withMessage('Severity is required')
    .isIn([...INCIDENT_SEVERITIES])
    .withMessage(`Severity must be one of: ${INCIDENT_SEVERITIES.join(', ')}`),

  body('suspiciousUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: false, require_tld: false })
    .withMessage('Please enter a valid URL')
    .isLength({ max: 2000 })
    .withMessage('URL cannot exceed 2000 characters'),

  body('senderEmail')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please enter a valid sender email address')
    .normalizeEmail({ gmail_remove_dots: false }),
];

// ─── Incident: admin update ───────────────────────────────────────────────────

export const updateIncidentValidation: ValidationChain[] = [
  body('status')
    .optional()
    .isIn([...INCIDENT_STATUSES])
    .withMessage(`Status must be one of: ${INCIDENT_STATUSES.join(', ')}`),

  body('severity')
    .optional()
    .isIn([...INCIDENT_SEVERITIES])
    .withMessage(`Severity must be one of: ${INCIDENT_SEVERITIES.join(', ')}`),

  body('adminRemarks')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin remarks cannot exceed 1000 characters'),
];

// ─── Advisory: create ─────────────────────────────────────────────────────────

export const createAdvisoryValidation: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn([...ADVISORY_CATEGORIES])
    .withMessage(`Category must be one of: ${ADVISORY_CATEGORIES.join(', ')}`),

  body('severity')
    .trim()
    .notEmpty()
    .withMessage('Severity is required')
    .isIn([...ADVISORY_SEVERITIES])
    .withMessage(`Severity must be one of: ${ADVISORY_SEVERITIES.join(', ')}`),

  body('warningSigns')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Warning signs must be an array of up to 20 items'),

  body('warningSigns.*')
    .optional()
    .trim()
    .isString()
    .withMessage('Each warning sign must be a string')
    .isLength({ max: 500 })
    .withMessage('Each warning sign cannot exceed 500 characters'),

  body('recommendedActions')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Recommended actions must be an array of up to 20 items'),

  body('recommendedActions.*')
    .optional()
    .trim()
    .isString()
    .withMessage('Each recommended action must be a string')
    .isLength({ max: 500 })
    .withMessage('Each recommended action cannot exceed 500 characters'),

  body('suspiciousUrls')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Suspicious URLs must be an array of up to 50 items'),

  body('suspiciousUrls.*')
    .optional()
    .trim()
    .isString()
    .withMessage('Each suspicious URL must be a string')
    .isLength({ max: 2000 })
    .withMessage('Each suspicious URL cannot exceed 2000 characters'),
];

// ─── Advisory: admin update ───────────────────────────────────────────────────

export const updateAdvisoryValidation: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),

  body('category')
    .optional()
    .isIn([...ADVISORY_CATEGORIES])
    .withMessage(`Category must be one of: ${ADVISORY_CATEGORIES.join(', ')}`),

  body('severity')
    .optional()
    .isIn([...ADVISORY_SEVERITIES])
    .withMessage(`Severity must be one of: ${ADVISORY_SEVERITIES.join(', ')}`),

  body('status')
    .optional()
    .isIn([...ADVISORY_STATUSES])
    .withMessage(`Status must be one of: ${ADVISORY_STATUSES.join(', ')}`),

  body('warningSigns')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Warning signs must be an array of up to 20 items'),

  body('recommendedActions')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Recommended actions must be an array of up to 20 items'),

  body('suspiciousUrls')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Suspicious URLs must be an array of up to 50 items'),
];

// ─── Indicator: create ────────────────────────────────────────────────────────

export const createIndicatorValidation: ValidationChain[] = [
  body('value')
    .trim()
    .notEmpty()
    .withMessage('Indicator value (domain or URL) is required')
    .isLength({ max: 2000 })
    .withMessage('Indicator value cannot exceed 2000 characters'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn([...INDICATOR_TYPES])
    .withMessage(`Type must be one of: ${INDICATOR_TYPES.join(', ')}`),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description / reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),

  body('relatedAdvisory')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('relatedAdvisory must be a valid MongoDB advisory ID'),
];
