import React from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Security, Person } from '@mui/icons-material';
import type { UserRole, UserStatus } from '../../types';
import {
  ACTION_BUTTON_SIZE,
  ACTION_BUTTON_BORDER_RADIUS,
  STATUS_CHIP_STYLES,
  ACTION_VARIANT_STYLES,
  type ActionButtonVariant,
} from './constants';

export function ColumnDot({ color }: { color: string }) {
  return (
    <Box
      component="span"
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: color,
        display: 'inline-block',
        mr: 1,
        verticalAlign: 'middle',
      }}
    />
  );
}

interface ActionIconButtonProps {
  'aria-label': string;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  variant: ActionButtonVariant;
  children: React.ReactNode;
}

export function ActionIconButton({
  'aria-label': ariaLabel,
  title,
  onClick,
  disabled,
  variant,
  children,
}: ActionIconButtonProps) {
  const styles = ACTION_VARIANT_STYLES[variant];
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          aria-label={ariaLabel}
          onClick={onClick}
          disabled={disabled}
          sx={{
            width: ACTION_BUTTON_SIZE,
            height: ACTION_BUTTON_SIZE,
            borderRadius: ACTION_BUTTON_BORDER_RADIUS,
            bgcolor: styles.bg,
            border: styles.border,
            color: styles.color,
            boxShadow: styles.boxShadow,
            '&:hover': {
              bgcolor: styles.hoverBg,
              borderColor: styles.border,
              boxShadow: `${styles.boxShadow}, 0 2px 8px rgba(0,0,0,0.08)`,
            },
            '&:disabled': {
              bgcolor: 'rgba(158, 158, 158, 0.12)',
              borderColor: 'rgba(158, 158, 158, 0.3)',
              color: 'grey.500',
            },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function StatusChip({ status }: { status: UserStatus }) {
  const style = STATUS_CHIP_STYLES[status];
  return (
    <Chip
      size="small"
      label={style.label}
      sx={{ fontWeight: 600, bgcolor: style.bgcolor, color: style.color }}
    />
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  const isAdmin = role === 'admin';
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: '50px',
        ...(isAdmin
          ? {
              bgcolor: '#f3f0ff',
              border: '1px solid rgba(118, 75, 162, 0.18)',
              boxShadow: '0 1px 3px rgba(118, 75, 162, 0.06)',
            }
          : {
              bgcolor: 'rgba(96, 125, 139, 0.08)',
              border: '1px solid rgba(96, 125, 139, 0.15)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }),
      }}
    >
      {isAdmin ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <Security sx={{ fontSize: 20, color: 'grey.700' }} />
        </Box>
      ) : (
        <Person sx={{ fontSize: 20, color: 'grey.600' }} />
      )}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          fontSize: '0.8rem',
          textTransform: 'capitalize',
          ...(isAdmin ? { color: '#5b4b8a' } : { color: 'text.secondary' }),
        }}
      >
        {role}
      </Typography>
    </Box>
  );
}
