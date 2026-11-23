'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SeverityBadge, AdvisoryStatusBadge } from '@/components/Badges';
import { formatDate } from '@/lib/utils';
import type { Advisory, AdvisoryCategory, AdvisoryStatus, SeverityLevel } from '@/types';
import { api, ApiError } from '@/lib/api';
import {
  Plus, ArrowLeft, Edit3, Archive, CheckCircle, Search,
  Loader2, AlertCircle, Trash2, Eye, Send,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITIES: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES: AdvisoryCategory[] = [
  'Fake Internship',
  'Phishing Email',
  'University Impersonation',
  'Payment / QR Code Scam',
  'Fake Registration Form',
  'Account Security',
  'General Security Warning',
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'form';
type FormMode = 'create' | 'edit';

interface AdvisoryForm {
  title:              string;
  description:        string;
  category:           AdvisoryCategory | '';
  severity:           SeverityLevel | '';
  warningSigns:       string;   // newline-separated
  recommendedActions: string;   // newline-separated
  suspiciousUrls:     string;   // newline-separated
}

const emptyForm: AdvisoryForm = {
  title:              '',
  description:        '',
  category:           '',
  severity:           '',
  warningSigns:       '',
  recommendedActions: '',
  suspiciousUrls:     '',
};

interface AdvisoriesResponse {
  success: boolean;
  count:   number;
  total:   number;
  data:    { advisories: Advisory[] };
}

interface AdvisoryResponse {
  success: boolean;
  data:    { advisory: Advisory };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAdvisoriesPage() {
  const [advisories, setAdvisories]   = useState<Advisory[]>([]);
  const [loading, setLoading]         = useState(true);
  const [listError, setListError]     = useState('');

  const [viewMode, setViewMode]   = useState<ViewMode>('list');
  const [formMode, setFormMode]   = useState<FormMode>('create');
  const [editTarget, setEditTarget] = useState<Advisory | null>(null);

  const [form, setForm]             = useState<AdvisoryForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AdvisoryForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState('');
  const [submitError, setSubmitError] = useState('');

  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [actionMsg, setActionMsg]     = useState('');
  const [actionError, setActionError] = useState('');

  // ─── Fetch list ─────────────────────────────────────────────────────────────

  const fetchAdvisories = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (search)       params.set('search', search);
      params.set('limit', '100');

      const qs = params.toString();
      const res = await api.get<AdvisoriesResponse>(`/advisories${qs ? `?${qs}` : ''}`);
      setAdvisories(res.data.advisories);
    } catch {
      setListError('Failed to load advisories.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    const run = async () => { await fetchAdvisories(); };
    void run();
  }, [fetchAdvisories]);

  // ─── Form helpers ────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setSubmitMsg('');
    setSubmitError('');
    setFormMode('create');
    setEditTarget(null);
    setViewMode('form');
  }

  function openEdit(adv: Advisory) {
    setForm({
      title:              adv.title,
      description:        adv.description,
      category:           adv.category,
      severity:           adv.severity,
      warningSigns:       adv.warningSigns.join('\n'),
      recommendedActions: adv.recommendedActions.join('\n'),
      suspiciousUrls:     adv.suspiciousUrls.join('\n'),
    });
    setFormErrors({});
    setSubmitMsg('');
    setSubmitError('');
    setFormMode('edit');
    setEditTarget(adv);
    setViewMode('form');
  }

  function validateForm(): Partial<Record<keyof AdvisoryForm, string>> {
    const e: Partial<Record<keyof AdvisoryForm, string>> = {};
    if (!form.title.trim())       e.title    = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category)           e.category = 'Category is required';
    if (!form.severity)           e.severity = 'Severity is required';
    return e;
  }

  function parseLines(raw: string): string[] {
    return raw.split('\n').map((s) => s.trim()).filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitMsg('');
    setSubmitError('');

    const body = {
      title:              form.title.trim(),
      description:        form.description.trim(),
      category:           form.category,
      severity:           form.severity,
      warningSigns:       parseLines(form.warningSigns),
      recommendedActions: parseLines(form.recommendedActions),
      suspiciousUrls:     parseLines(form.suspiciousUrls),
    };

    try {
      if (formMode === 'create') {
        await api.post<AdvisoryResponse>('/advisories', body);
        setSubmitMsg('Advisory created as Draft. Use Publish to make it visible to students.');
      } else if (editTarget) {
        await api.patch<AdvisoryResponse>(`/advisories/${editTarget._id}`, body);
        setSubmitMsg('Advisory updated successfully.');
      }
      await fetchAdvisories();
      setTimeout(() => { setSubmitMsg(''); setViewMode('list'); }, 2000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Save failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Action handlers ─────────────────────────────────────────────────────────

  async function handleStatusChange(adv: Advisory, newStatus: AdvisoryStatus) {
    setActionMsg('');
    setActionError('');
    try {
      await api.patch<AdvisoryResponse>(`/advisories/${adv._id}`, { status: newStatus });
      setActionMsg(`Advisory "${adv.title}" ${newStatus === 'Published' ? 'published' : newStatus === 'Archived' ? 'archived' : 'updated'}.`);
      await fetchAdvisories();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Action failed.';
      setActionError(msg);
      setTimeout(() => setActionError(''), 4000);
    }
  }

  async function handleDelete(adv: Advisory) {
    if (!confirm(`Delete advisory "${adv.title}"? This cannot be undone.`)) return;
    setActionMsg('');
    setActionError('');
    try {
      await api.delete(`/advisories/${adv._id}`);
      setActionMsg(`Advisory "${adv.title}" deleted.`);
      await fetchAdvisories();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Delete failed.';
      setActionError(msg);
      setTimeout(() => setActionError(''), 4000);
    }
  }

  // ─── Form view ───────────────────────────────────────────────────────────────

  if (viewMode === 'form') {
    return (
      <DashboardLayout title={formMode === 'create' ? 'Create Advisory' : 'Edit Advisory'} isAdmin>
        <button onClick={() => setViewMode('list')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5">
          <ArrowLeft size={16} /> Back
        </button>

        {submitMsg && (
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-3 mb-4">
            <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300">{submitMsg}</p>
          </div>
        )}
        {submitError && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-5">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Advisory title…"
                className={`w-full bg-[#0d1421] border ${formErrors.title ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
              />
              {formErrors.title && <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
            </div>

            {/* Category + Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as AdvisoryCategory }))}
                  className={`w-full bg-[#0d1421] border ${formErrors.category ? 'border-red-500' : 'border-slate-700'} text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500`}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {formErrors.category && <p className="text-xs text-red-400 mt-1">{formErrors.category}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Severity *</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value as SeverityLevel }))}
                  className={`w-full bg-[#0d1421] border ${formErrors.severity ? 'border-red-500' : 'border-slate-700'} text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500`}
                >
                  <option value="">Select severity</option>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {formErrors.severity && <p className="text-xs text-red-400 mt-1">{formErrors.severity}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Description *</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detailed advisory description…"
                className={`w-full bg-[#0d1421] border ${formErrors.description ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none transition-colors`}
              />
              {formErrors.description && <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>}
            </div>

            {/* Warning Signs */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Warning Signs <span className="text-slate-500">(one per line)</span></label>
              <textarea
                rows={3}
                value={form.warningSigns}
                onChange={(e) => setForm((p) => ({ ...p, warningSigns: e.target.value }))}
                placeholder={"Unsolicited email asking for personal details\nRequest for payment via UPI/QR code"}
                className="w-full bg-[#0d1421] border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
            </div>

            {/* Recommended Actions */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Recommended Actions <span className="text-slate-500">(one per line)</span></label>
              <textarea
                rows={3}
                value={form.recommendedActions}
                onChange={(e) => setForm((p) => ({ ...p, recommendedActions: e.target.value }))}
                placeholder={"Do not click any links in the email\nReport to IT security team"}
                className="w-full bg-[#0d1421] border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
            </div>

            {/* Suspicious URLs */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Suspicious URLs <span className="text-slate-500">(one per line)</span></label>
              <textarea
                rows={2}
                value={form.suspiciousUrls}
                onChange={(e) => setForm((p) => ({ ...p, suspiciousUrls: e.target.value }))}
                placeholder="http://fake-internship-portal.net/apply"
                className="w-full bg-[#0d1421] border border-slate-700 text-white placeholder-slate-500 text-sm font-mono rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : formMode === 'create' ? 'Save as Draft' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="border border-slate-700 text-slate-300 hover:text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            {formMode === 'create' && (
              <span className="text-xs text-slate-500">New advisories start as Draft. Publish from the list view.</span>
            )}
          </div>
        </form>
      </DashboardLayout>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Manage Advisories" subtitle={`${advisories.length} total`} isAdmin>
      {/* Action feedback */}
      {actionMsg && (
        <div className="flex items-center gap-2 bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-300">{actionMsg}</p>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{actionError}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search advisories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 text-white placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#111827] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Archived">Archived</option>
        </select>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> New Advisory
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
        </div>
      )}

      {/* List error */}
      {listError && !loading && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">{listError}</p>
          <button onClick={fetchAdvisories} className="ml-auto text-xs text-red-400 underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Table */}
      {!loading && !listError && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Severity</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden lg:table-cell">Updated</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {advisories.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-slate-500 py-12 text-sm">No advisories found.</td></tr>
                ) : advisories.map((adv) => (
                  <tr key={adv._id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-white font-medium line-clamp-1">{adv.title}</p>
                      <p className="text-xs text-slate-500">{adv.advisoryId}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-slate-400">{adv.category}</span>
                    </td>
                    <td className="px-5 py-3.5"><SeverityBadge severity={adv.severity} size="sm" /></td>
                    <td className="px-5 py-3.5"><AdvisoryStatusBadge status={adv.status} /></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{formatDate(adv.updatedAt)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => openEdit(adv)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                          title="Edit"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        {adv.status === 'Draft' && (
                          <button
                            onClick={() => handleStatusChange(adv, 'Published')}
                            className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                            title="Publish"
                          >
                            <Send size={12} /> Publish
                          </button>
                        )}
                        {adv.status === 'Published' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(adv, 'Draft')}
                              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                              title="Revert to Draft"
                            >
                              <Eye size={12} /> Draft
                            </button>
                            <button
                              onClick={() => handleStatusChange(adv, 'Archived')}
                              className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                              title="Archive"
                            >
                              <Archive size={12} /> Archive
                            </button>
                          </>
                        )}
                        {adv.status === 'Archived' && (
                          <button
                            onClick={() => handleStatusChange(adv, 'Published')}
                            className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                            title="Re-publish"
                          >
                            <Send size={12} /> Re-publish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(adv)}
                          className="text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                          title="Delete"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
            {advisories.length} advisories shown
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
