'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { SeverityBadge, StatusBadge } from '@/components/Badges';
import { formatDate, truncate } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Advisory, StudentDashboardData, Incident } from '@/types';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
  Newspaper,
  Plus,
  Link2,
  Brain,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface AdvisoriesResponse {
  success: boolean;
  count: number;
  data: { advisories: Advisory[] };
}

interface DashboardResponse {
  success: boolean;
  role: string;
  data: StudentDashboardData;
}

const quickActions = [
  { label: 'Report Incident', href: '/incidents', icon: Plus, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/30' },
  { label: 'View Advisories', href: '/advisories', icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700/30' },
  { label: 'Check a URL', href: '/url-checker', icon: Link2, color: 'text-teal-400', bg: 'bg-teal-900/20', border: 'border-teal-700/30' },
  { label: 'Take Cyber Quiz', href: '/cyber-quiz', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-700/30' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [dashData, setDashData] = useState<StudentDashboardData | null>(null);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    // Redirect admins to their own dashboard
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    async function load() {
      try {
        const [dashRes, advRes] = await Promise.all([
          api.get<DashboardResponse>('/analytics/dashboard'),
          api.get<AdvisoriesResponse>('/advisories?status=Published&limit=3'),
        ]);
        setDashData(dashRes.data);
        setAdvisories(advRes.data.advisories);
      } catch (err) {
        if (err instanceof ApiError) {
          setPageError(err.message);
        } else {
          setPageError('Failed to load dashboard data. Please refresh.');
        }
      } finally {
        setPageLoading(false);
      }
    }

    load();
  }, [user, authLoading, router]);

  if (authLoading || pageLoading) {
    return (
      <DashboardLayout title="Student Dashboard" subtitle="Loading…">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (pageError) {
    return (
      <DashboardLayout title="Student Dashboard" subtitle="Error loading data">
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 max-w-md">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{pageError}</p>
        </div>
      </DashboardLayout>
    );
  }

  const firstName = user?.fullName.split(' ')[0] ?? 'there';
  const totalCount = dashData?.incidents.total ?? 0;
  const pendingCount = dashData?.incidents.pending ?? 0;
  const resolvedCount = dashData?.incidents.resolved ?? 0;
  const recentIncidents: Incident[] = dashData?.incidents.recent ?? [];

  return (
    <DashboardLayout
      title="Student Dashboard"
      subtitle={`Welcome back, ${user?.fullName ?? ''}`}
    >
      {/* Welcome banner */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              Good day, {firstName} 👋
            </h2>
            <p className="text-sm text-slate-400">
              You have{' '}
              <span className="text-orange-400 font-medium">{pendingCount} pending</span> and{' '}
              <span className="text-green-400 font-medium">{resolvedCount} resolved</span>{' '}
              incidents.{' '}
              Check the latest advisories to stay informed.
            </p>
          </div>
          <Link
            href="/incidents"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Report Incident
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Incidents"
          value={totalCount}
          icon={FileText}
          iconColor="text-blue-400"
          iconBg="bg-blue-900/30"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={AlertTriangle}
          iconColor="text-orange-400"
          iconBg="bg-orange-900/30"
        />
        <StatCard
          title="Resolved"
          value={resolvedCount}
          icon={CheckCircle}
          iconColor="text-green-400"
          iconBg="bg-green-900/30"
        />
        <StatCard
          title="Rejected"
          value={dashData?.incidents.rejected ?? 0}
          icon={Clock}
          iconColor="text-slate-400"
          iconBg="bg-slate-800/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent incidents */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Recent Incidents</h3>
            <Link
              href="/incidents"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {recentIncidents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-slate-500 text-sm">No incidents yet.</p>
                <Link
                  href="/incidents"
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                >
                  Report your first incident →
                </Link>
              </div>
            ) : (
              recentIncidents.map((incident) => (
                <div
                  key={incident._id}
                  className="px-5 py-3.5 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{incident.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{incident.incidentId}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-500">
                          {formatDate(incident.createdAt)}
                        </span>
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
          {/* Quick actions */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg ${action.bg} border ${action.border} hover:opacity-80 transition-opacity text-center`}
                >
                  <action.icon size={18} className={action.color} />
                  <span className="text-xs font-medium text-white leading-tight">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Latest advisories */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Latest Advisories</h3>
              <Link
                href="/advisories"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-800">
              {advisories.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-slate-500 text-sm">No advisories yet.</p>
                </div>
              ) : (
                advisories.map((adv) => (
                  <div key={adv._id} className="px-5 py-3.5">
                    <SeverityBadge severity={adv.severity} size="sm" />
                    <p className="text-xs font-medium text-white mt-1.5 leading-snug">
                      {truncate(adv.title, 55)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(adv.createdAt)}
                    </p>
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
