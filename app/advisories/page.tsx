'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SeverityBadge } from '@/components/Badges';
import { formatDate, truncate } from '@/lib/utils';
import type { Advisory, AdvisoryCategory, SeverityLevel } from '@/types';
import { api } from '@/lib/api';
import { Search, ArrowLeft, Shield, Calendar, AlertCircle, Loader2 } from 'lucide-react';

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

const categoryIcons: Record<AdvisoryCategory, string> = {
  'Fake Internship':          '💼',
  'Phishing Email':           '🎣',
  'University Impersonation': '🏛️',
  'Payment / QR Code Scam':   '💸',
  'Fake Registration Form':   '📋',
  'Account Security':         '🔑',
  'General Security Warning': '⚠️',
};

const severityCardBorder: Record<SeverityLevel, string> = {
  Critical: 'border-red-700/40 hover:border-red-600/60',
  High:     'border-orange-700/40 hover:border-orange-600/60',
  Medium:   'border-yellow-700/40 hover:border-yellow-600/60',
  Low:      'border-green-700/40 hover:border-green-600/60',
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

export default function AdvisoriesPage() {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [selected, setSelected]       = useState<Advisory | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const fetchAdvisories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterSeverity) params.set('severity', filterSeverity);
      if (filterCategory) params.set('category', filterCategory);
      if (search)         params.set('search', search);
      params.set('limit', '50');

      const qs = params.toString();
      const res = await api.get<AdvisoriesResponse>(`/advisories${qs ? `?${qs}` : ''}`);
      setAdvisories(res.data.advisories);
    } catch {
      setError('Failed to load advisories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filterSeverity, filterCategory]);

  useEffect(() => {
    const run = async () => { await fetchAdvisories(); };
    void run();
  }, [fetchAdvisories]);

  async function openDetail(adv: Advisory) {
    setDetailLoading(true);
    setDetailError('');
    setSelected(adv); // show immediately with list data, then refresh
    try {
      const res = await api.get<AdvisoryResponse>(`/advisories/${adv._id}`);
      setSelected(res.data.advisory);
    } catch {
      setDetailError('Could not load full advisory details.');
    } finally {
      setDetailLoading(false);
    }
  }

  // ── Detail view ───────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <DashboardLayout title="Advisory Detail" subtitle={selected.advisoryId}>
        <button
          onClick={() => { setSelected(null); setDetailError(''); }}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft size={16} /> Back to Advisories
        </button>

        {detailError && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{detailError}</p>
          </div>
        )}

        <div className="max-w-2xl">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{categoryIcons[selected.category] ?? '📋'}</span>
                  <span className="text-xs text-slate-400">{selected.category}</span>
                </div>
                <h2 className="text-base font-semibold text-white leading-snug">{selected.title}</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <SeverityBadge severity={selected.severity} />
                {detailLoading && <Loader2 size={14} className="text-slate-500 animate-spin" />}
              </div>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Description</p>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line">{selected.description}</div>
              </div>

              {selected.warningSigns?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Warning Signs</p>
                  <ul className="space-y-1.5">
                    {selected.warningSigns.map((sign, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <span className="text-yellow-400 flex-shrink-0 mt-0.5">⚠</span>
                        {sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.recommendedActions?.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-400 font-semibold mb-2">Recommended Actions</p>
                      <ul className="space-y-1.5">
                        {selected.recommendedActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="text-blue-400 flex-shrink-0">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {selected.suspiciousUrls?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Suspicious URLs</p>
                  <div className="space-y-1">
                    {selected.suspiciousUrls.map((u, i) => (
                      <p key={i} className="text-xs text-red-300 font-mono bg-red-900/10 border border-red-800/30 px-3 py-1.5 rounded break-all">
                        {u}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1"><Calendar size={12} /> Published: {formatDate(selected.updatedAt)}</span>
                <span className="text-slate-600">{selected.advisoryId}</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Security Advisories" subtitle="Campus threat intelligence and warnings">
      {/* Filters */}
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
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="bg-[#111827] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500">
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-[#111827] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
          <button onClick={fetchAdvisories} className="ml-auto text-xs text-red-400 underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && advisories.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">No published advisories found.</div>
      )}

      {!loading && advisories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advisories.map((adv) => (
            <div
              key={adv._id}
              onClick={() => openDetail(adv)}
              className={`bg-[#111827] border ${severityCardBorder[adv.severity]} rounded-xl p-5 cursor-pointer transition-colors`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{categoryIcons[adv.category] ?? '📋'}</span>
                  <span className="text-xs text-slate-400">{adv.category}</span>
                </div>
                <SeverityBadge severity={adv.severity} size="sm" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2 leading-snug">{adv.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{truncate(adv.description, 120)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{formatDate(adv.updatedAt)}</span>
                <span className="text-xs text-blue-400">Read more →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
