import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Slider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Breadcrumbs,
  Link,
  IconButton,
  Alert,
  Chip,
  Paper,
  Fade,
  Zoom,
  Tooltip,
  LinearProgress,
  Avatar,
  Badge,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Settings,
  PlayArrow,
  MusicNote,
  VideoLibrary,
  PhotoLibrary,
  Save,
  Refresh,
  BookmarkBorder,
  Add,
  AutoAwesome,
  Speed,
  VolumeUp,
  Image,
  Palette,
  Info,
  CloudUpload,
  Close as CloseIcon,
  BrandingWatermark
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import SavePromptDialog from '../components/SavePromptDialog';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

interface LogoSettings {
  path: string;
  filename: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number;
}

interface VideoSettings {
  videoDuration: number;
  musicVolume: number;
  imagePrompts: { [imageId: string]: string };
  aspectRatio: '16:9' | '9:16' | 'both';
  transition: 'none' | 'crossfade' | 'dissolve';
  transitionDuration: number;
  introText: string;
  outroText: string;
  logo?: LogoSettings;
}


interface Project {
  id: string;
  name: string;
  videos: any[];
  images: any[];
  music: any[];
}

interface SavedPrompt {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

const SettingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState<VideoSettings>({
    videoDuration: 5,
    musicVolume: 0.3,
    imagePrompts: {},
    aspectRatio: '16:9',
    transition: 'none',
    transitionDuration: 1,
    introText: '',
    outroText: ''
  });
  const [videoName, setVideoName] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
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

  const durationOptions = [
    { value: 5, label: '5 seconds' },
    { value: 10, label: '10 seconds' }
  ];

  const loadSavedPrompts = async () => {
    try {
      setLoadingPrompts(true);
      console.log('Loading saved prompts...');
      const response = await apiService.getSavedPrompts();
      console.log('Saved prompts response:', response);
      setSavedPrompts(response.prompts || []);
    } catch (error) {
      console.error('Failed to load saved prompts:', error);
      showError('Failed to load saved prompts. Please try again.');
      setSavedPrompts([]); // Set empty array on error
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const projectData = await apiService.getProject(projectId);
        setProject(projectData);
        setVideoName(`Video${(projectData.videos?.length || 0) + 1}`);

        // Generate default prompts and initialize image prompts
        if (projectData.images && projectData.images.length > 0) {
          try {
            const result = await apiService.generateDefaultPrompts(projectId);
            const imagePrompts: { [imageId: string]: string } = {};

            // Use generated prompts as default values
            projectData.images.forEach((image: any) => {
              imagePrompts[image.id] = result.defaultPrompts[image.id] || '';
            });

            setSettings(prev => ({
              ...prev,
              imagePrompts
            }));

            showSuccess(`Generated ${Object.keys(result.defaultPrompts).length} default prompts!`);
          } catch (error) {
            console.error('Failed to generate default prompts:', error);
            // Fallback to empty prompts if generation fails
            const imagePrompts: { [imageId: string]: string } = {};
            projectData.images.forEach((image: any) => {
              imagePrompts[image.id] = '';
            });
            setSettings(prev => ({
              ...prev,
              imagePrompts
            }));
            showError('Failed to generate default prompts. You can add them manually.');
          }
        } else {
          // No images, initialize empty prompts
          const imagePrompts: { [imageId: string]: string } = {};
          setSettings(prev => ({
            ...prev,
            imagePrompts
          }));
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        showError('Failed to load project data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
    loadSavedPrompts();
  }, [projectId, navigate]);

  const handleSettingChange = (key: keyof VideoSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file for the logo');
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await apiService.uploadLogo(projectId, file);
      setSettings(prev => ({
        ...prev,
        logo: {
          path: result.logo.path,
          filename: result.logo.filename,
          position: prev.logo?.position || 'bottom-right',
          opacity: prev.logo?.opacity ?? 0.7
        }
      }));
      showSuccess('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      showError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleImagePromptChange = (imageId: string, prompt: string) => {
    setSettings(prev => ({
      ...prev,
      imagePrompts: {
        ...prev.imagePrompts,
        [imageId]: prompt
      }
    }));
  };

  const handleSelectSavedPrompt = (imageId: string, promptId: string) => {
    const selectedPrompt = savedPrompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      handleImagePromptChange(imageId, selectedPrompt.description);
      // Record usage
      apiService.useSavedPrompt(promptId).catch(console.error);
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
    loadSavedPrompts(); // Refresh the list
  };


  const handleSaveSettings = async () => {
    if (!projectId) return;

    setSaving(true);
    try {
      // Save settings to project (you might want to add this API endpoint)
      await apiService.updateProjectSettings(projectId, settings);
      showSuccess('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!projectId || !project?.images?.length) {
      showError('Please upload at least one photo before creating a video');
      return;
    }

    if (!videoName.trim()) {
      showError('Please enter a video name');
      return;
    }

    setProcessing(true);
    try {
      const videoSettings = {
        ...settings,
        videoName: videoName.trim(),
        imageOrder: project.images.map((img: any) => img.id),
      };

      const result = await apiService.startProcessing(projectId, videoSettings);
      showSuccess('Video processing started! Redirecting to processing page...');
      navigate(`/processing/${projectId}/${result.processingId}`);
    } catch (error) {
      console.error('Failed to start video processing:', error);
      showError('Failed to start video processing. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <Typography>Loading project settings...</Typography>
        </Box>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <Alert severity="error">Project not found</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: GRADIENTS.PAGE_BG,
      py: 4
    }}>
      <Container maxWidth="lg">
        <Fade in timeout={600}>
          <Box>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 4 }}>
              <Link
                underline="hover"
                color="inherit"
                href="/dashboard"
                onClick={() => navigate('/dashboard')}
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
                href={`/project/${projectId}`}
                onClick={() => navigate(`/project/${projectId}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                {project.name}
              </Link>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                Video Settings
              </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 4,
                background: GRADIENTS.PRIMARY,
                color: 'white',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <IconButton
                        onClick={() => navigate(`/project/${projectId}`)}
                        sx={{
                          mr: 2,
                          color: 'white',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                        }}
                      >
                        <ArrowBack />
                      </IconButton>
                      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: 'white' }}>
                        Video Settings
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                      Configure your video settings and create stunning property videos
                    </Typography>
                  </Box>
                  <Zoom in timeout={800}>
                    <Button
                      variant="contained"
                      startIcon={processing ? <LinearProgress sx={{ width: 16, height: 16 }} /> : <PlayArrow />}
                      onClick={handleCreateVideo}
                      disabled={processing || !project.images?.length}
                      size="large"
                      sx={{
                        px: 4,
                        py: 1.5,
                        bgcolor: 'white',
                        color: 'primary.main',
                        fontWeight: 600,
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                        },
                        '&:disabled': {
                          bgcolor: 'rgba(255,255,255,0.5)',
                          color: 'rgba(0,0,0,0.3)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {processing ? 'Creating Video...' : 'Create Video'}
                    </Button>
                  </Zoom>
                </Box>

                {/* Quick Stats */}
                <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 32, height: 32 }}>
                      <Image sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {project?.images?.length || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Images
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 32, height: 32 }}>
                      <VideoLibrary sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {project?.videos?.length || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Videos
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 32, height: 32 }}>
                      <Speed sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {settings.videoDuration}s
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Duration
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Background decoration */}
              <Box sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                zIndex: 1
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                zIndex: 1
              }} />
            </Paper>

            <Grid container spacing={4}>
              {/* Video Configuration */}
              <Grid item xs={12} md={8}>
                <Fade in timeout={800}>
                  <Card sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Avatar sx={{
                          bgcolor: 'primary.main',
                          mr: 2,
                          width: 48,
                          height: 48,
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                        }}>
                          <VideoLibrary sx={{ fontSize: 24 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Video Configuration
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Set up your video parameters and preferences
                          </Typography>
                        </Box>
                      </Box>

                      <Stack spacing={4}>
                        {/* Video Name */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Palette sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Video Name
                            </Typography>
                          </Box>
                          <TextField
                            fullWidth
                            value={videoName}
                            onChange={(e) => setVideoName(e.target.value)}
                            placeholder="Enter a descriptive name for your video"
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                              },
                            }}
                          />
                        </Box>

                        {/* Video Duration */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Speed sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Video Duration
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Choose how long your final video should be
                          </Typography>
                          <FormControl fullWidth>
                            <InputLabel>Duration</InputLabel>
                            <Select
                              value={settings.videoDuration}
                              onChange={(e) => handleSettingChange('videoDuration', e.target.value)}
                              label="Duration"
                              sx={{
                                borderRadius: 2,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                              }}
                            >
                              {durationOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Speed sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                                    {option.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                        {/* Aspect Ratio */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <VideoLibrary sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Aspect Ratio
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Choose the format for your output video
                          </Typography>
                          <FormControl fullWidth>
                            <InputLabel>Aspect Ratio</InputLabel>
                            <Select
                              value={settings.aspectRatio}
                              onChange={(e) => handleSettingChange('aspectRatio', e.target.value)}
                              label="Aspect Ratio"
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="16:9">Horizontal (16:9) - 1920x1080</MenuItem>
                              <MenuItem value="9:16">Vertical (9:16) - 1080x1920</MenuItem>
                              <MenuItem value="both">Both (generates 2 videos)</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>

                        {/* Transitions */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AutoAwesome sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Transition Effect
                            </Typography>
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={8}>
                              <FormControl fullWidth>
                                <InputLabel>Transition</InputLabel>
                                <Select
                                  value={settings.transition}
                                  onChange={(e) => handleSettingChange('transition', e.target.value)}
                                  label="Transition"
                                  sx={{ borderRadius: 2 }}
                                >
                                  <MenuItem value="none">None (cut)</MenuItem>
                                  <MenuItem value="crossfade">Crossfade</MenuItem>
                                  <MenuItem value="dissolve">Dissolve</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            {settings.transition !== 'none' && (
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  type="number"
                                  label="Duration (s)"
                                  value={settings.transitionDuration}
                                  onChange={(e) => handleSettingChange('transitionDuration', parseFloat(e.target.value) || 0.5)}
                                  inputProps={{ min: 0.5, max: 2, step: 0.5 }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                              </Grid>
                            )}
                          </Grid>
                        </Box>

                        {/* Text Overlays */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Palette sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Text Overlays
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Add intro and outro text (leave blank to skip)
                          </Typography>
                          <Stack spacing={2}>
                            <TextField
                              fullWidth
                              label="Intro Text (first 3 seconds)"
                              value={settings.introText}
                              onChange={(e) => handleSettingChange('introText', e.target.value)}
                              placeholder="e.g., 123 Main Street"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                              fullWidth
                              label="Outro Text (last 3 seconds)"
                              value={settings.outroText}
                              onChange={(e) => handleSettingChange('outroText', e.target.value)}
                              placeholder="e.g., Contact us at 555-1234"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Stack>
                        </Box>

                        {/* Logo / Watermark */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <BrandingWatermark sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Logo / Watermark
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Add a logo overlay to your video (PNG recommended)
                          </Typography>

                          {settings.logo?.path ? (
                            <Stack spacing={2}>
                              <Alert
                                severity="success"
                                action={
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const { logo, ...rest } = settings;
                                      setSettings(rest as VideoSettings);
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                }
                              >
                                Logo: {settings.logo.filename}
                              </Alert>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <FormControl fullWidth>
                                    <InputLabel>Position</InputLabel>
                                    <Select
                                      value={settings.logo.position}
                                      onChange={(e) =>
                                        setSettings(prev => ({
                                          ...prev,
                                          logo: prev.logo ? { ...prev.logo, position: e.target.value as LogoSettings['position'] } : undefined
                                        }))
                                      }
                                      label="Position"
                                      sx={{ borderRadius: 2 }}
                                    >
                                      <MenuItem value="top-left">Top Left</MenuItem>
                                      <MenuItem value="top-right">Top Right</MenuItem>
                                      <MenuItem value="bottom-left">Bottom Left</MenuItem>
                                      <MenuItem value="bottom-right">Bottom Right</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" gutterBottom>
                                    Opacity: {Math.round((settings.logo.opacity || 0.7) * 100)}%
                                  </Typography>
                                  <Slider
                                    value={settings.logo.opacity || 0.7}
                                    onChange={(_, val) =>
                                      setSettings(prev => ({
                                        ...prev,
                                        logo: prev.logo ? { ...prev.logo, opacity: val as number } : undefined
                                      }))
                                    }
                                    min={0.1}
                                    max={1}
                                    step={0.1}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                                  />
                                </Grid>
                              </Grid>
                            </Stack>
                          ) : (
                            <Button
                              variant="outlined"
                              component="label"
                              startIcon={uploadingLogo ? <CircularProgress size={16} /> : <CloudUpload />}
                              disabled={uploadingLogo}
                              sx={{ borderRadius: 2 }}
                            >
                              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                              <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                            </Button>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Fade>

                {/* Image Prompts */}
                {project?.images && project.images.length > 0 && (
                  <Fade in timeout={1000}>
                    <Box>
                      <Card sx={{
                        mt: 3,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                            <Avatar sx={{
                              bgcolor: 'secondary.main',
                              mr: 2,
                              width: 48,
                              height: 48,
                              boxShadow: '0 4px 16px rgba(156, 39, 176, 0.3)'
                            }}>
                              <AutoAwesome sx={{ fontSize: 24 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                Custom Image Prompts
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Customize prompts for each image to influence how it's animated and styled
                              </Typography>
                            </Box>
                          </Box>

                          <Alert
                            severity="info"
                            icon={<Info />}
                            sx={{
                              mb: 4,
                              borderRadius: 2,
                              '& .MuiAlert-icon': {
                                fontSize: 20
                              }
                            }}
                          >
                            Default prompts have been generated automatically for you. You can customize them or use saved prompts from your library.
                          </Alert>

                          <Stack spacing={3}>
                            {project.images.map((image: any, index: number) => (
                              <Paper
                                key={image.id}
                                elevation={2}
                                sx={{
                                  p: 3,
                                  borderRadius: 3,
                                  border: '1px solid rgba(0,0,0,0.08)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                              >
                                <Box>
                                  {/* Image Preview */}
                                  <Box sx={{
                                    position: 'relative',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                                  }}>
                                    <Box
                                      component="img"
                                      src={`/api/images/${image.id}/preview`}
                                      alt={image.original_name || image.filename}
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        transition: 'transform 0.3s ease',
                                        '&:hover': {
                                          transform: 'scale(1.05)'
                                        }
                                      }}
                                    />
                                    <Chip
                                      label={`#${index + 1}`}
                                      size="small"
                                      sx={{
                                        position: 'absolute',
                                        top: 8,
                                        left: 8,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        fontWeight: 600
                                      }}
                                    />
                                  </Box>

                                  {/* Content */}
                                  <Box sx={{ flex: 1, minWidth: 0, mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                      <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
                                        {image.original_name || image.filename}
                                      </Typography>
                                      <Chip
                                        label="Image"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        icon={<Image />}
                                      />
                                    </Box>

                                    {/* Saved Prompts Dropdown */}
                                    <Box sx={{ mb: 3 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                          Quick Select from Saved Prompts
                                        </Typography>
                                        <IconButton
                                          size="small"
                                          onClick={loadSavedPrompts}
                                          disabled={loadingPrompts}
                                          sx={{ 
                                            color: 'primary.main',
                                            '&:hover': { bgcolor: 'primary.50' }
                                          }}
                                        >
                                          <Refresh />
                                        </IconButton>
                                      </Box>
                                      {loadingPrompts ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                                          <LinearProgress sx={{ width: '100%', mr: 2 }} />
                                          <Typography variant="caption" color="text.secondary">
                                            Loading prompts...
                                          </Typography>
                                        </Box>
                                      ) : savedPrompts.length > 0 ? (
                                        <Autocomplete
                                          options={savedPrompts}
                                          getOptionLabel={(option) => option.name}
                                          value={null}
                                          onChange={(event, newValue) => {
                                            if (newValue) {
                                              handleSelectSavedPrompt(image.id, newValue.id);
                                            }
                                          }}
                                          renderInput={(params) => (
                                            <TextField
                                              {...params}
                                              label="Select Saved Prompt"
                                              size="small"
                                              sx={{ borderRadius: 2 }}
                                            />
                                          )}
                                          renderOption={(props, option) => (
                                            <Box component="li" {...props}>
                                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <Box sx={{ flex: 1 }}>
                                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                    {option.name}
                                                  </Typography>
                                                </Box>
                                                <Chip
                                                  label={`${option.usage_count || 'Never'} used`}
                                                  size="small"
                                                  color="primary"
                                                  variant="outlined"
                                                  sx={{ ml: 1 }}
                                                />
                                              </Box>
                                            </Box>
                                          )}
                                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                                          noOptionsText="No saved prompts found"
                                          clearOnEscape
                                          selectOnFocus
                                          handleHomeEndKeys
                                        />
                                      ) : (
                                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                                          <Typography variant="body2" color="text.secondary">
                                            No saved prompts available. Create some prompts in the Prompt Management page.
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>

                                    {/* Custom Prompt Input */}
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                                        Custom Prompt
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <TextField
                                          fullWidth
                                          multiline
                                          minRows={3}
                                          maxRows={6}
                                          value={settings.imagePrompts[image.id] || ''}
                                          onChange={(e) => handleImagePromptChange(image.id, e.target.value)}
                                          placeholder="e.g., 'Smooth zoom in with elegant fade transition, cinematic lighting'"
                                          variant="outlined"
                                          sx={{
                                            '& .MuiOutlinedInput-root': {
                                              borderRadius: 2,
                                            },
                                          }}
                                        />
                                        <Tooltip title="Save this prompt to your library">
                                          <Button
                                            variant="contained"
                                            startIcon={<BookmarkBorder />}
                                            onClick={() => handleOpenSavePromptDialog(
                                              image.id, 
                                              image.original_name || image.filename, 
                                              settings.imagePrompts[image.id] || ''
                                            )}
                                            disabled={!settings.imagePrompts[image.id]?.trim()}
                                            sx={{
                                              minWidth: 'auto',
                                              px: 3,
                                              py: 1.5,
                                              borderRadius: 2,
                                              boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                                              '&:hover': {
                                                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                                                transform: 'translateY(-1px)'
                                              },
                                              transition: 'all 0.3s ease'
                                            }}
                                          >
                                            Save
                                          </Button>
                                        </Tooltip>
                                      </Box>
                                    </Box>

                                    {/* Quick Actions */}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() => navigate('/prompt-management')}
                                        sx={{
                                          fontSize: '0.875rem',
                                          borderRadius: 2,
                                          px: 2,
                                          '&:hover': {
                                            bgcolor: 'primary.50'
                                          }
                                        }}
                                      >
                                        Manage Prompts
                                      </Button>
                                    </Box>
                                  </Box>
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  </Fade>
                )}
              </Grid>

              {/* Music & Project Info */}
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  {/* Music Settings */}
                  {project.music && project.music.length > 0 && (
                    <Fade in timeout={1200}>
                      <Card sx={{
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Avatar sx={{
                              bgcolor: 'success.main',
                              mr: 2,
                              width: 40,
                              height: 40,
                              boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)'
                            }}>
                              <MusicNote sx={{ fontSize: 20 }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              Music Settings
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <VolumeUp sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Volume: {Math.round(settings.musicVolume * 100)}%
                              </Typography>
                            </Box>
                            <Slider
                              value={settings.musicVolume}
                              onChange={(_, value) => handleSettingChange('musicVolume', value)}
                              min={0}
                              max={1}
                              step={0.1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                              sx={{
                                color: 'primary.main',
                                '& .MuiSlider-thumb': {
                                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                                },
                                '& .MuiSlider-track': {
                                  height: 6,
                                  borderRadius: 3,
                                },
                                '& .MuiSlider-rail': {
                                  height: 6,
                                  borderRadius: 3,
                                }
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                              Current Music:
                            </Typography>
                            <Chip
                              label={project.music[0].original_name || 'Background Music'}
                              color="primary"
                              variant="filled"
                              sx={{
                                mb: 2,
                                fontWeight: 600,
                                '& .MuiChip-label': {
                                  px: 2
                                }
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Fade>
                  )}

                  {/* Project Summary */}
                  <Fade in timeout={1400}>
                    <Card sx={{
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Avatar sx={{
                            bgcolor: 'info.main',
                            mr: 2,
                            width: 40,
                            height: 40,
                            boxShadow: '0 4px 16px rgba(33, 150, 243, 0.3)'
                          }}>
                            <PhotoLibrary sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Project Summary
                          </Typography>
                        </Box>

                        <Stack spacing={3}>
                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Image sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                              <Typography variant="body2" color="text.secondary">
                                Images:
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {project?.images?.length || 0}
                            </Typography>
                          </Box>

                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <VideoLibrary sx={{ mr: 1, color: 'secondary.main', fontSize: 18 }} />
                              <Typography variant="body2" color="text.secondary">
                                Videos:
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                              {project?.videos?.length || 0}
                            </Typography>
                          </Box>

                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Speed sx={{ mr: 1, color: 'success.main', fontSize: 18 }} />
                              <Typography variant="body2" color="text.secondary">
                                Duration:
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {settings.videoDuration}s
                            </Typography>
                          </Box>

                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AutoAwesome sx={{ mr: 1, color: 'warning.main', fontSize: 18 }} />
                              <Typography variant="body2" color="text.secondary">
                                With prompts:
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                              {Object.values(settings.imagePrompts).filter(prompt => prompt.trim()).length} / {project?.images?.length || 0}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Fade>

                  {/* Action Buttons */}
                  <Fade in timeout={1600}>
                    <Card sx={{
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={processing ? <LinearProgress sx={{ width: 16, height: 16 }} /> : <PlayArrow />}
                            onClick={handleCreateVideo}
                            disabled={processing || !project.images?.length}
                            size="large"
                            sx={{
                              py: 1.5,
                              borderRadius: 2,
                              fontWeight: 600,
                              boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                              '&:hover': {
                                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                                transform: 'translateY(-1px)'
                              },
                              '&:disabled': {
                                boxShadow: 'none',
                                transform: 'none'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {processing ? 'Creating Video...' : 'Create Video'}
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={saving ? <LinearProgress sx={{ width: 16, height: 16 }} /> : <Save />}
                            onClick={handleSaveSettings}
                            disabled={saving}
                            sx={{
                              py: 1.5,
                              borderRadius: 2,
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: 'primary.50',
                                transform: 'translateY(-1px)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {saving ? 'Saving...' : 'Save Settings'}
                          </Button>
                          <Button
                            fullWidth
                            variant="text"
                            startIcon={<Refresh />}
                            onClick={() => navigate(`/project/${projectId}`)}
                            sx={{
                              py: 1.5,
                              borderRadius: 2,
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: 'grey.100',
                                transform: 'translateY(-1px)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Back to Project
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Fade>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Container>

      {/* Save Prompt Dialog */}
      <SavePromptDialog
        open={savePromptDialog.open}
        onClose={handleCloseSavePromptDialog}
        onSave={handleSavePrompt}
        initialDescription={savePromptDialog.promptText}
        imageName={savePromptDialog.imageName}
      />
    </Box>
  );
};

export default SettingsPage;
