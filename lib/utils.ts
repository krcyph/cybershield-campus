import type { SeverityLevel, IncidentStatus } from '@/types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function severityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'Critical':
      return 'text-red-400 bg-red-900/30 border-red-700/50';
    case 'High':
      return 'text-orange-400 bg-orange-900/30 border-orange-700/50';
    case 'Medium':
      return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
    case 'Low':
      return 'text-green-400 bg-green-900/30 border-green-700/50';
  }
}

export function statusColor(status: IncidentStatus): string {
  switch (status) {
    case 'Reported':
      return 'text-blue-400 bg-blue-900/30 border-blue-700/50';
    case 'Investigating':
      return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
    case 'Resolved':
      return 'text-green-400 bg-green-900/30 border-green-700/50';
    case 'Rejected':
      return 'text-slate-400 bg-slate-800/50 border-slate-700/50';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str;
}
