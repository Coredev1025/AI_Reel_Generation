import type { UserStatus } from '../../types';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../constants/theme';

export type StatusFilter = 'all' | UserStatus;

export const ACTION_BUTTON_SIZE = 40;
export const ACTION_BUTTON_BORDER_RADIUS = 2;

export const STATUS_FILTER_OPTIONS: StatusFilter[] = ['all', 'allowed', 'pending', 'blocked'];

export const STATUS_CHIP_STYLES: Record<UserStatus, { bgcolor: string; color: string; label: string }> = {
  allowed: { bgcolor: 'rgba(76, 175, 80, 0.15)', color: 'success.dark', label: 'Allowed' },
  pending: { bgcolor: 'rgba(255, 152, 0, 0.15)', color: 'warning.dark', label: 'Pending' },
  blocked: { bgcolor: 'rgba(244, 67, 54, 0.15)', color: 'error.dark', label: 'Blocked' },
};

export const VALID_STATUSES: UserStatus[] = ['allowed', 'pending', 'blocked'];

export const ACTION_VARIANT_STYLES = {
  accept: {
    bg: 'rgba(46, 125, 50, 0.15)',
    border: '1px solid rgba(76, 175, 80, 0.5)',
    color: '#2e7d32',
    hoverBg: 'rgba(46, 125, 50, 0.25)',
    boxShadow: '0 0 0 1px rgba(76, 175, 80, 0.2)',
  },
  allow: {
    bg: 'rgba(46, 125, 50, 0.15)',
    border: '1px solid rgba(76, 175, 80, 0.5)',
    color: '#2e7d32',
    hoverBg: 'rgba(46, 125, 50, 0.25)',
    boxShadow: '0 0 0 1px rgba(76, 175, 80, 0.2)',
  },
  block: {
    bg: 'rgba(183, 28, 28, 0.15)',
    border: '1px solid rgba(229, 57, 53, 0.5)',
    color: '#c62828',
    hoverBg: 'rgba(183, 28, 28, 0.25)',
    boxShadow: '0 0 0 1px rgba(229, 57, 53, 0.2)',
  },
  profile: {
    bg: 'rgba(25, 118, 210, 0.15)',
    border: '1px solid rgba(33, 150, 243, 0.5)',
    color: '#1565c0',
    hoverBg: 'rgba(25, 118, 210, 0.25)',
    boxShadow: '0 0 0 1px rgba(33, 150, 243, 0.2)',
  },
  view: {
    bg: 'rgba(97, 97, 97, 0.12)',
    border: '1px solid rgba(117, 117, 117, 0.4)',
    color: '#616161',
    hoverBg: 'rgba(97, 97, 97, 0.2)',
    boxShadow: '0 0 0 1px rgba(117, 117, 117, 0.15)',
  },
  reset: {
    bg: 'rgba(103, 58, 183, 0.12)',
    border: '1px solid rgba(103, 58, 183, 0.5)',
    color: '#5e35b1',
    hoverBg: 'rgba(103, 58, 183, 0.2)',
    boxShadow: '0 0 0 1px rgba(103, 58, 183, 0.2)',
  },
} as const;

export type ActionButtonVariant = keyof typeof ACTION_VARIANT_STYLES;

export const TABLE_COLUMN_COLORS = {
  USER_INFO: COLORS.PRIMARY,
  ROLES: '#e91e63',
  STATUS: '#4caf50',
  JOINED: '#9c27b0',
  ACTIONS: '#2196f3',
} as const;
