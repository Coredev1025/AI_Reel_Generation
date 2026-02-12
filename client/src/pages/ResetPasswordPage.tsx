import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, TextField, Paper, Container, Fade, Avatar } from '@mui/material';
import { LockReset, ArrowBack } from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { showSuccess, showError } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { showError('Missing reset token'); return; }
    if (newPassword.length < 8) { showError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { showError('Passwords do not match'); return; }

    setSubmitting(true);
    try {
      await apiService.resetPassword(token, newPassword);
      showSuccess('Password reset successfully! You can now sign in.');
      navigate('/signin');
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: GRADIENTS.PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, background: GRADIENTS.PRIMARY }}>
                <LockReset sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 800, background: GRADIENTS.PRIMARY, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
                Reset Password
              </Typography>
              <Typography variant="body1" color="text.secondary">Enter your new password below.</Typography>
            </Box>

            {!token ? (
              <Typography color="error" sx={{ textAlign: 'center' }}>No reset token provided. Please use the link from your reset email.</Typography>
            ) : (
              <form onSubmit={handleSubmit}>
                <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} helperText="Minimum 8 characters" />
                <TextField fullWidth label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, background: GRADIENTS.PRIMARY }}>
                  {submitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button component={Link} to="/signin" startIcon={<ArrowBack />} sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Back to Sign In
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
