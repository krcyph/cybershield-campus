import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { analyzeUrl } from '../utils/urlAnalyzer';
import { AppError } from '../utils/AppError';
import { validate } from '../utils/validation';

// ─── Input validation chain (exported for use in route) ──────────────────────

export const analyzeUrlValidation = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('url is required')
    .isString()
    .withMessage('url must be a string')
    .isLength({ max: 2000 })
    .withMessage('url cannot exceed 2000 characters'),
];

export { validate };

// ─── POST /api/url-checker/analyze ───────────────────────────────────────────

/**
 * URL Risk Analysis endpoint.
 *
 * Security guarantees:
 *   - Input is validated before the analyzer is called.
 *   - analyzeUrl() performs ONLY local string analysis + one MongoDB read.
 *   - The submitted URL is NEVER fetched, pinged, resolved or executed.
 *   - No outbound network connection to the submitted URL is made at any point.
 */
export async function analyzeUrlHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { url } = req.body as { url: string };

    let result;
    try {
      result = await analyzeUrl(url);
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_URL') {
        return next(
          new AppError(
            'Invalid URL. Please provide a full URL starting with http:// or https://. ' +
              'Other protocols (ftp://, data:, javascript:, etc.) are not accepted.',
            400,
          ),
        );
      }
      throw err;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
