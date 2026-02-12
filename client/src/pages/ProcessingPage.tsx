import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
  Container,
  Stack,
  Grid,
  Breadcrumbs,
  Link,
  IconButton,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Download,
  Home,
  Refresh,
  ArrowBack,
  PlayArrow,
  AutoAwesome,
  VideoLibrary,
  MusicNote,
  PhotoLibrary,
  Delete,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import LoadingProgress from '../components/LoadingProgress';
import { useToast } from '../contexts/ToastContext';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

interface ProcessingStatus {
  stage: string;
  progress: number;
  currentStep: string;
  error?: string;
  timestamp: string;
  started_at?: string;
  video_id?: string;
}

const ProcessingPage: React.FC = () => {
  const { projectId, processingId } = useParams<{
    projectId: string;
    processingId: string;
  }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

  const steps = [
    {
      label: 'Preparing workspace',
      icon: <AutoAwesome />,
      description: 'Setting up the processing environment',
    },
    {
      label: 'Animating photos',
      icon: <PhotoLibrary />,
      description: 'Creating smooth animations from your photos',
    },
    {
      label: 'Stitching videos',
      icon: <VideoLibrary />,
      description: 'Combining animations into a seamless video',
    },
    {
      label: 'Adding music',
      icon: <MusicNote />,
      description: 'Syncing background music with the video',
    },
    {
      label: 'Finalizing',
      icon: <AutoAwesome />,
      description: 'Adding text overlays and finishing touches',
    },
    {
      label: 'Completed',
      icon: <CheckCircle />,
      description: 'Your video is ready!',
    },
  ];

  const getActiveStep = (stage: string) => {
    const stageMap: { [key: string]: number } = {
      preparing: 0,
      animating: 1,
      stitching: 2,
      rescaling: 2,
      'adding-music': 3,
      'adding-text': 4,
      completed: 5,
    };
    return stageMap[stage] ?? 0;
  };

  const safeFormatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
  };

  useEffect(() => {
    if (!processingId) {
      navigate('/dashboard');
      return;
    }

    socketService.joinProject(processingId);

    socketService.onProgressUpdate((update: ProcessingStatus) => {
      setStatus(update);
      if (update.error) {
        setError(update.error);
      }
    });

    const fetchStatus = async () => {
      try {
        const statusData = await apiService.getProcessingStatus(processingId);
        setStatus(statusData);
      } catch (err) {
        console.error('Failed to fetch status:', err);
        setError('Failed to load processing status');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);

    return () => {
      clearInterval(interval);
      socketService.disconnect();
    };
  }, [processingId, navigate]);

  const downloadVideo = async () => {
    if (!processingId) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await apiService.downloadVideo(status?.video_id || '');
      showSuccess('Video downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      showError('Failed to download video. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const cleanupFailedProcessing = async () => {
    if (!processingId) return;
    setCleaningUp(true);
    try {
      await apiService.cleanupFailedProcessing(processingId);
      showSuccess('Failed processing cleaned up!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Cleanup error:', err);
      showError('Failed to clean up. Please try again.');
    } finally {
      setCleaningUp(false);
    }
  };

  const restartProcessing = async () => {
    if (!processingId) return;
    setRestarting(true);
    try {
      const result = await apiService.restartProcessing(processingId);
      showSuccess('Video processing restarted!');
      navigate(`/processing/${projectId}/${result.processingId}`);
    } catch (err) {
      console.error('Restart error:', err);
      showError('Failed to restart. Please try again.');
    } finally {
      setRestarting(false);
    }
  };

  useEffect(() => {
    if (status) {
      if (status.stage === 'completed') {
        showSuccess('Video processing completed!');
      } else if (status.stage === 'error' || status.error) {
        showError(status.error || 'Video processing failed');
      }
    }
  }, [status?.stage, status?.error]);

  if (!status) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <LoadingProgress />
        </Box>
      </Container>
    );
  }

  const activeStep = getActiveStep(status.stage);
  const isCompleted = status.stage === 'completed';
  const hasError = status.stage === 'error' || !!error;

  return (
    <Box sx={{ minHeight: '100vh', background: GRADIENTS.PAGE_BG, py: 4 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { color: COLORS.PRIMARY },
            }}
          >
            <ArrowBack sx={{ mr: 0.5, fontSize: 18 }} />
            Dashboard
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            Video Processing
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: COLORS.DARK }}>
              Video Processing
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Creating your property video with AI
            </Typography>
          </Box>
          {isCompleted && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={downloadVideo}
                disabled={downloading}
                sx={{
                  borderRadius: RADIUS.SM,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: COLORS.PRIMARY,
                  color: COLORS.PRIMARY,
                }}
              >
                {downloading ? 'Downloading...' : 'Download'}
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => navigate(`/video/${status.video_id}/stream`)}
                sx={{
                  borderRadius: RADIUS.SM,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: GRADIENTS.PRIMARY,
                  boxShadow: SHADOWS.BUTTON,
                  '&:hover': {
                    background: GRADIENTS.PRIMARY_HOVER,
                    boxShadow: SHADOWS.BUTTON_HOVER,
                  },
                }}
              >
                Play Video
              </Button>
            </Stack>
          )}
        </Box>

        {downloadError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: RADIUS.SM }}>
            {downloadError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Progress Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: RADIUS.LG,
                border: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Box sx={{ mr: 2 }}>
                    {hasError ? (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: RADIUS.SM,
                          bgcolor: `${COLORS.ERROR}12`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Error sx={{ color: COLORS.ERROR }} />
                      </Box>
                    ) : isCompleted ? (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: RADIUS.SM,
                          bgcolor: `${COLORS.SUCCESS}12`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle sx={{ color: COLORS.SUCCESS }} />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: RADIUS.SM,
                          bgcolor: `${COLORS.PRIMARY}12`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CircularProgress size={22} sx={{ color: COLORS.PRIMARY }} />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {hasError
                        ? 'Processing Failed'
                        : isCompleted
                        ? 'Processing Complete!'
                        : 'Processing in Progress...'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {status.currentStep}
                    </Typography>
                  </Box>
                  <Chip
                    label={status.stage.replace('-', ' ').toUpperCase()}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      bgcolor: hasError
                        ? `${COLORS.ERROR}15`
                        : isCompleted
                        ? `${COLORS.SUCCESS}15`
                        : `${COLORS.PRIMARY}15`,
                      color: hasError
                        ? COLORS.ERROR
                        : isCompleted
                        ? COLORS.SUCCESS
                        : COLORS.PRIMARY,
                    }}
                  />
                </Box>

                {!hasError && (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Overall Progress
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: COLORS.PRIMARY }}
                      >
                        {Math.round(status.progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={status.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: `${COLORS.PRIMARY}12`,
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: GRADIENTS.PRIMARY,
                        },
                      }}
                    />
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary">
                  Last updated: {safeFormatDate(status.timestamp)}
                </Typography>
              </CardContent>
            </Card>

            {/* Steps Card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: RADIUS.LG,
                border: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 3 }}
                >
                  Processing Steps
                </Typography>

                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: RADIUS.SM,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor:
                                index < activeStep
                                  ? `${COLORS.SUCCESS}15`
                                  : index === activeStep
                                  ? `${COLORS.PRIMARY}15`
                                  : 'rgba(0,0,0,0.04)',
                              color:
                                index < activeStep
                                  ? COLORS.SUCCESS
                                  : index === activeStep
                                  ? COLORS.PRIMARY
                                  : 'rgba(0,0,0,0.3)',
                              mr: 1,
                            }}
                          >
                            {index < activeStep ? (
                              <CheckCircle sx={{ fontSize: 20 }} />
                            ) : (
                              React.cloneElement(step.icon, {
                                sx: { fontSize: 20 },
                              })
                            )}
                          </Box>
                        )}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: index <= activeStep ? 700 : 500,
                            color:
                              index <= activeStep ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {step.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Project Info */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: RADIUS.LG,
                  border: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Project Info
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}
                      >
                        Project ID
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          bgcolor: 'rgba(0,0,0,0.03)',
                          p: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        {projectId?.substring(0, 12)}...
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}
                      >
                        Started
                      </Typography>
                      <Typography variant="body2">
                        {safeFormatDate(status.started_at)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}
                      >
                        Current Status
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {status.stage.replace('-', ' ').charAt(0).toUpperCase() +
                          status.stage.replace('-', ' ').slice(1)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Completed Actions */}
              {isCompleted && (
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: RADIUS.LG,
                    border: `1px solid ${COLORS.SUCCESS}30`,
                    bgcolor: `${COLORS.SUCCESS}05`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Your Video is Ready!
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      Your video has been created and is ready to view and download.
                    </Typography>
                    <Stack spacing={1.5}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => navigate(`/video/${status.video_id}/stream`)}
                        sx={{
                          borderRadius: RADIUS.SM,
                          textTransform: 'none',
                          fontWeight: 600,
                          background: GRADIENTS.PRIMARY,
                          boxShadow: SHADOWS.BUTTON,
                          '&:hover': {
                            background: GRADIENTS.PRIMARY_HOVER,
                          },
                        }}
                      >
                        Play Video
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={downloadVideo}
                        disabled={downloading}
                        sx={{
                          borderRadius: RADIUS.SM,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: COLORS.PRIMARY,
                          color: COLORS.PRIMARY,
                        }}
                      >
                        {downloading ? 'Downloading...' : 'Download Video'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Error Actions */}
              {hasError && (
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: RADIUS.LG,
                    border: `1px solid ${COLORS.ERROR}30`,
                    bgcolor: `${COLORS.ERROR}05`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Something went wrong
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      You can clean up the failed processing and try again.
                    </Typography>
                    <Stack spacing={1.5}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                        onClick={cleanupFailedProcessing}
                        disabled={cleaningUp}
                        sx={{
                          borderRadius: RADIUS.SM,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {cleaningUp ? 'Cleaning Up...' : 'Clean Up'}
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={restartProcessing}
                        disabled={restarting}
                        sx={{
                          borderRadius: RADIUS.SM,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: COLORS.PRIMARY,
                          color: COLORS.PRIMARY,
                        }}
                      >
                        {restarting ? 'Restarting...' : 'Retry Processing'}
                      </Button>
                      <Button
                        fullWidth
                        variant="text"
                        startIcon={<Home />}
                        onClick={() => navigate('/dashboard')}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        Back to Dashboard
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* In-progress state */}
              {!isCompleted && !hasError && (
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: RADIUS.LG,
                    border: `1px solid ${COLORS.PRIMARY}20`,
                    bgcolor: `${COLORS.PRIMARY}05`,
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Processing...
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      This usually takes a few minutes depending on the number of photos.
                    </Typography>
                    <CircularProgress size={36} sx={{ color: COLORS.PRIMARY }} />
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProcessingPage;
