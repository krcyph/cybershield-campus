'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { SeverityBadge, StatusBadge } from '@/components/Badges';
import { formatDate, truncate } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AdminAnalyticsData, Incident, Advisory } from '@/types';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Newspaper,
  ArrowRight,
  Shield,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import Link from 'next/link';

// ─── Response types ───────────────────────────────────────────────────────────

interface AnalyticsDashboardResponse {
  success: true;
  role: 'admin';
  data: AdminAnalyticsData;
}

interface IncidentListResponse {
  success: boolean;
  data: { incidents: Incident[] };
}

interface AdvisoryListResponse {
  success: boolean;
  data: { advisories: Advisory[] };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminAnalyticsData | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [recentAdvisories, setRecentAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, incidentsRes, advisoriesRes] = await Promise.all([
        api.get<AnalyticsDashboardResponse>('/analytics/dashboard'),
        api.get<IncidentListResponse>('/incidents?limit=6&sort=-createdAt'),
        api.get<AdvisoryListResponse>('/advisories?status=Published&limit=3'),
      ]);
      setStats(analyticsRes.data);
      setRecentIncidents(incidentsRes.data.incidents);
      setRecentAdvisories(advisoriesRes.data.advisories);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    Promise.resolve().then(() => loadDashboard());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  // ── Auth loading ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Campus security overview" isAdmin>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-slate-500" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Data loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Campus security overview" isAdmin>
        <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Loading dashboard…</span>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Campus security overview" isAdmin>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={() => loadDashboard()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-sm text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const inc = stats?.incidents;
  const pending = (inc?.byStatus.reported ?? 0) + (inc?.byStatus.investigating ?? 0);

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Campus security overview" isAdmin>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Reports"
          value={inc?.total ?? 0}
          icon={FileText}
          iconColor="text-blue-400"
          iconBg="bg-blue-900/30"
        />
        <StatCard
          title="High / Critical"
          value={inc?.highAndCritical ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-400"
          iconBg="bg-red-900/30"
        />
        <StatCard
          title="Pending Review"
          value={pending}
          icon={Clock}
          iconColor="text-yellow-400"
          iconBg="bg-yellow-900/30"
        />
        <StatCard
          title="Resolved"
          value={inc?.byStatus.resolved ?? 0}
          icon={CheckCircle}
          iconColor="text-green-400"
          iconBg="bg-green-900/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent incidents */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Recent Incident Reports</h3>
            <Link
              href="/admin/incidents"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              Manage all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {recentIncidents.length === 0 ? (
              <p className="px-5 py-6 text-xs text-slate-500 text-center">No incidents reported yet.</p>
            ) : (
              recentIncidents.map((incident) => (
                <div key={incident._id} className="px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{incident.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">{incident.incidentId}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-500">{incident.reporter.fullName}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-500">{formatDate(incident.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <SeverityBadge severity={incident.severity} size="sm" />
                      <StatusBadge status={incident.status} size="sm" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick admin actions */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Admin Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Review Incidents', href: '/admin/incidents', icon: FileText, color: 'text-blue-400' },
                { label: 'Manage Advisories', href: '/admin/advisories', icon: Newspaper, color: 'text-teal-400' },
                { label: 'Threat Indicators', href: '/admin/indicators', icon: Shield, color: 'text-purple-400' },
                { label: 'View Analytics', href: '/analytics', icon: TrendingUp, color: 'text-green-400' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <action.icon size={16} className={action.color} />
                  <span>{action.label}</span>
                  <ArrowRight size={12} className="ml-auto opacity-40" />
                </Link>
              ))}
            </div>
          </div>

          {/* Summary row: students + published advisories */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Students"
              value={stats?.users.totalStudents ?? 0}
              icon={Users}
              iconColor="text-indigo-400"
              iconBg="bg-indigo-900/30"
            />
            <StatCard
              title="Advisories"
              value={stats?.advisories.totalPublished ?? 0}
              icon={Newspaper}
              iconColor="text-teal-400"
              iconBg="bg-teal-900/30"
            />
          </div>

          {/* Published advisories */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Published Advisories</h3>
              <Link
                href="/admin/advisories"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                Manage <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-800">
              {recentAdvisories.length === 0 ? (
                <p className="px-5 py-4 text-xs text-slate-500 text-center">No published advisories yet.</p>
              ) : (
                recentAdvisories.map((adv) => (
                  <div key={adv._id} className="px-5 py-3">
                    <SeverityBadge severity={adv.severity} size="sm" />
                    <p className="text-xs font-medium text-white mt-1.5 leading-snug">
                      {truncate(adv.title, 50)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(adv.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
