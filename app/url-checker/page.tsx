'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { RiskBadge } from '@/components/Badges';
import type { UrlCheckResult, FindingSeverity } from '@/types';
import { api, ApiError } from '@/lib/api';
import {
  Link2, Search, Shield, AlertTriangle, Info, CheckCircle,
  Loader2, Flag, AlertCircle, ExternalLink,
} from 'lucide-react';

// ─── Severity helpers (backend uses lowercase) ────────────────────────────────

function findingIcon(severity: FindingSeverity): React.ReactNode {
  switch (severity) {
    case 'critical': return <Shield size={15} className="text-red-400" />;
    case 'high':     return <AlertTriangle size={15} className="text-orange-400" />;
    case 'medium':   return <AlertTriangle size={15} className="text-yellow-400" />;
    case 'low':      return <Info size={15} className="text-blue-400" />;
    default:         return <CheckCircle size={15} className="text-green-400" />;
  }
}

function findingBg(severity: FindingSeverity): string {
  switch (severity) {
    case 'critical': return 'bg-red-900/20 border-red-700/40';
    case 'high':     return 'bg-orange-900/20 border-orange-700/40';
    case 'medium':   return 'bg-yellow-900/20 border-yellow-700/40';
    case 'low':      return 'bg-blue-900/20 border-blue-700/40';
    default:         return 'bg-green-900/20 border-green-700/40';
  }
}

function findingSeverityBadge(severity: FindingSeverity): string {
  switch (severity) {
    case 'critical': return 'text-red-400 bg-red-900/30 border-red-700/50';
    case 'high':     return 'text-orange-400 bg-orange-900/30 border-orange-700/50';
    case 'medium':   return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
    case 'low':      return 'text-blue-400 bg-blue-900/30 border-blue-700/50';
    default:         return 'text-green-400 bg-green-900/30 border-green-700/50';
  }
}

const riskBg: Record<string, string> = {
  Low:      'bg-green-900/20 border-green-700/40',
  Medium:   'bg-yellow-900/20 border-yellow-700/40',
  High:     'bg-orange-900/20 border-orange-700/40',
  Critical: 'bg-red-900/20 border-red-700/40',
};

const exampleUrls = [
  'university-hr.net/internship-verify',
  'https://docs.google.com/forms/d/e/1FAIpQLSfake_internship',
  'https://college.edu.in/results',
  'http://uni-exam-portal.in/login/verify',
];

interface AnalyzeResponse {
  success: boolean;
  data:    UrlCheckResult;
}

export default function UrlCheckerPage() {
  const [url, setUrl]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<UrlCheckResult | null>(null);
  const [error, setError]       = useState('');

  async function handleCheck() {
    if (!url.trim()) { setError('Please enter a URL to check.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post<AnalyzeResponse>('/url-checker/analyze', { url: url.trim() });
      setResult(res.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleCheck();
  }

  return (
    <DashboardLayout title="URL Checker" subtitle="Analyse suspicious links before clicking">
      {/* Input card */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 mb-5">
        <label className="block text-sm font-semibold text-white mb-3">Enter URL to Analyse</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="https://example.com/page or paste the suspicious link here…"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              className={`w-full bg-[#0d1421] border ${error ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
            />
          </div>
          <button
            onClick={() => void handleCheck()}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Analysing…</> : <><Search size={16} /> Analyse URL</>}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Example URLs */}
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleUrls.map((ex) => (
              <button
                key={ex}
                onClick={() => { setUrl(ex); setError(''); }}
                className="text-xs text-blue-400 bg-blue-900/20 border border-blue-700/30 px-2.5 py-1 rounded-full hover:bg-blue-900/40 transition-colors truncate max-w-xs"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-10 text-center">
          <Loader2 size={32} className="text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-300 font-medium">Analysing URL…</p>
          <p className="text-xs text-slate-500 mt-1">Checking campus indicators and URL patterns</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Risk summary */}
          <div className={`border rounded-xl p-6 ${riskBg[result.riskLevel] ?? 'bg-slate-900/20 border-slate-700/40'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-slate-400 mb-2">Risk Assessment</p>
                <div className="flex items-center gap-3 mb-3">
                  <RiskBadge risk={result.riskLevel} />
                  <span className="text-sm text-slate-400">Score: <span className="text-white font-semibold">{result.riskScore}/100</span></span>
                </div>
                <p className="text-sm text-slate-300 font-mono break-all">{result.url}</p>
                <p className="text-xs text-slate-500 mt-1">Hostname: {result.hostname}</p>
              </div>
              {result.isCampusIndicatorMatch && (
                <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-300 font-semibold">Campus Threat Match</span>
                </div>
              )}
            </div>
          </div>

          {/* Campus Indicator Matches */}
          {result.matchedIndicators.length > 0 && (
            <div className="bg-red-900/10 border border-red-700/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-sm font-semibold text-white">Campus Threat Indicators ({result.matchedIndicators.length})</h3>
              </div>
              <div className="space-y-2">
                {result.matchedIndicators.map((ind, i) => (
                  <div key={i} className="bg-[#0d1421] border border-red-800/40 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-red-300">{ind.value}</span>
                      <span className="text-xs text-slate-500">({ind.type})</span>
                    </div>
                    <p className="text-xs text-slate-400">{ind.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings */}
          {result.findings.length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Findings ({result.findings.length})</h3>
              </div>
              <div className="divide-y divide-slate-800">
                {result.findings.map((finding, i) => (
                  <div key={i} className={`m-4 border rounded-lg p-4 ${findingBg(finding.severity)}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{findingIcon(finding.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-medium text-white">{finding.title}</p>
                          {finding.severity !== 'info' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${findingSeverityBadge(finding.severity)}`}>
                              {finding.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{finding.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related advisories */}
          {result.relatedAdvisories.length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Related Campus Advisories ({result.relatedAdvisories.length})</h3>
              </div>
              <div className="space-y-3">
                {result.relatedAdvisories.map((adv, i) => (
                  <div key={i} className="bg-purple-900/10 border border-purple-800/30 rounded-lg px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-white">{adv.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-400">{adv.severity}</span>
                        <a href="/advisories" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                          <ExternalLink size={11} /> View
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{adv.category} · {adv.advisoryId}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended actions */}
          {result.recommendations.length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Recommendations</h3>
              </div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="flex items-start gap-2 bg-slate-800/40 border border-slate-700/40 rounded-lg px-4 py-3">
              <Info size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">{result.disclaimer}</p>
            </div>
          )}

          {/* Report button */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white mb-1">Still suspicious?</p>
              <p className="text-xs text-slate-400">Report this URL as an incident so the IT team can investigate further.</p>
            </div>
            <a
              href={`/incidents?category=Suspicious+URL&evidence=${encodeURIComponent(result.url)}`}
              className="flex items-center gap-2 border border-orange-700/40 text-orange-400 hover:bg-orange-900/20 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Flag size={15} />
              Report URL
            </a>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
