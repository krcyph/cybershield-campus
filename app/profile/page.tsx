'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getInitials } from '@/lib/utils';
import {
  User, Mail, Hash, Building2, Shield, Bell, Eye, EyeOff,
  CheckCircle, Edit2, Loader2, AlertCircle,
} from 'lucide-react';

interface ProfileResponse {
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
  };
}

interface IncidentCountsResponse {
  success: boolean;
  role: string;
  data: {
    incidents: {
      total: number;
      pending: number;
      resolved: number;
      rejected: number;
    };
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, logout } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse['data']['user'] | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [incidentCounts, setIncidentCounts] = useState({ total: 0, pending: 0, resolved: 0 });
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    advisories: true,
    incidentUpdates: true,
    quizReminders: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }

    async function load() {
      try {
        const [profileRes, analyticsRes] = await Promise.all([
          api.get<ProfileResponse>('/auth/me'),
          api.get<IncidentCountsResponse>('/analytics/dashboard'),
        ]);
        setProfile(profileRes.data.user);
        setIncidentCounts({
          total: analyticsRes.data.incidents.total,
          pending: analyticsRes.data.incidents.pending,
          resolved: analyticsRes.data.incidents.resolved,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          setPageError(err.message);
        } else {
          setPageError('Failed to load profile. Please refresh.');
        }
      } finally {
        setPageLoading(false);
      }
    }

    load();
  }, [authUser, authLoading, router]);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (authLoading || pageLoading) {
    return (
      <DashboardLayout title="My Profile" subtitle="Loading…">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (pageError) {
    return (
      <DashboardLayout title="My Profile" subtitle="Error loading profile">
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 max-w-md">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{pageError}</p>
        </div>
      </DashboardLayout>
    );
  }

  const displayUser = profile ?? authUser;
  if (!displayUser) return null;

  const initials = getInitials(displayUser.fullName);

  return (
    <DashboardLayout title="My Profile" subtitle="Account information and settings">
      <div className="max-w-2xl space-y-5">
        {saved && (
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-3">
            <CheckCircle size={15} className="text-green-400" />
            <p className="text-sm text-green-300">Preferences saved.</p>
          </div>
        )}

        {/* Profile card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="text-base font-semibold text-white">{displayUser.fullName}</p>
                <p className="text-sm text-slate-400">{displayUser.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-xs text-slate-400">
                    Active {displayUser.role}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {/* edit mode is cosmetic-only for now */}}
              className="flex items-center gap-2 text-xs text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Edit2 size={12} />
              Edit
            </button>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <User size={13} /> Full Name
              </label>
              <p className="text-sm text-white">{displayUser.fullName}</p>
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Mail size={13} /> College Email
              </label>
              <p className="text-sm text-slate-300">{displayUser.email}</p>
              <p className="text-xs text-slate-500 mt-0.5">Email cannot be changed.</p>
            </div>

            {/* Enrollment */}
            {displayUser.enrollmentId && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                  <Hash size={13} /> Enrollment ID
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-300 font-mono">
                    {showEnrollment ? displayUser.enrollmentId : '••••••••'}
                  </p>
                  <button
                    onClick={() => setShowEnrollment(!showEnrollment)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showEnrollment ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Department */}
            {displayUser.department && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                  <Building2 size={13} /> Department
                </label>
                <p className="text-sm text-slate-300">{displayUser.department}</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity summary */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">My Activity</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Reports Filed', value: incidentCounts.total, color: 'text-blue-400' },
              { label: 'Pending', value: incidentCounts.pending, color: 'text-orange-400' },
              { label: 'Resolved', value: incidentCounts.resolved, color: 'text-green-400' },
            ].map((s) => (
              <div key={s.label} className="text-center bg-slate-800/50 rounded-lg p-3">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notification settings */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Notification Preferences</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: 'advisories' as const, label: 'Security Advisories', desc: 'Get notified when new advisories are published' },
              { key: 'incidentUpdates' as const, label: 'Incident Updates', desc: 'Updates when your incident status changes' },
              { key: 'quizReminders' as const, label: 'Quiz Reminders', desc: 'Weekly reminder to complete the awareness quiz' },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">{pref.label}</p>
                  <p className="text-xs text-slate-500">{pref.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({ ...prev, [pref.key]: !prev[pref.key] }))
                  }
                  className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${notifications[pref.key] ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <span
                    className={`inline-block w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications[pref.key] ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Save preferences
          </button>
        </div>

        {/* Account Security */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Account Security</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Member since</p>
                <p className="text-xs text-slate-500">
                  {displayUser.createdAt
                    ? new Date(displayUser.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <p className="text-sm text-white">Sign out</p>
                <p className="text-xs text-slate-500">End your current session</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 border border-red-700/40 hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
