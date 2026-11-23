import type { SeverityLevel, IncidentStatus, RiskLevel, AdvisoryStatus } from '@/types';
import { severityColor, statusColor } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md';
}

export function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${severityColor(severity)}`}>
      {severity}
    </span>
  );
}

interface StatusBadgeProps {
  /** Backend status (Reported/Investigating/Resolved/Rejected) or legacy demo status */
  status: IncidentStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  // Map legacy demo statuses to backend equivalents for colour lookup
  const normalised =
    status === 'Open' ? 'Reported' :
    status === 'Under Review' ? 'Investigating' :
    status === 'Closed' ? 'Rejected' :
    status as IncidentStatus;
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${statusColor(normalised)}`}>
      {status}
    </span>
  );
}

interface RiskBadgeProps {
  risk: RiskLevel;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  const colorMap: Record<RiskLevel, string> = {
    Low:      'text-green-400 bg-green-900/30 border-green-700/50',
    Medium:   'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    High:     'text-orange-400 bg-orange-900/30 border-orange-700/50',
    Critical: 'text-red-400 bg-red-900/30 border-red-700/50',
  };
  return (
    <span className={`inline-flex items-center rounded-full border text-sm font-semibold px-3 py-1 ${colorMap[risk] ?? 'text-slate-400 bg-slate-800/30 border-slate-700/50'}`}>
      {risk}
    </span>
  );
}

interface AdvisoryBadgeProps {
  status: AdvisoryStatus;
}

export function AdvisoryStatusBadge({ status }: AdvisoryBadgeProps) {
  const colorMap: Record<AdvisoryStatus, string> = {
    Published: 'text-green-400 bg-green-900/30 border-green-700/50',
    Draft:     'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    Archived:  'text-slate-400 bg-slate-800/50 border-slate-700/50',
  };
  return (
    <span className={`inline-flex items-center rounded-full border text-xs font-medium px-2.5 py-1 ${colorMap[status]}`}>
      {status}
    </span>
  );
}
