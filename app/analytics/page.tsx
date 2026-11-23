'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type {
  AnalyticsDashboardResponse,
  AdminAnalyticsData,
  StudentAnalyticsData,
  Incident,
} from '@/types';
import { formatDate } from '@/lib/utils';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Loader2, AlertCircle, FileText, Shield, Users, Brain } from 'lucide-react';
import { SeverityBadge, StatusBadge } from '@/components/Badges';

// ─── Chart colours ────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#eab308',
  Low:      '#22c55e',
};

const STATUS_COLORS: Record<string, string> = {
  Reported:      '#3b82f6',
  Investigating: '#eab308',
  Resolved:      '#22c55e',
  Rejected:      '#64748b',
};

const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#ef4444', '#22c55e', '#a78bfa'];

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
      <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [adminData, setAdminData]     = useState<AdminAnalyticsData | null>(null);
  const [studentData, setStudentData] = useState<StudentAnalyticsData | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get<AnalyticsDashboardResponse>('/analytics/dashboard');
        if (res.role === 'admin') {
          setAdminData(res.data as AdminAnalyticsData);
        } else {
          setStudentData(res.data as StudentAnalyticsData);
        }
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to load analytics.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Security Analytics" subtitle="Incident trends and statistics" isAdmin={user?.role === 'admin'}>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="text-blue-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Security Analytics" subtitle="Incident trends and statistics" isAdmin={user?.role === 'admin'}>
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 my-6">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Admin analytics ──────────────────────────────────────────────────────────

  if (adminData) {
    const { incidents, advisories, users, quiz } = adminData;

    // Prepare chart data from real API fields
    const statusData = [
      { name: 'Reported',      value: incidents.byStatus.reported },
      { name: 'Investigating', value: incidents.byStatus.investigating },
      { name: 'Resolved',      value: incidents.byStatus.resolved },
      { name: 'Rejected',      value: incidents.byStatus.rejected },
    ].filter((d) => d.value > 0);

    const severityData = incidents.bySeverity.map((r) => ({ name: r.severity, value: r.count }));
    const categoryData = incidents.byCategory.map((r) => ({ name: r.category, value: r.count }));
    const trendData    = incidents.monthlyTrend.map((r) => ({ date: r.label, incidents: r.count }));

    const resolutionRate = incidents.total > 0
      ? Math.round((incidents.byStatus.resolved / incidents.total) * 100)
      : 0;

    return (
      <DashboardLayout title="Security Analytics" subtitle="Incident trends and statistics" isAdmin>
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Incidents"   value={incidents.total}            color="text-blue-400" />
          <StatCard label="Critical / High"   value={incidents.highAndCritical}  color="text-red-400" />
          <StatCard label="Reported / Active" value={incidents.byStatus.reported + incidents.byStatus.investigating} color="text-orange-400" />
          <StatCard label="Resolution Rate"   value={`${resolutionRate}%`}       color="text-green-400" />
        </div>

        {/* Secondary stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Published Advisories</p>
              <p className="text-xl font-bold text-white">{advisories.totalPublished}</p>
            </div>
          </div>
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Registered Students</p>
              <p className="text-xl font-bold text-white">{users.totalStudents}</p>
            </div>
          </div>
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex items-center gap-3">
            <div className="w-9 h-9 bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Quiz Attempts</p>
              <p className="text-xl font-bold text-white">{quiz.totalAttempts}</p>
            </div>
          </div>
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Avg Quiz Score</p>
              <p className="text-xl font-bold text-white">{quiz.averagePercentage}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Incidents over time */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Monthly Incident Trend (Last 6 Months)</h3>
            {trendData.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No trend data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="Incidents" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Severity distribution */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Severity Distribution</h3>
            {severityData.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No incidents recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Category breakdown */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Incidents by Category</h3>
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No incidents recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Incidents">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Resolution status */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Resolution Status</h3>
            {statusData.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No incidents recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Count">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Student analytics ────────────────────────────────────────────────────────

  if (studentData) {
    const { incidents, quiz } = studentData;

    const statusData = [
      { name: 'Pending',  value: incidents.pending },
      { name: 'Resolved', value: incidents.resolved },
      { name: 'Rejected', value: incidents.rejected },
    ].filter((d) => d.value > 0);

    const STUDENT_STATUS_COLORS: Record<string, string> = {
      Pending:  '#f97316',
      Resolved: '#22c55e',
      Rejected: '#64748b',
    };

    return (
      <DashboardLayout title="My Analytics" subtitle="Your incident and quiz statistics">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Incidents"   value={incidents.total}       color="text-blue-400" />
          <StatCard label="Pending"            value={incidents.pending}     color="text-orange-400" />
          <StatCard label="Resolved"           value={incidents.resolved}    color="text-green-400" />
          <StatCard label="Quiz Attempts"      value={quiz.totalAttempts}    color="text-purple-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Status distribution */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">My Incident Status</h3>
            {statusData.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">You have no incidents on record.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Count">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STUDENT_STATUS_COLORS[entry.name] ?? '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quiz stats */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Quiz Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-sm text-slate-400">Total Attempts</span>
                <span className="text-sm font-semibold text-white">{quiz.totalAttempts}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-sm text-slate-400">Average Score</span>
                <span className={`text-sm font-semibold ${quiz.averagePercentage >= 70 ? 'text-green-400' : quiz.averagePercentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {quiz.averagePercentage}%
                </span>
              </div>
              {quiz.latestPercentage !== null && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-slate-800">
                    <span className="text-sm text-slate-400">Latest Score</span>
                    <span className={`text-sm font-semibold ${quiz.latestPercentage >= 70 ? 'text-green-400' : quiz.latestPercentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {quiz.latestScore}/{quiz.latestTotal} ({quiz.latestPercentage}%)
                    </span>
                  </div>
                  {quiz.latestAttemptDate && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-slate-400">Last Attempted</span>
                      <span className="text-sm text-slate-300">{formatDate(quiz.latestAttemptDate)}</span>
                    </div>
                  )}
                </>
              )}
              {quiz.totalAttempts === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">Take the quiz to see your stats here!</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent incidents */}
        {incidents.recent.length > 0 && (
          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Recent Incidents</h3>
            </div>
            <div className="divide-y divide-slate-800/60">
              {incidents.recent.map((inc: Incident) => (
                <div key={inc._id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{inc.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{inc.incidentId} · {formatDate(inc.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SeverityBadge severity={inc.severity} size="sm" />
                    <StatusBadge status={inc.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  return null;
}
