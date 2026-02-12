import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  Link,
  Paper,
  Avatar,
  Fade,
  Zoom,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Clear,
  People,
  AdminPanelSettings,
  Person,
  Refresh,
  FilterList,
  Block,
  Check,
  CheckCircle,
  LockReset,
  Delete,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import type { ManagedUser, UserStatus } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ROUTES } from '../constants/routes';
import { GRADIENTS } from '../constants/theme';
import {
  STATUS_FILTER_OPTIONS,
  TABLE_COLUMN_COLORS,
  type StatusFilter,
} from './UserManagement/constants';
import { normalizeStatus, formatUserDate } from './UserManagement/utils';
import {
  ColumnDot,
  ActionIconButton,
  StatusChip,
  RoleBadge,
} from './UserManagement/UserManagementComponents';
import { ResetPasswordDialog } from './UserManagement/ResetPasswordDialog';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string } } }).response;
    return res?.data?.error ?? 'An error occurred.';
  }
  return 'An error occurred.';
}

function UserManagementPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<ManagedUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { users: list } = await apiService.getUsers();
      const safeList = Array.isArray(list)
        ? list.map((u) => ({ ...u, status: u.status ?? 'allowed' }))
        : [];
      setUsers(safeList);
    } catch (err) {
      console.error('Failed to load users:', err);
      showError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      setUpdatingUserId(userId);
      await apiService.updateUserStatus(userId, newStatus);
      const label =
        newStatus === 'blocked' ? 'blocked' : newStatus === 'pending' ? 'set to pending' : 'allowed';
      showSuccess(`User ${label}`);
      loadUsers();
    } catch (err) {
      showError(getErrorMessage(err) || 'Failed to update status.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      await apiService.updateUserRole(userId, newRole);
      showSuccess(`User role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      showError(getErrorMessage(err) || 'Failed to update role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      setUpdatingUserId(userId);
      await apiService.deleteUser(userId);
      showSuccess('User deleted');
      loadUsers();
    } catch (err) {
      showError(getErrorMessage(err) || 'Failed to delete user.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const openResetPassword = (user: ManagedUser) => {
    setResetPasswordUser(user);
    setResetPasswordValue('');
    setResetPasswordConfirm('');
  };

  const closeResetPassword = () => {
    setResetPasswordUser(null);
    setResetPasswordValue('');
    setResetPasswordConfirm('');
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetPasswordUser) return;
    if (resetPasswordValue.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    if (resetPasswordValue !== resetPasswordConfirm) {
      showError('Passwords do not match');
      return;
    }
    setResetPasswordSubmitting(true);
    try {
      await apiService.resetUserPassword(resetPasswordUser.id, resetPasswordValue.trim());
      showSuccess('Password has been reset successfully');
      closeResetPassword();
    } catch (err) {
      showError(getErrorMessage(err) || 'Failed to reset password.');
    } finally {
      setResetPasswordSubmitting(false);
    }
  };

  const filteredBySearch = searchTerm.trim()
    ? users.filter(
        (u) =>
          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const filteredUsers =
    statusFilter === 'all'
      ? filteredBySearch
      : filteredBySearch.filter((u) => normalizeStatus(u.status) === statusFilter);

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  const renderStatusAction = (user: ManagedUser) => {
    const status = normalizeStatus(user.status);
    const isDisabled = updatingUserId === user.id || user.id === currentUser?.id;

    if (status === 'pending') {
      return (
        <ActionIconButton
          variant="accept"
          title="Accept user"
          aria-label="Accept user"
          disabled={isDisabled}
          onClick={() => handleStatusChange(user.id, 'allowed')}
        >
          <Check sx={{ fontSize: 20 }} />
        </ActionIconButton>
      );
    }
    if (status === 'blocked') {
      return (
        <ActionIconButton
          variant="allow"
          title="Allow user"
          aria-label="Allow user"
          disabled={isDisabled}
          onClick={() => handleStatusChange(user.id, 'allowed')}
        >
          <CheckCircle sx={{ fontSize: 20 }} />
        </ActionIconButton>
      );
    }
    return (
      <ActionIconButton
        variant="block"
        title="Block user"
        aria-label="Block user"
        disabled={isDisabled}
        onClick={() => handleStatusChange(user.id, 'blocked')}
      >
        <Block sx={{ fontSize: 20 }} />
      </ActionIconButton>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', background: GRADIENTS.PAGE_BG, py: 4 }}>
      <Container maxWidth="xl">
        <Fade in timeout={600}>
          <Box>
            <Box sx={{ mb: 4 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'text.secondary',
                  fontWeight: 600,
                  '&:hover': { color: 'primary.main' },
                }}
              >
                <ArrowBack sx={{ mr: 1, fontSize: 20 }} />
                Dashboard
              </Link>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 4,
                background: GRADIENTS.PRIMARY,
                color: 'white',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                      User Management
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                      Manage user permissions and roles
                    </Typography>
                  </Box>
                  <Zoom in timeout={800}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Refresh />}
                      onClick={loadUsers}
                      disabled={loading}
                      sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        bgcolor: 'white',
                        color: 'primary.main',
                        fontWeight: 700,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Refresh
                    </Button>
                  </Zoom>
                </Box>
                <Box sx={{ display: 'flex', gap: 4, mt: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 36, height: 36 }}>
                      <People sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{users.length}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Users</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 36, height: 36 }}>
                      <AdminPanelSettings sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{adminCount}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Admins</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 36, height: 36 }}>
                      <Person sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{userCount}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Users</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  zIndex: 1,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  zIndex: 1,
                }}
              />
            </Paper>

            <Fade in timeout={800}>
              <Card
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 2,
                      alignItems: { xs: 'stretch', md: 'center' },
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1, md: 0 } }}>
                      <FilterList sx={{ color: 'warning.main', fontSize: 22 }} />
                      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                        Filter by user status
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {STATUS_FILTER_OPTIONS.map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setStatusFilter(status)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'capitalize',
                            fontWeight: 600,
                            ...(statusFilter === status && {
                              background: GRADIENTS.PRIMARY,
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
                              '&:hover': { background: GRADIENTS.PRIMARY_HOVER },
                            }),
                            ...(statusFilter !== status && {
                              borderColor: 'grey.300',
                              color: 'text.secondary',
                              '&:hover': {
                                bgcolor: 'grey.50',
                                borderColor: 'grey.400',
                                color: 'text.primary',
                              },
                            }),
                          }}
                        >
                          {status}
                        </Button>
                      ))}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: searchTerm ? (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                                <Clear />
                              </IconButton>
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>

            <Fade in timeout={1000}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  overflow: 'hidden',
                }}
              >
                {loading && (
                  <LinearProgress sx={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
                )}
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          <ColumnDot color={TABLE_COLUMN_COLORS.USER_INFO} />
                          User info
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          <ColumnDot color={TABLE_COLUMN_COLORS.ROLES} />
                          Roles
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          <ColumnDot color={TABLE_COLUMN_COLORS.STATUS} />
                          Status
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          <ColumnDot color={TABLE_COLUMN_COLORS.JOINED} />
                          Joined
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          <ColumnDot color={TABLE_COLUMN_COLORS.ACTIONS} />
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                            <Typography color="text.secondary">
                              {loading
                                ? 'Loading users...'
                                : searchTerm || statusFilter !== 'all'
                                  ? 'No users match your filters.'
                                  : 'No users yet.'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => {
                          const { date, time } = formatUserDate(user.created_at);
                          return (
                            <TableRow
                              key={user.id}
                              sx={{ '&:hover': { bgcolor: 'grey.50' }, transition: 'background 0.2s' }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar
                                    sx={{
                                      width: 44,
                                      height: 44,
                                      fontSize: '1rem',
                                      fontWeight: 700,
                                      background: GRADIENTS.PRIMARY,
                                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                    }}
                                  >
                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body1" fontWeight={700} color="text.primary">
                                      {user.name || '—'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                      {user.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                  disabled={updatingUserId === user.id || user.id === currentUser?.id}
                                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontWeight: 600, fontSize: '0.85rem' }}
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                              </TableCell>
                              <TableCell>
                                <StatusChip status={normalizeStatus(user.status)} />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600} color="text.primary">
                                  {date}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {time}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                  }}
                                >
                                  {renderStatusAction(user)}
                                  <ActionIconButton
                                    variant="reset"
                                    title="Reset password"
                                    aria-label="Reset password"
                                    disabled={updatingUserId === user.id}
                                    onClick={() => openResetPassword(user)}
                                  >
                                    <LockReset sx={{ fontSize: 20 }} />
                                  </ActionIconButton>
                                  <ActionIconButton
                                    variant="block"
                                    title="Delete user"
                                    aria-label="Delete user"
                                    disabled={updatingUserId === user.id || user.id === currentUser?.id}
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    <Delete sx={{ fontSize: 20 }} />
                                  </ActionIconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Fade>

            <ResetPasswordDialog
              open={!!resetPasswordUser}
              user={resetPasswordUser}
              password={resetPasswordValue}
              confirmPassword={resetPasswordConfirm}
              submitting={resetPasswordSubmitting}
              onPasswordChange={setResetPasswordValue}
              onConfirmChange={setResetPasswordConfirm}
              onClose={closeResetPassword}
              onSubmit={handleResetPasswordSubmit}
            />
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default UserManagementPage;
