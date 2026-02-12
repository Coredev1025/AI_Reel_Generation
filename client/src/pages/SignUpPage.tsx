import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Container,
  Fade,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowForward,
  Login,
  SmartDisplay,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showError('Please enter your email');
      return;
    }
    if (!password) {
      showError('Please enter a password');
      return;
    }
    if (password.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const result = await signup({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      if (result?.message && !result?.token) {
        showSuccess(result.message);
        navigate('/signin', { replace: true });
      } else if (result?.token) {
        showSuccess('Account created! Welcome to ReelBuilder.');
        navigate('/dashboard', { replace: true });
      } else {
        showSuccess('Account created. Please sign in.');
        navigate('/signin', { replace: true });
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Sign up failed. Please try again.';
      showError(message || 'Sign up failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: RADIUS.MD,
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: COLORS.PRIMARY,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: COLORS.PRIMARY,
      },
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: GRADIENTS.HERO,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '20%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108, 92, 231, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '15%',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 210, 255, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Fade in timeout={500}>
          <Box>
            {/* Logo */}
            <Box
              sx={{
                textAlign: 'center',
                mb: 4,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              <SmartDisplay sx={{ color: COLORS.PRIMARY_LIGHT, fontSize: 40, mb: 1 }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}
              >
                Reel<Box component="span" sx={{ color: COLORS.PRIMARY_LIGHT }}>Builder</Box>
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: RADIUS.XL,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.97)',
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    mb: 1,
                    color: COLORS.DARK,
                  }}
                >
                  Create your account
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Join ReelBuilder and start creating stunning property videos
                </Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    variant="outlined"
                    sx={inputSx}
                  />
                  <TextField
                    fullWidth
                    label="Name (optional)"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    variant="outlined"
                    sx={inputSx}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    variant="outlined"
                    helperText="At least 8 characters"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={inputSx}
                  />
                  <TextField
                    fullWidth
                    label="Confirm password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    variant="outlined"
                    error={!!confirmPassword && password !== confirmPassword}
                    helperText={
                      confirmPassword && password !== confirmPassword
                        ? 'Passwords do not match'
                        : ''
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={inputSx}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={
                      submitting || (!!confirmPassword && password !== confirmPassword)
                    }
                    endIcon={
                      submitting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <ArrowForward />
                      )
                    }
                    sx={{
                      py: 1.5,
                      borderRadius: RADIUS.MD,
                      fontSize: '1rem',
                      fontWeight: 700,
                      background: GRADIENTS.PRIMARY,
                      boxShadow: SHADOWS.BUTTON,
                      textTransform: 'none',
                      '&:hover': {
                        background: GRADIENTS.PRIMARY_HOVER,
                        boxShadow: SHADOWS.BUTTON_HOVER,
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {submitting ? 'Creating account...' : 'Create account'}
                  </Button>
                </Box>
              </form>

              <Box
                sx={{
                  mt: 3,
                  pt: 3,
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Already have an account?
                </Typography>
                <Button
                  component={Link}
                  to="/signin"
                  startIcon={<Login />}
                  sx={{
                    fontWeight: 600,
                    color: COLORS.PRIMARY,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: `${COLORS.PRIMARY}08`,
                    },
                  }}
                >
                  Sign in
                </Button>
              </Box>
            </Paper>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default SignUpPage;
