import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Container, Paper, Fade, Avatar, CircularProgress, Button } from '@mui/material';
import { PlayArrow, Download, Error as ErrorIcon, Share } from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

const SharedVideoPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<any>(null);

  useEffect(() => {
    const fetchSharedVideo = async () => {
      if (!token) { setError('No share token provided'); setLoading(false); return; }
      try {
        const data = await apiService.getSharedVideo(token);
        setVideoData(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'This share link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedVideo();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error || !videoData) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 500, textAlign: 'center', background: 'rgba(255,255,255,0.95)' }}>
          <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'error.main' }}>
            <ErrorIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Link Unavailable</Typography>
          <Typography color="text.secondary">{error || 'This video is no longer available.'}</Typography>
        </Paper>
      </Box>
    );
  }

  const { video, expiresAt } = videoData;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Fade in timeout={600}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4, color: 'white' }}>
              <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 2, background: GRADIENTS.PRIMARY }}>
                <Share sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>Shared Video</Typography>
              {expiresAt && (
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                  Expires: {new Date(expiresAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 16px 64px rgba(0,0,0,0.5)' }}>
              {video.streamUrl ? (
                <video
                  src={video.streamUrl}
                  controls
                  autoPlay
                  style={{ width: '100%', display: 'block', maxHeight: '70vh', background: 'black' }}
                />
              ) : (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                  <Typography>Video not available</Typography>
                </Box>
              )}

              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{video.filename}</Typography>
                  {video.duration && (
                    <Typography variant="body2" color="text.secondary">
                      Duration: {Math.round(video.duration)}s
                    </Typography>
                  )}
                </Box>
                {video.streamUrl && (
                  <Button variant="contained" startIcon={<Download />} href={video.streamUrl} target="_blank"
                    sx={{ borderRadius: 2, fontWeight: 600 }}>
                    Download
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default SharedVideoPage;
