'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, Eye, EyeOff, Mail, Lock, User, Hash, AlertCircle, CheckCircle,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface FormState {
  fullName: string;
  email: string;
  enrollmentId: string;
  department: string;
  password: string;
  confirmPassword: string;
}

interface RegisterResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      fullName: string;
      email: string;
      role: 'student' | 'admin';
      department?: string;
      enrollmentId?: string;
      createdAt?: string;
    };
    token: string;
  };
}

const departments = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    enrollmentId: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): Partial<FormState> {
    const e: Partial<FormState> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.enrollmentId.trim()) e.enrollmentId = 'Enrollment ID is required';
    if (!form.department) e.department = 'Please select your department';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await api.post<RegisterResponse>(
        '/auth/register',
        {
          fullName: form.fullName.trim(),
          email: form.email,
          password: form.password,
          enrollmentId: form.enrollmentId.trim(),
          department: form.department,
        },
        { public: true },
      );
      const { user, token } = res.data;
      login(user, token);
      setSubmitted(true);
      // Redirect to dashboard after a brief success display
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0d1421] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-900/30 border border-green-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-slate-400 text-sm mb-2">
            Welcome, <span className="text-white font-medium">{form.fullName}</span>!
          </p>
          <p className="text-slate-500 text-xs">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1421] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Student Registration</h1>
          <p className="text-sm text-slate-400 mt-1">CyberShield Campus Platform</p>
        </div>

        {/* API error banner */}
        {apiError && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-5">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{apiError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Riya Sharma" value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                className={`w-full bg-[#111827] border ${errors.fullName ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`} />
            </div>
            {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
          </div>
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">College Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" placeholder="riya@college.edu.in" value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={`w-full bg-[#111827] border ${errors.email ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`} />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>
          {/* Enrollment ID */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Enrollment / Roll Number</label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="2021CS001" value={form.enrollmentId}
                onChange={(e) => set('enrollmentId', e.target.value)}
                className={`w-full bg-[#111827] border ${errors.enrollmentId ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`} />
            </div>
            {errors.enrollmentId && <p className="text-xs text-red-400 mt-1">{errors.enrollmentId}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
            <select
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              className={`w-full bg-[#111827] border ${errors.department ? 'border-red-500' : 'border-slate-700'} text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
            >
              <option value="" className="text-slate-500">Select department</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.department && (
              <p className="text-xs text-red-400 mt-1">{errors.department}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className={`w-full bg-[#111827] border ${errors.password ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
          </div>
          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                className={`w-full bg-[#111827] border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
