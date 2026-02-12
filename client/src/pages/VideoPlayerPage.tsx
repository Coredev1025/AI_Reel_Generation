import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Paper,
  Stack,
  Slider,
  Container,
  Breadcrumbs,
  Link,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Download,
  Share,
  ArrowBack,
  MoreVert,
  Edit,
  Delete,
  Replay,
  Refresh,
  BookmarkBorder,
  Save
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import LoadingProgress from '../components/LoadingProgress';
import { useToast } from '../contexts/ToastContext';
import SavePromptDialog from '../components/SavePromptDialog';

interface VideoData {
  id: string;
  name: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  projectId: string;
  projectName: string;
  status: 'processing' | 'completed' | 'error';
  settings: {
    motionStrength: number;
    videoDuration: number;
    musicVolume: number;
    imagePrompts?: { [imageId: string]: string };
  };
  images?: Array<{
    id: string;
    filename: string;
    original_name: string;
    prompt?: string;
    preview_url?: string;
  }>;
}

const VideoPlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [projectImages, setProjectImages] = useState<any[]>([]);
  const [savePromptDialog, setSavePromptDialog] = useState<{
    open: boolean;
    imageId: string;
    imageName: string;
    promptText: string;
  }>({
    open: false,
    imageId: '',
    imageName: '',
    promptText: ''
  });

  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) {
        setError('Video ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // FIX: Use the API to fetch video data
        const response = await apiService.getVideo(videoId);
        console.log('Video data received:', response);
        setVideoData(response); // or response.video if your API wraps it
        // If video doesn't have images, try to fetch project images as fallback
        if (!response.images || response.images.length === 0) {
          try {
            const projectData = await apiService.getProject(response.projectName);
            console.log('Project data received:', projectData);
            if (projectData.images && projectData.images.length > 0) {
              // Transform project images to match the expected format
              const transformedImages = projectData.images.map((image: any) => ({
                id: image.id,
                filename: image.filename,
                original_name: image.original_name,
                preview_url: `/api/images/${image.id}/preview`,
                prompt: response.settings?.imagePrompts?.[image.id] || null
              }));
              console.log('Transformed project images:', transformedImages);
              setProjectImages(transformedImages);
            }
          } catch (projectErr) {
            console.error('Failed to fetch project images:', projectErr);
          }
        }
      } catch (err) {
        console.error('Failed to fetch video:', err);
        setError('Video not found');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  useEffect(() => {
    if (videoId) {
      setShareUrl(`${window.location.origin}/video/${videoId}/stream`);
    }
  }, [videoId]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current.currentTime > 10) {
            handleSeek(videoRef.current.currentTime - 10);
          } else {
            handleSeek(0);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current.currentTime < videoRef.current.duration - 10) {
            handleSeek(videoRef.current.currentTime + 10);
          } else {
            handleSeek(videoRef.current.duration);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          handleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, isPlaying]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (value: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value: number) => {
    if (!videoRef.current) return;
    setVolume(value);
    videoRef.current.volume = value;
    setIsMuted(value === 0);
  };

  const handleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).mozRequestFullScreen) {
        (videoRef.current as any).mozRequestFullScreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  const handleDownload = async () => {
    if (!videoData?.id) {
      showError('Video ID not found');
      return;
    }

    setDownloading(true);
    try {
      await apiService.downloadVideo(videoData.id);
      showSuccess('Video downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      showError('Failed to download video. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    showSuccess('Link copied to clipboard!');
  };

  const handleDelete = async () => {
    if (!videoData?.id) {
      showError('Video ID not found');
      return;
    }

    try {
      await apiService.deleteVideo(videoData.id);
      showSuccess('Video deleted successfully!');
      // Navigate back to the project page
      navigate(`/project/${videoData.projectName}`);
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete video. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleRetry = async () => {
    if (!videoData?.id) {
      showError('Video ID not found');
      return;
    }

    try {
      // Find the processing job for this video
      const projectData = await apiService.getProject(videoData.projectName);
      const processingJob = projectData.processingJobs?.find((job: any) => job.video_id === videoData.id);

      if (processingJob) {
        // Restart the processing job
        const result = await apiService.restartProcessing(processingJob.id);
        showSuccess('Video processing restarted successfully!');
        // Navigate to the processing page
        navigate(`/processing/${videoData.projectName}/${result.processingId}`);
      } else {
        showError('No processing job found for this video. Cannot retry.');
      }
    } catch (error: any) {
      console.error('Retry error:', error);
      if (error.response?.status === 404) {
        showError('Processing job not found. Cannot retry.');
      } else if (error.response?.status === 400) {
        showError('Cannot retry this video. Only failed videos can be retried.');
      } else {
        showError('Failed to retry video processing. Please try again.');
      }
    }
  };

  const handleOpenSavePromptDialog = (imageId: string, imageName: string, promptText: string) => {
    if (!promptText.trim()) {
      showError('Please enter a prompt text to save');
      return;
    }

    setSavePromptDialog({
      open: true,
      imageId,
      imageName,
      promptText
    });
  };

  const handleCloseSavePromptDialog = () => {
    setSavePromptDialog({
      open: false,
      imageId: '',
      imageName: '',
      promptText: ''
    });
  };

  const handleSavePrompt = async (name: string, description: string) => {
    const promptData = {
      name: name,
      description: description
    };

    await apiService.createSavedPrompt(promptData);
    showSuccess('Prompt saved successfully!');
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <LoadingProgress />
        </Box>
      </Container>
    );
  }

  if (error || !videoData) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={400}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || 'Video not found'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3, '& .MuiBreadcrumbs-ol': { alignItems: 'center' } }}>
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <ArrowBack sx={{ mr: 1 }} />
            Dashboard
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href={`/project/${videoData.projectName}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/project/${videoData.projectName}`);
            }}
            sx={{
              color: '#666',
              '&:hover': { color: '#1976d2' },
              fontWeight: 500
            }}
          >
            {videoData.projectName}
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            {videoData.name.replace(/_\d+\.mp4$/, '')}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton
                onClick={() => navigate(`/project/${videoData.projectName}`)}
                sx={{
                  mr: 2,
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.2)'
                  }
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                {videoData.name.replace(/_\d+\.mp4$/, '')}
              </Typography>
            </Box>
            {videoData.description && (
              <Typography variant="body1" color="text.secondary" sx={{ ml: 7, fontSize: '1.1rem', lineHeight: 1.6 }}>
                {videoData.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2} sx={{ ml: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownload}
              disabled={downloading}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1.5
              }}
            >
              {downloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={handleShare}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1.5
              }}
            >
              Share
            </Button>
            <IconButton
              onClick={handleMenuClick}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <MoreVert />
            </IconButton>
          </Stack>
        </Box>

        <Grid container spacing={4}>
          {/* Video Player */}
          <Grid item xs={12} lg={8}>
            <Paper
              sx={{
                position: 'relative',
                bgcolor: 'black',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => !isFullscreen && setShowControls(false)}
              onClick={(e) => {
                // Only toggle controls if clicking on the container, not on controls
                if (e.target === e.currentTarget) {
                  if (isFullscreen) {
                    setShowControls(!showControls);
                  }
                }
              }}
            >
              <video
                ref={videoRef}
                src={videoData.videoUrl}
                poster={videoData.thumbnailUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  cursor: 'pointer'
                }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    e.stopPropagation();
                    e.preventDefault();
                    handlePlayPause();
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                    handlePlayPause();
                  }
                }}
                tabIndex={0}
                controls={false}
                preload="metadata"
              />

              {/* Play Button Overlay */}
              {!isPlaying && !showControls && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2
                  }}
                >
                  <IconButton
                    onClick={handlePlayPause}
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(0,0,0,0.6)',
                      width: 80,
                      height: 80,
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.8)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 40 }} />
                  </IconButton>
                </Box>
              )}

              {/* Video Controls */}
              {(showControls || isFullscreen) && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    p: 3,
                    color: 'white',
                    transition: 'opacity 0.3s ease-in-out',
                    opacity: showControls || isFullscreen ? 1 : 0
                  }}
                >
                  {/* Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Slider
                      value={currentTime}
                      max={duration}
                      onChange={(_, value) => handleSeek(value as number)}
                      sx={{
                        '& .MuiSlider-thumb': {
                          color: '#1976d2',
                          width: 16,
                          height: 16,
                          '&:hover': {
                            boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)'
                          }
                        },
                        '& .MuiSlider-track': {
                          color: '#1976d2',
                          height: 4
                        },
                        '& .MuiSlider-rail': {
                          color: 'rgba(255,255,255,0.3)',
                          height: 4
                        },
                        '& .MuiSlider-mark': {
                          color: 'rgba(255,255,255,0.5)'
                        }
                      }}
                    />
                  </Box>

                  {/* Control Buttons */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={handlePlayPause}
                        sx={{
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        {isPlaying ? <Pause sx={{ fontSize: 28 }} /> : <PlayArrow sx={{ fontSize: 28 }} />}
                      </IconButton>
                      <Typography
                        variant="body2"
                        sx={{
                          mx: 2,
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          fontWeight: 500
                        }}
                      >
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={handleMute}
                        sx={{
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        {isMuted ? <VolumeOff sx={{ fontSize: 24 }} /> : <VolumeUp sx={{ fontSize: 24 }} />}
                      </IconButton>
                      <Box sx={{ width: 120, mx: 1 }}>
                        <Slider
                          value={isMuted ? 0 : volume}
                          max={1}
                          step={0.1}
                          onChange={(_, value) => handleVolumeChange(value as number)}
                          sx={{
                            '& .MuiSlider-thumb': {
                              color: 'white',
                              width: 12,
                              height: 12
                            },
                            '& .MuiSlider-track': {
                              color: 'white',
                              height: 3
                            },
                            '& .MuiSlider-rail': {
                              color: 'rgba(255,255,255,0.3)',
                              height: 3
                            }
                          }}
                        />
                      </Box>
                      <IconButton
                        onClick={handleFullscreen}
                        sx={{
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        {isFullscreen ? <FullscreenExit sx={{ fontSize: 24 }} /> : <Fullscreen sx={{ fontSize: 24 }} />}
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Loading Overlay */}
              {loading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.7)',
                    zIndex: 3
                  }}
                >
                  <LoadingProgress />
                </Box>
              )}
            </Paper>
            {/* Images and Prompts Used */}
            {((videoData && videoData.images && videoData.images.length > 0) || projectImages.length > 0) && (
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mt: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                      Images Used in Video Generation
                    </Typography>
                    <Grid container spacing={3}>
                      {(videoData?.images || projectImages).map((image, index) => {
                        const promptText = videoData?.settings?.imagePrompts?.[image.id] || image.prompt || 'No prompt available';
                        return (
                          <Grid item xs={12} sm={6} md={4} key={image.id}>
                            <Card sx={{ 
                              border: 1, 
                              borderColor: 'divider', 
                              borderRadius: 2,
                              overflow: 'hidden',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                transform: 'translateY(-2px)'
                              }
                            }}>
                              {/* Image Thumbnail */}
                              <Box
                                component="img"
                                src={image.preview_url || `/api/images/${image.id}/preview`}
                                alt={image.original_name}
                                sx={{
                                  width: '100%',
                                  height: 200,
                                  objectFit: 'cover',
                                  bgcolor: 'grey.100'
                                }}
                                onError={(e) => {
                                  console.error('Failed to load image:', image.original_name);
                                }}
                              />
                              
                              {/* Image Info */}
                              <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 1 }}>
                                  {image.original_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                  Image {index + 1}
                                </Typography>
                                
                                {/* Prompt Display */}
                                <Box sx={{ 
                                  p: 2, 
                                  bgcolor: 'grey.50', 
                                  borderRadius: 1, 
                                  border: 1, 
                                  borderColor: 'grey.200',
                                  mb: 2
                                }}>
                                  <Typography variant="body2" sx={{ 
                                    fontStyle: 'italic',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    "{promptText}"
                                  </Typography>
                                </Box>
                                
                                {/* Save Prompt Button */}
                                <Button
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                  startIcon={<BookmarkBorder />}
                                  onClick={() => handleOpenSavePromptDialog(image.id, image.original_name, promptText)}
                                  sx={{
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    fontWeight: 500
                                  }}
                                >
                                  Save Prompt
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              )}
          </Grid>

          {/* Video Info */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Video Details */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Video Details
                  </Typography>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Duration
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                        {formatTime(videoData.duration)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Created
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                        {new Date(videoData.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Project: &nbsp;
                      </Typography>
                      <Link
                        href={`/project/${videoData.projectName}`}
                        onClick={() => navigate(`/project/${videoData.projectName}`)}
                        underline="hover"
                        sx={{
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: '#1976d2',
                          '&:hover': {
                            color: '#1565c0'
                          }
                        }}
                      >
                        {videoData.projectName}
                      </Link>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Processing Settings */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Processing Settings
                  </Typography>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Video Duration per Photo
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                        {videoData.settings.videoDuration}s
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Music Volume
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                        {(videoData.settings.musicVolume * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Actions
                  </Typography>
                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Download />}
                      onClick={handleDownload}
                      disabled={downloading}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      {downloading ? 'Downloading...' : 'Download Video'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Share />}
                      onClick={handleShare}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      Share Video
                    </Button>
                    {videoData.status === 'error' && (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="warning"
                        startIcon={<Refresh />}
                        onClick={handleRetry}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        Retry Processing
                      </Button>
                    )}
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Replay />}
                      onClick={() => navigate(`/project/${videoData.projectName}`)}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      Create Similar
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Fallback: Show project images if no video data */}
              {!videoData && projectImages.length > 0 && (
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                      Project Images
                    </Typography>
                    <Grid container spacing={3}>
                      {projectImages.map((image, index) => {
                        const promptText = image.prompt || 'No prompt available';
                        return (
                          <Grid item xs={12} sm={6} md={4} key={image.id}>
                            <Card sx={{ 
                              border: 1, 
                              borderColor: 'divider', 
                              borderRadius: 2,
                              overflow: 'hidden',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                transform: 'translateY(-2px)'
                              }
                            }}>
                              {/* Image Thumbnail */}
                              <Box
                                component="img"
                                src={image.preview_url || `/api/images/${image.id}/preview`}
                                alt={image.original_name}
                                sx={{
                                  width: '100%',
                                  height: 200,
                                  objectFit: 'cover',
                                  bgcolor: 'grey.100'
                                }}
                                onError={(e) => {
                                  console.error('Failed to load image:', image.original_name);
                                }}
                              />
                              
                              {/* Image Info */}
                              <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 1 }}>
                                  {image.original_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                  Image {index + 1}
                                </Typography>
                                
                                {/* Prompt Display */}
                                <Box sx={{ 
                                  p: 2, 
                                  bgcolor: 'grey.50', 
                                  borderRadius: 1, 
                                  border: 1, 
                                  borderColor: 'grey.200',
                                  mb: 2
                                }}>
                                  <Typography variant="body2" sx={{ 
                                    fontStyle: 'italic',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    "{promptText}"
                                  </Typography>
                                </Box>
                                
                                {/* Save Prompt Button */}
                                <Button
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                  startIcon={<BookmarkBorder />}
                                  onClick={() => handleOpenSavePromptDialog(image.id, image.original_name, promptText)}
                                  sx={{
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    fontWeight: 500
                                  }}
                                >
                                  Save Prompt
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}>
            <Delete sx={{ mr: 1 }} />
            Delete Video
          </MenuItem>
        </Menu>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Share Video</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Share this video with others using the link below:
            </Typography>
            <TextField
              fullWidth
              value={shareUrl}
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
            <Button variant="contained" onClick={copyToClipboard}>
              Copy Link
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Video</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to delete "{videoData?.name.replace(/_\d+\.mp4$/, '')}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
            >
              Delete Video
            </Button>
          </DialogActions>
        </Dialog>

        {/* Save Prompt Dialog */}
        <SavePromptDialog
          open={savePromptDialog.open}
          onClose={handleCloseSavePromptDialog}
          onSave={handleSavePrompt}
          initialDescription={savePromptDialog.promptText}
          imageName={savePromptDialog.imageName}
        />
      </Box>
    </Container>
  );
};

export default VideoPlayerPage;