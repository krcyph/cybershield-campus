'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { SeverityBadge, StatusBadge } from '@/components/Badges';
import { formatDate } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Incident, SeverityLevel, IncidentStatus } from '@/types';
import { Search, ArrowLeft, CheckCircle, Edit3, X, Loader2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

const SEVERITIES: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: IncidentStatus[] = ['Reported', 'Investigating', 'Resolved', 'Rejected'];

const severityDotColor: Record<SeverityLevel, string> = {
  Critical: 'bg-red-400',
  High: 'bg-orange-400',
  Medium: 'bg-yellow-400',
  Low: 'bg-green-400',
};

interface AdminIncidentsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  data: { incidents: Incident[] };
}

interface UpdateIncidentResponse {
  success: boolean;
  message: string;
  data: { incident: Incident };
}

export default function AdminIncidentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selected, setSelected] = useState<Incident | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<IncidentStatus>('Reported');
  const [editSeverity, setEditSeverity] = useState<SeverityLevel>('Low');
  const [editRemarks, setEditRemarks] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const loadIncidents = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterSeverity) params.set('severity', filterSeverity);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<AdminIncidentsResponse>(`/incidents${qs}`);
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
  }, [filterStatus, filterSeverity]);

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
    // Push to microtask queue to avoid calling setState synchronously in the effect
    Promise.resolve().then(() => loadIncidents());
  }, [user, authLoading, router, loadIncidents]);

  const filtered = incidents.filter((inc) => {
    const q = search.toLowerCase();
    return (
      !q ||
      inc.title.toLowerCase().includes(q) ||
      inc.incidentId.toLowerCase().includes(q) ||
      inc.reporter.fullName.toLowerCase().includes(q)
    );
  });

  function openDetail(inc: Incident) {
    setSelected(inc);
    setEditStatus(inc.status);
    setEditSeverity(inc.severity);
    setEditRemarks(inc.adminRemarks ?? '');
    setEditing(false);
    setSaved(false);
    setSaveError('');
    setDeleteConfirm(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaveLoading(true);
    setSaveError('');
    try {
      const res = await api.patch<UpdateIncidentResponse>(`/incidents/${selected._id}`, {
        status: editStatus,
        severity: editSeverity,
        adminRemarks: editRemarks || undefined,
      });
      const updated = res.data.incident;
      setIncidents((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      setSelected(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError('Failed to update incident. Please try again.');
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/incidents/${selected._id}`);
      setIncidents((prev) => prev.filter((i) => i._id !== selected._id));
      setSelected(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError('Failed to delete incident.');
      }
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }

  // ── Detail / edit view ────────────────────────────────────────────────────
  if (selected) {
    return (
      <DashboardLayout title="Incident Detail" subtitle={selected.incidentId} isAdmin>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft size={16} /> Back to Incidents
        </button>

        {saved && (
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-3 mb-4">
            <CheckCircle size={15} className="text-green-400" />
            <p className="text-sm text-green-300">Incident updated successfully.</p>
          </div>
        )}

        {saveError && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{saveError}</p>
          </div>
        )}

        <div className="max-w-2xl bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-white mb-1">{selected.title}</h2>
              <span className="text-xs text-slate-500 font-mono">{selected.incidentId}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-1.5 text-xs border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {editing ? <><X size={12} /> Cancel</> : <><Edit3 size={12} /> Edit</>}
              </button>
              {!editing && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs border border-red-700/40 text-red-400 hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Delete confirmation */}
          {deleteConfirm && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-300 mb-3">
                Permanently delete this incident? This cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="text-xs bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {deleteLoading && <Loader2 size={12} className="animate-spin" />}
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-xs border border-slate-700 text-slate-300 px-4 py-1.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Category</p>
                <p className="text-slate-200">{selected.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Reported By</p>
                <p className="text-slate-200">{selected.reporter.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Reporter Email</p>
                <p className="text-slate-400 text-xs">{selected.reporter.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Reported At</p>
                <p className="text-slate-200">{formatDate(selected.createdAt)}</p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Status</p>
                {editing ? (
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}
                    className="w-full bg-[#0d1421] border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={selected.status} />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Severity</p>
                {editing ? (
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value as SeverityLevel)}
                    className="w-full bg-[#0d1421] border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <SeverityBadge severity={selected.severity} />
                )}
              </div>
            </div>

            {selected.suspiciousUrl && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Suspicious URL</p>
                <p className="text-slate-300 break-all text-xs font-mono">
                  {selected.suspiciousUrl}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-slate-300 leading-relaxed">{selected.description}</p>
            </div>

            {/* Admin remarks */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Admin Remarks</p>
              {editing ? (
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Add investigation notes, resolution steps, etc."
                  className="w-full bg-[#0d1421] border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                />
              ) : (
                <p className="text-slate-300 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-sm">
                  {selected.adminRemarks ?? 'No admin remarks yet.'}
                </p>
              )}
            </div>

            {editing && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  {saveLoading && <Loader2 size={14} className="animate-spin" />}
                  {saveLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="border border-slate-700 text-slate-300 hover:text-white px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="Manage Incidents"
      subtitle={listLoading ? 'Loading…' : `${incidents.length} total reports`}
      isAdmin
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, ID or student name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 text-white placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
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
          onClick={loadIncidents}
          className="flex items-center gap-1.5 text-xs text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 px-3 py-2.5 rounded-lg transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Loading */}
      {listLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {!listLoading && listError && (
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 flex-1">{listError}</p>
          <button
            onClick={loadIncidents}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {!listLoading && !listError && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden md:table-cell">
                    Student
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
                    <td colSpan={7} className="text-center text-slate-500 py-12 text-sm">
                      No incidents found.
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
                        <span className="text-sm text-white font-medium">{incident.title}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-400">
                          {incident.reporter.fullName}
                        </span>
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
                          onClick={() => openDetail(incident)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
            {filtered.length} of {incidents.length} incidents
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
