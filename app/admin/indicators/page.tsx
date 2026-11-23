'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { formatDate } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Indicator, IndicatorType } from '@/types';
import {
  Plus,
  Search,
  Shield,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const INDICATOR_TYPES: IndicatorType[] = ['Domain', 'URL'];

const typeColors: Record<IndicatorType, string> = {
  Domain: 'text-blue-400 bg-blue-900/20 border-blue-700/30',
  URL: 'text-purple-400 bg-purple-900/20 border-purple-700/30',
};

// ─── API response types ───────────────────────────────────────────────────────

interface IndicatorListResponse {
  success: boolean;
  count: number;
  total: number;
  data: { indicators: Indicator[] };
}

interface CreateIndicatorResponse {
  success: boolean;
  message: string;
  data: { indicator: Indicator };
}

// ─── Form type ────────────────────────────────────────────────────────────────

interface IndicatorForm {
  value: string;
  type: IndicatorType | '';
  description: string;
}

const emptyForm: IndicatorForm = { value: '', type: '', description: '' };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminIndicatorsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  // Local-only toggle set: _ids of indicators the admin has disabled this session.
  // The backend has no isActive field, so this is a UI-only overlay.
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<IndicatorForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<IndicatorForm>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saved, setSaved] = useState(false);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  // ── Load indicators ─────────────────────────────────────────────────────────

  const loadIndicators = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const res = await api.get<IndicatorListResponse>('/indicators?limit=200');
      setIndicators(res.data.indicators);
    } catch (err) {
      if (err instanceof ApiError) {
        setListError(err.message);
      } else {
        setListError('Failed to load indicators. Please try again.');
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
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    Promise.resolve().then(() => loadIndicators());
  }, [user, authLoading, router, loadIndicators]);

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filtered = indicators.filter((ind) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      ind.rawValue.toLowerCase().includes(q) ||
      ind.value.toLowerCase().includes(q) ||
      ind.description.toLowerCase().includes(q);
    const matchType = !filterType || ind.type === filterType;
    return matchSearch && matchType;
  });

  // ── Form validation ─────────────────────────────────────────────────────────

  function validate(): Partial<IndicatorForm> {
    const e: Partial<IndicatorForm> = {};
    if (!form.value.trim()) e.value = 'Indicator value is required';
    if (!form.type) e.type = 'Type is required' as IndicatorType;
    if (!form.description.trim()) e.description = 'Description / reason is required';
    return e;
  }

  // ── Create indicator ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitLoading(true);
    setSubmitError('');
    try {
      const res = await api.post<CreateIndicatorResponse>('/indicators', {
        value: form.value.trim(),
        type: form.type,
        description: form.description.trim(),
      });
      setIndicators((prev) => [res.data.indicator, ...prev]);
      setSaved(true);
      setForm(emptyForm);
      setFormErrors({});
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to add indicator. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  // ── Toggle (local-only) ─────────────────────────────────────────────────────

  function handleToggle(id: string) {
    setDisabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Delete indicator ────────────────────────────────────────────────────────

  async function handleRemove(id: string) {
    setDeleteLoadingId(id);
    try {
      await api.delete(`/indicators/${id}`);
      setIndicators((prev) => prev.filter((ind) => ind._id !== id));
      setDisabledIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      // Surface delete errors inline — keep row visible
      const msg = err instanceof ApiError ? err.message : 'Delete failed.';
      alert(msg);
    } finally {
      setDeleteLoadingId(null);
    }
  }

  // ── Auth loading ────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <DashboardLayout title="Threat Indicators" subtitle="Manage suspicious domains and URLs" isAdmin>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-slate-500" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Summary counts ──────────────────────────────────────────────────────────

  const isActive = (ind: Indicator) => !disabledIds.has(ind._id);

  return (
    <DashboardLayout title="Threat Indicators" subtitle="Manage suspicious domains and URLs" isAdmin>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
        {INDICATOR_TYPES.map((type) => {
          const count = indicators.filter((i) => i.type === type && isActive(i)).length;
          return (
            <div key={type} className="bg-[#111827] border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">{type}s</p>
              <p className="text-2xl font-bold text-white">{count}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[type]}`}>Active</span>
            </div>
          );
        })}
      </div>

      {/* Add indicator */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl mb-5">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-white hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-blue-400" />
            Add New Threat Indicator
          </div>
          <span className="text-slate-400">{showForm ? '▲' : '▼'}</span>
        </button>

        {showForm && (
          <div className="border-t border-slate-800 p-5">
            {saved && (
              <div className="flex items-center gap-2 bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-3 mb-4">
                <CheckCircle size={15} className="text-green-400" />
                <p className="text-sm text-green-300">Indicator saved to database.</p>
              </div>
            )}
            {submitError && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
                <AlertCircle size={15} className="text-red-400" />
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Indicator Value *</label>
                  <input
                    type="text"
                    value={form.value}
                    onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                    placeholder="e.g. phishing-domain.net"
                    className={`w-full bg-[#0d1421] border ${formErrors.value ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {formErrors.value && <p className="text-xs text-red-400 mt-1">{formErrors.value}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as IndicatorType }))}
                    className={`w-full bg-[#0d1421] border ${formErrors.type ? 'border-red-500' : 'border-slate-700'} text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500`}
                  >
                    <option value="">Select type</option>
                    {INDICATOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {formErrors.type && <p className="text-xs text-red-400 mt-1">{formErrors.type}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Description / Reason *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Why is this flagged?"
                  className={`w-full bg-[#0d1421] border ${formErrors.description ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                />
                {formErrors.description && <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  {submitLoading && <Loader2 size={14} className="animate-spin" />}
                  Add Indicator
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(emptyForm); setFormErrors({}); setSubmitError(''); }}
                  className="border border-slate-700 text-slate-300 hover:text-white px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search indicators…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 text-white placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#111827] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Types</option>
          {INDICATOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Value</th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Type</th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden md:table-cell">Description</th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden lg:table-cell">Added</th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm">Loading indicators…</span>
                    </div>
                  </td>
                </tr>
              ) : listError ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle size={24} className="text-red-400" />
                      <p className="text-sm text-slate-300">{listError}</p>
                      <button
                        onClick={() => loadIndicators()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-sm text-white hover:bg-slate-700 transition-colors"
                      >
                        <RefreshCw size={14} /> Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-12 text-sm">
                    No indicators found.
                  </td>
                </tr>
              ) : (
                filtered.map((ind) => {
                  const active = isActive(ind);
                  const deleting = deleteLoadingId === ind._id;
                  return (
                    <tr
                      key={ind._id}
                      className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${!active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Shield size={13} className="text-slate-500 flex-shrink-0" />
                          <span className="text-xs text-white font-mono break-all max-w-xs">{ind.rawValue}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[ind.type]}`}>
                          {ind.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-400 line-clamp-1">{ind.description}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-slate-400">{formatDate(ind.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${active ? 'text-green-400 bg-green-900/20 border-green-700/30' : 'text-slate-400 bg-slate-800/50 border-slate-700/50'}`}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleToggle(ind._id)}
                            className={`text-xs transition-colors ${active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                          >
                            {active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleRemove(ind._id)}
                            disabled={deleting}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
          {listLoading ? 'Loading…' : `${filtered.length} of ${indicators.length} indicators`}
        </div>
      </div>
    </DashboardLayout>
  );
}
