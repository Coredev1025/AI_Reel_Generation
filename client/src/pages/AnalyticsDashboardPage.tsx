import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Paper, Fade, Avatar, Grid, Card, CardContent, Link,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack, VideoLibrary, Folder, Image as ImageIcon, People, CheckCircle,
  Error as ErrorIcon, Timer, Storage
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiService } from '../services/apiService';
import { ROUTES } from '../constants/routes';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';
import type { AnalyticsOverview, StorageUsage } from '../types';

const CHART_COLORS = [COLORS.PRIMARY, '#A29BFE', '#f093fb', '#f5576c', '#00D2FF'];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const AnalyticsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [runway, setRunway] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, st, rw] = await Promise.all([
          apiService.getAnalyticsOverview(),
          apiService.getAnalyticsStorage(),
          apiService.getAnalyticsRunway().catch(() => null)
        ]);
        setOverview(ov);
        setStorage(st);
        setRunway(rw);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = overview ? [
    { label: 'Total Videos', value: overview.totalVideos, icon: <VideoLibrary />, color: COLORS.PRIMARY },
    { label: 'Total Projects', value: overview.totalProjects, icon: <Folder />, color: COLORS.PRIMARY_DARK },
    { label: 'Total Images', value: overview.totalImages, icon: <ImageIcon />, color: '#f093fb' },
    { label: 'Total Users', value: overview.totalUsers, icon: <People />, color: '#4facfe' },
    { label: 'Success Rate', value: `${overview.successRate}%`, icon: <CheckCircle />, color: '#43e97b' },
    { label: 'Avg Process Time', value: `${overview.avgProcessingTime}s`, icon: <Timer />, color: '#f5576c' },
  ] : [];

  const pieData = overview ? [
    { name: 'Completed', value: overview.completedJobs },
    { name: 'Failed', value: overview.failedJobs },
  ].filter(d => d.value > 0) : [];

  const storageData = storage ? [
    { name: 'Images', bytes: storage.images.totalBytes, count: storage.images.count },
    { name: 'Music', bytes: storage.music.totalBytes, count: storage.music.count },
    { name: 'Videos', bytes: storage.videos.totalBytes, count: storage.videos.count },
  ] : [];

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
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>Analytics Dashboard</Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>Insights and statistics for your workspace</Typography>
            </Paper>

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {statCards.map((card, i) => (
                <Grid item xs={6} sm={4} md={2} key={i}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Avatar sx={{ width: 48, height: 48, mx: 'auto', mb: 1.5, bgcolor: card.color }}>
                        {card.icon}
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>{card.value}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{card.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              {/* Success/Failure Pie Chart */}
              {pieData.length > 0 && (
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Job Success Rate</Typography>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                            {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#43e97b' : '#f5576c'} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Storage Usage Bar Chart */}
              <Grid item xs={12} md={pieData.length > 0 ? 8 : 12}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Storage Usage</Typography>
                    {storage && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Total: {formatBytes(storage.totalBytes)}
                      </Typography>
                    )}
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={storageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(v) => formatBytes(v)} />
                        <Tooltip formatter={(v: number | undefined) => formatBytes(v ?? 0)} />
                        <Bar dataKey="bytes" fill={COLORS.PRIMARY} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Runway API Usage */}
              {runway && runway.available && (
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Runway API Usage</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress variant="determinate" value={Math.min((runway.currentDay / runway.limitPerDay) * 100, 100)} size={80} thickness={6} />
                          <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{Math.round((runway.currentDay / runway.limitPerDay) * 100)}%</Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{runway.currentDay} / {runway.limitPerDay}</Typography>
                          <Typography variant="caption" color="text.secondary">Daily requests used</Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {runway.dailyRemaining} requests remaining today
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default AnalyticsDashboardPage;
