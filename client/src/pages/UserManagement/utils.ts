import type { UserStatus } from '../../types';
import { VALID_STATUSES } from './constants';

export function normalizeStatus(value: unknown): UserStatus {
  if (value == null || value === '') return 'allowed';
  const s = String(value).trim().toLowerCase();
  return VALID_STATUSES.includes(s as UserStatus) ? (s as UserStatus) : 'allowed';
}

export function formatUserDate(dateString: string): { date: string; time: string } {
  const d = new Date(dateString);
  return {
    date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}
