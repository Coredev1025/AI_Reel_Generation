import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CardMedia,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Paper,
  Container,
  Avatar,
  Fade,
  Zoom,
  LinearProgress,
  Tooltip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add,
  MoreVert,
  PlayArrow,
  Edit,
  Delete,
  Folder,
  VideoLibrary,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  Image,
  Star,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import LoadingProgress from '../components/LoadingProgress';
import { useToast } from '../contexts/ToastContext';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  status: 'draft' | 'processing' | 'completed' | 'error';
  videoCount: number;
  imageCount: number;
  createdAt: string;
  updatedAt: string;
  latestVideo?: {
    id: string;
    filename: string;
    filePath: string;
    videoUrl: string;
    thumbnailUrl: string;
    createdAt: string;
  };
  latestProcessingJob?: {
    id: string;
    status: string;
    stage?: string;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Counts {
  totalProjects: number;
  completedProjects: number;
  processingProjects: number;
  totalVideos: number;
}

interface ProjectsResponse {
  projects: Project[];
  pagination: PaginationInfo;
  counts: Counts;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [counts, setCounts] = useState<Counts>({
    totalProjects: 0,
    completedProjects: 0,
    processingProjects: 0,
    totalVideos: 0,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: ProjectsResponse = await apiService.getProjects(
          currentPage,
          itemsPerPage
        );
        const transformedProjects = response.projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          thumbnail: project.latestVideo?.thumbnailUrl || '',
          status: project.status === 'active' ? 'draft' : project.status,
          videoCount: project.videoCount || 0,
          imageCount: project.imageCount || 0,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          latestVideo: project.latestVideo,
          latestProcessingJob: project.latestProcessingJob || null,
        }));
        setProjects(transformedProjects);
        setPagination(response.pagination);
        setCounts(response.counts);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('Failed to load projects. Please try again.');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [currentPage, itemsPerPage]);

  const handleCreateProject = () => navigate('/project/new');
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) =>
    setCurrentPage(page);
  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    setItemsPerPage(event.target.value as number);
    setCurrentPage(1);
  };

  const handleProjectClick = (projectName: string) => {
    const project = projects.find((p) => p.name === projectName);
    if (
      project &&
      project.latestProcessingJob &&
      project.latestProcessingJob.status === 'processing'
    ) {
      navigate(`/processing/${project.id}/${project.latestProcessingJob.id}`);
    } else {
      navigate(`/project/${projectName}`);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleDeleteProject = async () => {
    if (selectedProject) {
      try {
        const result = await apiService.deleteProject(selectedProject.name);
        setProjects((prev) => prev.filter((p) => p.name !== selectedProject.name));
        setDeleteDialogOpen(false);
        handleMenuClose();
        const { deletedItems } = result;
        const itemCounts = [];
        if (deletedItems.images > 0)
          itemCounts.push(`${deletedItems.images} image${deletedItems.images !== 1 ? 's' : ''}`);
        if (deletedItems.music > 0)
          itemCounts.push(
            `${deletedItems.music} music file${deletedItems.music !== 1 ? 's' : ''}`
          );
        if (deletedItems.videos > 0)
          itemCounts.push(`${deletedItems.videos} video${deletedItems.videos !== 1 ? 's' : ''}`);
        if (deletedItems.processingJobs > 0)
          itemCounts.push(
            `${deletedItems.processingJobs} processing job${deletedItems.processingJobs !== 1 ? 's' : ''}`
          );
        const message =
          itemCounts.length > 0
            ? `Project deleted successfully. Removed: ${itemCounts.join(', ')}.`
            : 'Project deleted successfully.';
        showSuccess(message);
      } catch (err) {
        console.error('Failed to delete project:', err);
        showError('Failed to delete project. Please try again.');
      }
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return COLORS.SUCCESS;
      case 'processing':
        return COLORS.WARNING;
      case 'error':
        return COLORS.ERROR;
      default:
        return COLORS.PRIMARY;
    }
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle sx={{ fontSize: 14 }} />;
      case 'processing':
        return <Schedule sx={{ fontSize: 14 }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 14 }} />;
      default:
        return <Folder sx={{ fontSize: 14 }} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <LoadingProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: GRADIENTS.PAGE_BG,
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Fade in timeout={500}>
          <Box>
            {/* Header Section */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
                mb: 4,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ fontWeight: 800, color: COLORS.DARK, mb: 0.5 }}
                >
                  My Projects
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage your property video projects
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={handleCreateProject}
                sx={{
                  borderRadius: RADIUS.MD,
                  px: 4,
                  py: 1.5,
                  background: GRADIENTS.PRIMARY,
                  fontWeight: 700,
                  boxShadow: SHADOWS.BUTTON,
                  textTransform: 'none',
                  '&:hover': {
                    background: GRADIENTS.PRIMARY_HOVER,
                    transform: 'translateY(-2px)',
                    boxShadow: SHADOWS.BUTTON_HOVER,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                New Project
              </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {[
                {
                  icon: <Folder sx={{ fontSize: 22 }} />,
                  value: counts.totalProjects,
                  label: 'Total Projects',
                  color: COLORS.PRIMARY,
                },
                {
                  icon: <CheckCircle sx={{ fontSize: 22 }} />,
                  value: counts.completedProjects,
                  label: 'Completed',
                  color: COLORS.SUCCESS,
                },
                {
                  icon: <Schedule sx={{ fontSize: 22 }} />,
                  value: counts.processingProjects,
                  label: 'Processing',
                  color: COLORS.WARNING,
                },
                {
                  icon: <VideoLibrary sx={{ fontSize: 22 }} />,
                  value: counts.totalVideos,
                  label: 'Total Videos',
                  color: COLORS.ACCENT_DARK,
                },
              ].map((stat, idx) => (
                <Grid item xs={6} md={3} key={idx}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: RADIUS.LG,
                      border: '1px solid rgba(0,0,0,0.04)',
                      bgcolor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: RADIUS.MD,
                        bgcolor: `${stat.color}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color,
                        flexShrink: 0,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Processing Banner */}
            {counts.processingProjects > 0 && (
              <Fade in timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 4,
                    background: `linear-gradient(135deg, ${COLORS.WARNING}15, ${COLORS.WARNING}08)`,
                    borderRadius: RADIUS.LG,
                    border: `1px solid ${COLORS.WARNING}30`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: RADIUS.SM,
                      bgcolor: `${COLORS.WARNING}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Schedule sx={{ color: COLORS.WARNING, fontSize: 22 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {counts.processingProjects} Project
                      {counts.processingProjects !== 1 ? 's' : ''} Processing
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your videos are being generated with AI
                    </Typography>
                  </Box>
                  <LinearProgress
                    sx={{
                      width: 120,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: `${COLORS.WARNING}20`,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: COLORS.WARNING,
                      },
                    }}
                  />
                </Paper>
              </Fade>
            )}

            {/* Projects Grid */}
            {projects.length === 0 ? (
              <Fade in timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 8,
                    textAlign: 'center',
                    borderRadius: RADIUS.XL,
                    bgcolor: 'white',
                    border: '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: RADIUS.LG,
                      background: `${COLORS.PRIMARY}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <Folder sx={{ fontSize: 40, color: COLORS.PRIMARY }} />
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, mb: 1.5 }}
                  >
                    No projects yet
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}
                  >
                    Create your first project to start building amazing property videos with AI
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Add />}
                    onClick={handleCreateProject}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: RADIUS.MD,
                      fontWeight: 700,
                      background: GRADIENTS.PRIMARY,
                      boxShadow: SHADOWS.BUTTON,
                      textTransform: 'none',
                      '&:hover': {
                        background: GRADIENTS.PRIMARY_HOVER,
                        transform: 'translateY(-2px)',
                        boxShadow: SHADOWS.BUTTON_HOVER,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Create First Project
                  </Button>
                </Paper>
              </Fade>
            ) : (
              <>
                <Grid container spacing={3}>
                  {projects.map((project, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                      <Fade in timeout={600 + index * 100}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            borderRadius: RADIUS.LG,
                            boxShadow: SHADOWS.CARD,
                            border: '1px solid rgba(0,0,0,0.04)',
                            bgcolor: 'white',
                            transition: 'all 0.3s ease',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: SHADOWS.CARD_HOVER,
                              borderColor: `${COLORS.PRIMARY}20`,
                              '& .project-thumbnail': {
                                transform: 'scale(1.05)',
                              },
                            },
                          }}
                          onClick={() => handleProjectClick(project.name)}
                        >
                          <CardMedia
                            component="div"
                            className="project-thumbnail"
                            sx={{
                              height: 180,
                              bgcolor: '#F0F0F5',
                              backgroundImage: project.thumbnail
                                ? `url(${project.thumbnail})`
                                : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              position: 'relative',
                              transition: 'transform 0.4s ease',
                            }}
                          >
                            {/* Status + Menu overlay */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                display: 'flex',
                                gap: 0.5,
                                zIndex: 3,
                              }}
                            >
                              <Chip
                                icon={getStatusIcon(project.status)}
                                label={
                                  project.status.charAt(0).toUpperCase() + project.status.slice(1)
                                }
                                size="small"
                                sx={{
                                  bgcolor: getStatusColor(project.status),
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 26,
                                  '& .MuiChip-icon': { color: 'white' },
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuClick(e, project)}
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.9)',
                                  width: 26,
                                  height: 26,
                                  '&:hover': { bgcolor: 'white' },
                                }}
                              >
                                <MoreVert sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>

                            {!project.thumbnail && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '100%',
                                  flexDirection: 'column',
                                  gap: 1,
                                }}
                              >
                                <VideoLibrary
                                  sx={{ fontSize: 40, color: 'rgba(0,0,0,0.15)' }}
                                />
                              </Box>
                            )}

                            {project.latestVideo && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  zIndex: 2,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/video/${project.latestVideo?.id}/stream`);
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255,255,255,0.95)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                    transition: 'transform 0.2s ease',
                                    '&:hover': { transform: 'scale(1.1)' },
                                  }}
                                >
                                  <PlayArrow
                                    sx={{ fontSize: 24, color: COLORS.PRIMARY }}
                                  />
                                </Box>
                              </Box>
                            )}
                          </CardMedia>

                          <CardContent sx={{ p: 2.5 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                mb: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {project.name}
                            </Typography>
                            {project.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 2,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.5,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {project.description}
                              </Typography>
                            )}

                            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <VideoLibrary
                                  sx={{ fontSize: 14, color: 'text.secondary' }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {project.videoCount} videos
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Image
                                  sx={{ fontSize: 14, color: 'text.secondary' }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {project.imageCount} images
                                </Typography>
                              </Box>
                            </Stack>

                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                pt: 1.5,
                                borderTop: '1px solid rgba(0,0,0,0.04)',
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 500 }}
                              >
                                {formatDate(project.updatedAt)}
                              </Typography>
                              {project.status === 'completed' && (
                                <Chip
                                  icon={<Star sx={{ fontSize: 12 }} />}
                                  label="Ready"
                                  size="small"
                                  sx={{
                                    height: 22,
                                    bgcolor: `${COLORS.SUCCESS}15`,
                                    color: COLORS.SUCCESS,
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    '& .MuiChip-icon': { color: COLORS.SUCCESS },
                                  }}
                                />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      mt: 4,
                      borderRadius: RADIUS.LG,
                      bgcolor: 'white',
                      border: '1px solid rgba(0,0,0,0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, pagination.total)} of{' '}
                        {pagination.total}
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <InputLabel>Per page</InputLabel>
                        <Select
                          value={itemsPerPage}
                          label="Per page"
                          onChange={handleItemsPerPageChange}
                        >
                          <MenuItem value={4}>4</MenuItem>
                          <MenuItem value={8}>8</MenuItem>
                          <MenuItem value={16}>16</MenuItem>
                          <MenuItem value={32}>32</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Pagination
                      count={pagination.totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="medium"
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontWeight: 600,
                          borderRadius: RADIUS.SM,
                        },
                      }}
                    />
                  </Paper>
                )}
              </>
            )}

            {/* Context Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: RADIUS.MD,
                  boxShadow: SHADOWS.USER_MENU,
                  border: '1px solid rgba(0,0,0,0.06)',
                  minWidth: 200,
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  if (selectedProject) {
                    if (
                      selectedProject.latestProcessingJob &&
                      selectedProject.latestProcessingJob.status === 'processing'
                    ) {
                      navigate(
                        `/processing/${selectedProject.id}/${selectedProject.latestProcessingJob.id}`
                      );
                    } else {
                      navigate(`/project/${selectedProject.id}`);
                    }
                  }
                  handleMenuClose();
                }}
                sx={{ py: 1.5, gap: 1.5, fontSize: '0.9rem' }}
              >
                <Edit sx={{ fontSize: 18, color: 'text.secondary' }} />
                {selectedProject?.latestProcessingJob?.status === 'processing'
                  ? 'View Processing'
                  : 'Edit Project'}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (selectedProject?.latestVideo) {
                    window.open(selectedProject.latestVideo.videoUrl, '_blank');
                  }
                  handleMenuClose();
                }}
                disabled={!selectedProject?.latestVideo}
                sx={{ py: 1.5, gap: 1.5, fontSize: '0.9rem' }}
              >
                <PlayArrow sx={{ fontSize: 18, color: 'text.secondary' }} />
                Play Latest Video
              </MenuItem>
              {selectedProject?.latestProcessingJob?.status === 'failed' && (
                <MenuItem
                  onClick={async () => {
                    if (selectedProject?.latestProcessingJob) {
                      try {
                        await apiService.cleanupFailedProcessing(
                          selectedProject.latestProcessingJob.id
                        );
                        showSuccess('Failed processing cleaned up!');
                        window.location.reload();
                      } catch {
                        showError('Failed to clean up. Please try again.');
                      }
                    }
                    handleMenuClose();
                  }}
                  sx={{ py: 1.5, gap: 1.5, fontSize: '0.9rem' }}
                >
                  <Delete sx={{ fontSize: 18, color: 'text.secondary' }} />
                  Clean Up Failed Processing
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  if (selectedProject?.status === 'completed') {
                    navigate(`/project/${selectedProject.id}?tab=videos`);
                  }
                  handleMenuClose();
                }}
                disabled={selectedProject?.status !== 'completed'}
                sx={{ py: 1.5, gap: 1.5, fontSize: '0.9rem' }}
              >
                <PlayArrow sx={{ fontSize: 18, color: 'text.secondary' }} />
                View All Videos
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setDeleteDialogOpen(true);
                  handleMenuClose();
                }}
                sx={{ py: 1.5, gap: 1.5, fontSize: '0.9rem', color: 'error.main' }}
              >
                <Delete sx={{ fontSize: 18 }} />
                Delete Project
              </MenuItem>
            </Menu>

            {/* Delete Dialog */}
            <Dialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: { borderRadius: RADIUS.LG, p: 1 },
              }}
            >
              <DialogTitle sx={{ fontWeight: 700 }}>Delete Project</DialogTitle>
              <DialogContent>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                  Are you sure you want to delete &quot;{selectedProject?.name}&quot;?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This action cannot be undone and will permanently delete:
                </Typography>
                {selectedProject && (
                  <Box sx={{ mb: 2, pl: 1 }}>
                    {[
                      `${selectedProject.imageCount} image${selectedProject.imageCount !== 1 ? 's' : ''}`,
                      `${selectedProject.videoCount} video${selectedProject.videoCount !== 1 ? 's' : ''}`,
                      'All music files',
                      'All processing jobs',
                      'Project settings and metadata',
                    ].map((item, idx) => (
                      <Typography
                        key={idx}
                        variant="body2"
                        color="error"
                        sx={{ fontWeight: 500, py: 0.3 }}
                      >
                        &bull; {item}
                      </Typography>
                    ))}
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                  onClick={() => setDeleteDialogOpen(false)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteProject}
                  color="error"
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: RADIUS.SM,
                  }}
                >
                  Delete Project
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default DashboardPage;
