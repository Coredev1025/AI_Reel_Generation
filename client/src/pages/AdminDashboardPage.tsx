import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Paper, Fade, Avatar, Grid, Card, CardContent, Link,
  CircularProgress, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Tabs, Tab, Stack, LinearProgress, Select, MenuItem, FormControl,
  InputLabel, SelectChangeEvent
} from '@mui/material';
import {
  ArrowBack, Memory, Storage, Speed, Refresh, PauseCircle, PlayArrow,
  Error as ErrorIcon, CheckCircle, Schedule, CloudQueue, BugReport
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { ROUTES } from '../constants/routes';
import { useToast } from '../contexts/ToastContext';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [queueJobs, setQueueJobs] = useState<any[]>([]);
  const [jobStatus, setJobStatus] = useState('waiting');
  const [runwayQuota, setRunwayQuota] = useState<any>(null);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [h, qs, rq, el] = await Promise.all([
        apiService.getSystemHealth().catch(() => null),
        apiService.getQueueStats().catch(() => null),
        apiService.getRunwayQuota().catch(() => null),
        apiService.getErrorLogs({ limit: 30 }).catch(() => ({ logs: [] }))
      ]);
      setHealth(h);
      setQueueStats(qs);
      setRunwayQuota(rq);
      setErrorLogs(el?.logs || []);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadQueueJobs = useCallback(async () => {
    try {
      const result = await apiService.getQueueJobs(jobStatus);
      setQueueJobs(result?.jobs || []);
    } catch { setQueueJobs([]); }
  }, [jobStatus]);

  useEffect(() => { loadQueueJobs(); }, [loadQueueJobs]);

  const handlePauseResume = async () => {
    try {
      if (queueStats?.paused) {
        await apiService.resumeQueue();
        showSuccess('Queue resumed');
      } else {
        await apiService.pauseQueue();
        showSuccess('Queue paused');
      }
      loadData();
    } catch (err) {
      showError('Failed to toggle queue');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: GRADIENTS.PAGE_BG, py: 4 }}>
      <Container maxWidth="xl">
        <Fade in timeout={600}>
          <Box>
            <Link component="button" variant="body2" onClick={() => navigate(ROUTES.DASHBOARD)}
              sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary', fontWeight: 600, mb: 3, '&:hover': { color: 'primary.main' } }}>
              <ArrowBack sx={{ mr: 1, fontSize: 20 }} /> Dashboard
            </Link>

            <Paper elevation={0} sx={{ p: 4, mb: 4, background: GRADIENTS.PRIMARY, color: 'white', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>Admin Panel</Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>System monitoring and management</Typography>
                </Box>
                <Button variant="contained" startIcon={<Refresh />} onClick={loadData}
                  sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700, '&:hover': { bgcolor: 'grey.100' } }}>
                  Refresh
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ borderRadius: 3, mb: 3 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tab label="System Health" icon={<Memory />} iconPosition="start" />
                <Tab label="Queue" icon={<CloudQueue />} iconPosition="start" />
                <Tab label="Runway Quota" icon={<Speed />} iconPosition="start" />
                <Tab label="Error Logs" icon={<BugReport />} iconPosition="start" />
              </Tabs>
            </Paper>

            {/* System Health Tab */}
            {tab === 0 && health && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ width: 48, height: 48, mx: 'auto', mb: 1.5, bgcolor: '#43e97b' }}><CheckCircle /></Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{formatUptime(health.uptime)}</Typography>
                      <Typography variant="body2" color="text.secondary">Uptime</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ width: 48, height: 48, mx: 'auto', mb: 1.5, bgcolor: COLORS.PRIMARY }}><Memory /></Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{formatBytes(health.memory.heapUsed)}</Typography>
                      <Typography variant="body2" color="text.secondary">Heap Used / {formatBytes(health.memory.heapTotal)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ width: 48, height: 48, mx: 'auto', mb: 1.5, bgcolor: health.redis === 'connected' ? '#43e97b' : '#f5576c' }}>
                        <Storage />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 800, textTransform: 'capitalize' }}>{health.redis}</Typography>
                      <Typography variant="body2" color="text.secondary">Redis Status</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ width: 48, height: 48, mx: 'auto', mb: 1.5, bgcolor: COLORS.PRIMARY }}><Speed /></Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{health.nodeVersion}</Typography>
                      <Typography variant="body2" color="text.secondary">Node.js</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Queue Tab */}
            {tab === 1 && (
              <Box>
                {queueStats?.available ? (
                  <>
                    <Card sx={{ borderRadius: 3, mb: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>Queue Status</Typography>
                          <Stack direction="row" spacing={2}>
                            <Chip label={queueStats.paused ? 'Paused' : 'Active'} color={queueStats.paused ? 'warning' : 'success'} />
                            <Button variant="outlined" size="small" startIcon={queueStats.paused ? <PlayArrow /> : <PauseCircle />} onClick={handlePauseResume}>
                              {queueStats.paused ? 'Resume' : 'Pause'}
                            </Button>
                          </Stack>
                        </Box>
                        <Grid container spacing={2}>
                          {Object.entries(queueStats.counts || {}).map(([key, val]) => (
                            <Grid item xs={4} sm={2} key={key}>
                              <Typography variant="h4" sx={{ fontWeight: 800 }}>{String(val)}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{key}</Typography>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>Jobs</Typography>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={jobStatus} label="Status" onChange={(e: SelectChangeEvent) => setJobStatus(e.target.value)}>
                              <MenuItem value="waiting">Waiting</MenuItem>
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="completed">Completed</MenuItem>
                              <MenuItem value="failed">Failed</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Job ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Attempts</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {queueJobs.length === 0 ? (
                                <TableRow><TableCell colSpan={4} align="center">No {jobStatus} jobs</TableCell></TableRow>
                              ) : queueJobs.map(job => (
                                <TableRow key={job.id}>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{job.id}</TableCell>
                                  <TableCell>{job.data?.projectName || '-'}</TableCell>
                                  <TableCell><Chip size="small" label={job.status} /></TableCell>
                                  <TableCell>{job.attemptsMade || 0}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Typography color="text.secondary">Queue system not available (Redis not connected)</Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Runway Quota Tab */}
            {tab === 2 && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Runway API Quota</Typography>
                  {runwayQuota?.available ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Daily Usage</Typography>
                        <LinearProgress variant="determinate" value={Math.min((runwayQuota.currentDay / runwayQuota.limitPerDay) * 100, 100)}
                          sx={{ height: 12, borderRadius: 6, mb: 1 }} />
                        <Typography variant="body2">{runwayQuota.currentDay} / {runwayQuota.limitPerDay} requests</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Per-Second Rate</Typography>
                        <LinearProgress variant="determinate" value={Math.min((runwayQuota.currentSecond / runwayQuota.limitPerSecond) * 100, 100)}
                          sx={{ height: 12, borderRadius: 6, mb: 1 }} />
                        <Typography variant="body2">{runwayQuota.currentSecond} / {runwayQuota.limitPerSecond} req/sec</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {runwayQuota.dailyRemaining} requests remaining today
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">Rate limiter not initialized (Redis not connected)</Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Error Logs Tab */}
            {tab === 3 && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Recent Error Logs</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Event</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Job ID</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {errorLogs.length === 0 ? (
                          <TableRow><TableCell colSpan={4} align="center">No error logs found</TableCell></TableRow>
                        ) : errorLogs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{new Date(log.created_at).toLocaleString()}</TableCell>
                            <TableCell><Chip size="small" label={log.event_type} color="error" /></TableCell>
                            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{log.job_id || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default AdminDashboardPage;
