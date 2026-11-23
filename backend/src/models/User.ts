import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'admin';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department?: string;
  enrollmentId?: string;
  createdAt: Date;
  updatedAt: Date;
  /** Compare a plain-text candidate password against the stored hash */
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: 'Role must be either student or admin',
      },
      // ⚠️  Default is always 'student'. Admin role can ONLY be set by the
      // internal seed script — never through any public-facing API endpoint.
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    enrollmentId: {
      type: String,
      trim: true,
      maxlength: [50, 'Enrollment ID cannot exceed 50 characters'],
    },
  },
  {
    timestamps: true,
  },
);

// ─── Password hashing ──────────────────────────────────────────────────────────

userSchema.pre<IUser>('save', async function (next) {
  // Only hash when the password field has been modified
  if (!this.isModified('passwordHash')) return next();

  const saltRounds = 12;
  this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
  next();
});

// ─── Instance method: compare password ────────────────────────────────────────

userSchema.methods.comparePassword = async function (
  this: IUser,
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

// ─── Serialisation: strip sensitive fields from toJSON output ─────────────────

userSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.passwordHash;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.__v;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
