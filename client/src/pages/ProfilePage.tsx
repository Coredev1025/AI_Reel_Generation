import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Card, CardContent, Container, Paper,
  Fade, Avatar, Stack, Divider, Link
} from '@mui/material';
import { ArrowBack, Save, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ROUTES } from '../constants/routes';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      showSuccess('Profile updated');
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { showError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { showError('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: GRADIENTS.PAGE_BG, py: 4 }}>
      <Container maxWidth="md">
        <Fade in timeout={600}>
          <Box>
            <Link component="button" variant="body2" onClick={() => navigate(ROUTES.DASHBOARD)}
              sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary', fontWeight: 600, mb: 3, '&:hover': { color: 'primary.main' } }}>
              <ArrowBack sx={{ mr: 1, fontSize: 20 }} /> Dashboard
            </Link>

            <Paper elevation={0} sx={{ p: 4, mb: 4, background: GRADIENTS.PRIMARY, color: 'white', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ width: 64, height: 64, fontSize: '1.5rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)' }}>
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>{user?.name || 'User'}</Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>{user?.email}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7, textTransform: 'capitalize' }}>Role: {user?.role}</Typography>
                </Box>
              </Box>
            </Paper>

            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Edit Profile</Typography>
                <Stack spacing={3}>
                  <TextField fullWidth label="Name" value={name} onChange={e => setName(e.target.value)} />
                  <TextField fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveProfile} disabled={saving}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2, px: 4 }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Change Password</Typography>
                <Stack spacing={3}>
                  <TextField fullWidth label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} helperText="Minimum 8 characters" />
                  <TextField fullWidth label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  <Button variant="contained" color="warning" startIcon={<Lock />} onClick={handleChangePassword} disabled={changingPassword}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2, px: 4 }}>
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ProfilePage;
