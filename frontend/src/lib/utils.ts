import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export const STATUS_CONFIG = {
  BACKLOG: { label: 'Backlog', color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  TODO: { label: 'To Do', color: '#94a3b8', bg: 'bg-slate-100 dark:bg-slate-800' },
  RE_OPEN: { label: 'Re-Open', color: '#64748b', bg: 'bg-slate-100 dark:bg-slate-800' },
  IN_PROGRESS: { label: 'In progress', color: '#eab308', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  IN_REVIEW: { label: 'In review', color: '#8b5cf6', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  DONE: { label: 'Done', color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: '#94a3b8', icon: '↓' },
  MEDIUM: { label: 'Medium', color: '#f59e0b', icon: '→' },
  HIGH: { label: 'High', color: '#ef4444', icon: '↑' },
};

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6',
];
