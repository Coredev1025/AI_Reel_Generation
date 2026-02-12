import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Paper, Container, Fade, Avatar } from '@mui/material';
import { LockReset, ArrowBack } from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { showError('Please enter your email'); return; }
    setSubmitting(true);
    try {
      await apiService.forgotPassword(email.trim());
      setSubmitted(true);
      showSuccess('If that email exists, a password reset link has been generated.');
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: GRADIENTS.PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, background: GRADIENTS.PRIMARY }}>
                <LockReset sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 800, background: GRADIENTS.PRIMARY, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
                Forgot Password
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {submitted ? 'Check the server console for your reset token.' : 'Enter your email to receive a password reset link.'}
              </Typography>
            </Box>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <TextField fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, background: GRADIENTS.PRIMARY }}>
                  {submitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', color: 'success.main', fontWeight: 600 }}>
                Reset instructions have been generated. Check the server console output.
              </Typography>
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

export default ForgotPasswordPage;
