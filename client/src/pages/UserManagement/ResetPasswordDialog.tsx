import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { ManagedUser } from '../../types';
import { GRADIENTS } from '../../constants/theme';

interface ResetPasswordDialogProps {
  open: boolean;
  user: ManagedUser | null;
  password: string;
  confirmPassword: string;
  submitting: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

export interface ResetPasswordValidation {
  valid: boolean;
  passwordError: string;
  confirmError: string;
}

export function validateResetPassword(
  password: string,
  confirmPassword: string
): ResetPasswordValidation {
  const trimmedPassword = password.trim();
  const trimmedConfirm = confirmPassword.trim();

  let passwordError = '';
  let confirmError = '';

  if (!trimmedPassword) {
    passwordError = 'New password is required';
  } else if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    passwordError = `At least ${MIN_PASSWORD_LENGTH} characters required`;
  }

  if (!trimmedConfirm) {
    confirmError = 'Confirm password is required';
  } else if (trimmedPassword && trimmedConfirm !== trimmedPassword) {
    confirmError = 'Passwords do not match';
  }

  return {
    valid: !passwordError && !confirmError,
    passwordError,
    confirmError,
  };
}

export function ResetPasswordDialog({
  open,
  user,
  password,
  confirmPassword,
  submitting,
  onPasswordChange,
  onConfirmChange,
  onClose,
  onSubmit,
}: ResetPasswordDialogProps) {
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!open) {
      setPasswordTouched(false);
      setConfirmTouched(false);
      setSubmitAttempted(false);
    }
  }, [open]);

  const validation = validateResetPassword(password, confirmPassword);
  const showPasswordError = (passwordTouched || submitAttempted) && validation.passwordError;
  const showConfirmError = (confirmTouched || submitAttempted) && validation.confirmError;

  const passwordMeetsLength = password.trim().length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch =
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    password.trim() === confirmPassword.trim();

  function getNewPasswordHelperText(): string {
    if (showPasswordError) return validation.passwordError;
    if (passwordMeetsLength) return 'Looks good';
    return `Enter at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  function getConfirmHelperText(): string {
    if (showConfirmError) return validation.confirmError;
    if (passwordsMatch) return 'Passwords match';
    if (confirmPassword.trim().length > 0) return 'Passwords do not match';
    return 'Re-enter your new password';
  }

  function handleSubmitClick() {
    if (!validation.valid) {
      setSubmitAttempted(true);
      return;
    }
    onSubmit();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent>
        {user && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set a new password for {user.email}
            </Typography>
            <TextField
              fullWidth
              label="New password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              margin="normal"
              required
              error={Boolean(showPasswordError)}
              helperText={getNewPasswordHelperText()}
              autoComplete="new-password"
              InputProps={{
                endAdornment: passwordMeetsLength && !showPasswordError ? (
                  <InputAdornment position="end">
                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                  </InputAdornment>
                ) : undefined,
              }}
            />
            <TextField
              fullWidth
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmChange(e.target.value)}
              onBlur={() => setConfirmTouched(true)}
              margin="normal"
              required
              error={Boolean(showConfirmError)}
              helperText={getConfirmHelperText()}
              autoComplete="new-password"
              InputProps={{
                endAdornment: passwordsMatch && !showConfirmError ? (
                  <InputAdornment position="end">
                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                  </InputAdornment>
                ) : undefined,
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmitClick}
          disabled={submitting}
          sx={{
            background: GRADIENTS.PRIMARY,
            '&:hover': { background: GRADIENTS.PRIMARY_HOVER },
          }}
        >
          {submitting ? 'Resetting...' : 'Reset password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
