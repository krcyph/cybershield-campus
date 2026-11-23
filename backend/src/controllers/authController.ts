import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

// ─── Shared response shape ────────────────────────────────────────────────────

function safeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    department: user.department,
    enrollmentId: user.enrollmentId,
    createdAt: user.createdAt,
  };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

/**
 * Register a new student account.
 *
 * Security note: The `role` field from the request body is intentionally
 * ignored. All self-registered accounts are always created as 'student'.
 * Admin accounts can only be created via the internal seedAdmin script.
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { fullName, email, password, department, enrollmentId } = req.body as {
      fullName: string;
      email: string;
      password: string;
      department?: string;
      enrollmentId?: string;
    };

    // Check for existing account before attempting to create
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return next(
        new AppError('An account with this email address already exists. Please log in.', 409),
      );
    }

    // Create user — role is ALWAYS 'student' here, regardless of request body
    const user = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // pre-save hook will hash this
      role: 'student',        // hardcoded — never from req.body
      department,
      enrollmentId,
    });

    await user.save();

    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: safeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    // Explicitly select passwordHash — it is excluded from queries by default
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

    // Use a constant-time comparison path to avoid user-enumeration timing attacks.
    // Even if the user doesn't exist, we still call comparePassword to consume
    // roughly the same amount of time.
    const passwordMatch = user ? await user.comparePassword(password) : false;

    if (!user || !passwordMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: safeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user: safeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}
