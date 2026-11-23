'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { SeverityBadge, StatusBadge } from '@/components/Badges';
import { formatDate } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Incident, IncidentCategory, SeverityLevel, IncidentStatus } from '@/types';
import {
  Plus, Search, AlertTriangle, ArrowLeft, CheckCircle,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';

const CATEGORIES: IncidentCategory[] = [
  'Phishing Email',
  'Suspicious URL',
  'Fake Internship Offer',
  'Account Compromise',
  'Payment / QR Code Scam',
  'Impersonation',
  'Other',
];

const SEVERITIES: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: IncidentStatus[] = ['Reported', 'Investigating', 'Resolved', 'Rejected'];

type View = 'list' | 'form' | 'detail';

interface FormData {
  title: string;
  category: IncidentCategory | '';
  severity: SeverityLevel | '';
  description: string;
  suspiciousUrl: string;
  senderEmail: string;
}

interface IncidentsListResponse {
  success: boolean;
  count: number;
  data: { incidents: Incident[] };
}

interface IncidentDetailResponse {
  success: boolean;
  data: { incident: Incident };
}

interface CreateIncidentResponse {
  success: boolean;
  message: string;
  data: { incident: Incident };
}

const severityDotColor: Record<SeverityLevel, string> = {
  Critical: 'bg-red-400',
  High: 'bg-orange-400',
  Medium: 'bg-yellow-400',
  Low: 'bg-green-400',
};

export default function IncidentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [view, setView] = useState<View>('list');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [newIncident, setNewIncident] = useState<Incident | null>(null);
  const [form, setForm] = useState<FormData>({
    title: '',
    category: '',
    severity: '',
    description: '',
    suspiciousUrl: '',
    senderEmail: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

  const loadIncidents = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const res = await api.get<IncidentsListResponse>('/incidents/my');
      setIncidents(res.data.incidents);
    } catch (err) {
      if (err instanceof ApiError) {
        setListError(err.message);
      } else {
        setListError('Failed to load incidents. Please try again.');
      }
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    // Push to microtask queue to avoid calling setState synchronously in the effect
    Promise.resolve().then(() => loadIncidents());
  }, [user, authLoading, router, loadIncidents]);

  const filtered = incidents.filter((inc) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inc.title.toLowerCase().includes(q) ||
      inc.incidentId.toLowerCase().includes(q) ||
      inc.category.toLowerCase().includes(q);
    const matchCat = !filterCategory || inc.category === filterCategory;
    const matchSev = !filterSeverity || inc.severity === filterSeverity;
    const matchStat = !filterStatus || inc.status === filterStatus;
    return matchSearch && matchCat && matchSev && matchStat;
  });

  function validateForm(): Partial<FormData> {
    const e: Partial<FormData> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.category) e.category = 'Category is required' as IncidentCategory;
    if (!form.severity) e.severity = 'Severity is required' as SeverityLevel;
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.length < 20)
      e.description = 'Please provide more detail (min 20 characters)';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitLoading(true);
    try {
      const res = await api.post<CreateIncidentResponse>('/incidents', {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        severity: form.severity,
        suspiciousUrl: form.suspiciousUrl.trim() || undefined,
        senderEmail: form.senderEmail.trim() || undefined,
      });
      setNewIncident(res.data.incident);
      setSubmitted(true);
      // Add the new incident to the list
      setIncidents((prev) => [res.data.incident, ...prev]);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to submit incident. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  function resetForm() {
    setForm({
      title: '',
      category: '',
      severity: '',
      description: '',
      suspiciousUrl: '',
      senderEmail: '',
    });
    setFormErrors({});
    setSubmitError('');
    setSubmitted(false);
    setNewIncident(null);
    setView('list');
  }

  async function loadDetail(id: string) {
    try {
      const res = await api.get<IncidentDetailResponse>(`/incidents/${id}`);
      setSelectedIncident(res.data.incident);
      setView('detail');
    } catch (err) {
      if (err instanceof ApiError) {
        setListError(err.message);
      }
    }
  }

  // ── Detail view ───────────────────────────────────────────────────────────
  if (view === 'detail' && selectedIncident) {
    return (
      <DashboardLayout
        title="Incident Detail"
        subtitle={selectedIncident.incidentId}
      >
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft size={16} /> Back to Incidents
        </button>
        <div className="max-w-2xl">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">
                  {selectedIncident.title}
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedIncident.incidentId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={selectedIncident.severity} />
                <StatusBadge status={selectedIncident.status} />
              </div>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Category</p>
                  <p className="text-slate-200">{selectedIncident.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Reported At</p>
                  <p className="text-slate-200">{formatDate(selectedIncident.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                  <p className="text-slate-200">{formatDate(selectedIncident.updatedAt)}</p>
                </div>
              </div>
              {selectedIncident.suspiciousUrl && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Suspicious URL</p>
                  <p className="text-slate-300 break-all text-xs font-mono">
                    {selectedIncident.suspiciousUrl}
                  </p>
                </div>
              )}
              {selectedIncident.senderEmail && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Sender Email</p>
                  <p className="text-slate-300">{selectedIncident.senderEmail}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-slate-300 leading-relaxed">{selectedIncident.description}</p>
              </div>
              {selectedIncident.adminRemarks && (
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <p className="text-xs text-blue-400 font-medium mb-1">Admin Remarks</p>
                  <p className="text-slate-300 text-sm">{selectedIncident.adminRemarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Report form view ──────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <DashboardLayout title="Report an Incident" subtitle="Submit a new cybersecurity incident">
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {submitted && newIncident ? (
          <div className="max-w-md bg-[#111827] border border-green-700/40 rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-green-900/30 border border-green-700/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Incident Reported</h3>
            <p className="text-xs font-mono text-slate-400 mb-2">{newIncident.incidentId}</p>
            <p className="text-sm text-slate-400 mb-5">
              Your incident has been submitted and is now under review by the IT team.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Back to Incidents
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setNewIncident(null);
                  setForm({
                    title: '',
                    category: '',
                    severity: '',
                    description: '',
                    suspiciousUrl: '',
                    senderEmail: '',
                  });
                }}
                className="border border-slate-700 text-slate-300 hover:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Report Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-5">
            {submitError && (
              <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            )}

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Incident Title *
                </label>
                <input
                  type="text"
                  placeholder="Brief title of the incident"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`w-full bg-[#0d1421] border ${formErrors.title ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                />
                {formErrors.title && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as IncidentCategory })
                    }
                    className={`w-full bg-[#0d1421] border ${formErrors.category ? 'border-red-500' : 'border-slate-700'} text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.category}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Severity *
                  </label>
                  <select
                    value={form.severity}
                    onChange={(e) =>
                      setForm({ ...form, severity: e.target.value as SeverityLevel })
                    }
                    className={`w-full bg-[#0d1421] border ${formErrors.severity ? 'border-red-500' : 'border-slate-700'} text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  >
                    <option value="">Select severity</option>
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {formErrors.severity && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.severity}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description *
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe the incident in detail — what happened, when, and what you observed…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`w-full bg-[#0d1421] border ${formErrors.description ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors resize-none`}
                />
                {formErrors.description && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Suspicious URL{' '}
                  <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://suspicious-site.example"
                  value={form.suspiciousUrl}
                  onChange={(e) => setForm({ ...form, suspiciousUrl: e.target.value })}
                  className="w-full bg-[#0d1421] border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Sender Email{' '}
                  <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="suspicious@example.com"
                  value={form.senderEmail}
                  onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                  className="w-full bg-[#0d1421] border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitLoading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                {submitLoading && <Loader2 size={14} className="animate-spin" />}
                {submitLoading ? 'Submitting…' : 'Submit Incident Report'}
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className="border border-slate-700 text-slate-300 hover:text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </DashboardLayout>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="My Incidents"
      subtitle={listLoading ? 'Loading…' : `${incidents.length} total reports`}
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, ID or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 text-white placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#111827] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-[#111827] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#111827] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => setView('form')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Report Incident
        </button>
      </div>

      {/* Loading state */}
      {listLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {!listLoading && listError && (
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300">{listError}</p>
          </div>
          <button
            onClick={loadIncidents}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 ml-2"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Incidents table */}
      {!listLoading && !listError && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">
                    Severity
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden lg:table-cell">
                    Date
                  </th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      {incidents.length === 0 ? (
                        <div className="flex flex-col items-center gap-3">
                          <AlertTriangle size={28} className="text-slate-600" />
                          <p className="text-slate-500 text-sm">
                            No incidents reported yet.
                          </p>
                          <button
                            onClick={() => setView('form')}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Plus size={12} /> Report your first incident
                          </button>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">
                          No incidents match your filters.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((incident) => (
                    <tr
                      key={incident._id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDotColor[incident.severity]}`}
                          />
                          <span className="text-xs text-slate-400 font-mono">
                            {incident.incidentId}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-white font-medium line-clamp-1">
                          {incident.title}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-400">{incident.category}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <SeverityBadge severity={incident.severity} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={incident.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-slate-400">
                          {formatDate(incident.createdAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => loadDetail(incident._id)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
              Showing {filtered.length} of {incidents.length} incidents
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
