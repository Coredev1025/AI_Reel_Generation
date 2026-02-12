import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Paper,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  Tabs,
  Tab,
  Chip,
  Stack,
  Container,
  Avatar,
  Menu,
  Breadcrumbs,
  Link,
  TextField,
  Divider,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Settings,
  PlayArrow,
  PhotoLibrary,
  VideoLibrary,
  Download,
  MoreVert,
  ArrowBack,
  Edit,
  Add,
  Create,
  Sort,
  MusicNote,
  Star,
  StarBorder,
  Pause,
  Refresh,
  AutoAwesome,
  Speed,
  Image,
  TrendingUp,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import LoadingProgress from '../components/LoadingProgress';
import { useToast } from '../contexts/ToastContext';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

interface UploadedFile {
  id: string;
  file: File | null;
  preview: string;
  name: string;
  size: number;
  uploadedAt: string;
  imageOrder: number;
}

interface VideoFile {
  id: string;
  name: string;
  thumbnail: string;
  duration: number;
  status: 'processing' | 'completed' | 'error';
  createdAt: string;
  url?: string;
}

interface ProcessingSettings {
  motionStrength: number;
  videoDuration: number;
  musicVolume: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface MusicFile {
  id: string;
  filename: string;
  original_name: string;
  duration: number;
  file_size: number;
  description: string;
  is_default: boolean;
  upload_time: string;
}

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showProjectNameDialog, setShowProjectNameDialog] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  const [showNewVideoDialog, setShowNewVideoDialog] = useState(false);
  const [newVideo, setNewVideo] = useState({
    name: '',
    nameError: '',
    settings: { motionStrength: 0.8, videoDuration: 5, musicVolume: 0.3 }
  });
  const [imageSort, setImageSort] = useState<'name-asc' | 'name-desc' | 'size-asc' | 'size-desc'>('name-asc');
  const [loading, setLoading] = useState(true);
  const [music, setMusic] = useState<MusicFile[]>([]);
  const [musicUploading, setMusicUploading] = useState(false);
  const [musicUploadProgress, setMusicUploadProgress] = useState(0);
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [editMusicDialogOpen, setEditMusicDialogOpen] = useState(false);
  const [editingMusic, setEditingMusic] = useState<MusicFile | null>(null);
  const [videoAnchorEl, setVideoAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [editMusicDescription, setEditMusicDescription] = useState('');
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'image' | 'music' | 'video', id: string, name: string } | null>(null);

  const { showSuccess, showError, showInfo } = useToast();

  const loadFiles = async () => {
    if (!projectId || projectId === 'new') return;

    try {
      const projectData = await apiService.getProject(projectId);

      const transformedImages: UploadedFile[] = projectData.images?.map((image: any) => ({
        id: image.id,
        file: null,
        preview: `/api/images/${image.id}/preview`,
        name: image.original_name || image.filename,
        size: image.file_size || 0,
        uploadedAt: image.upload_time || image.created_at,
        imageOrder: image.image_order || 0
      })) || [];

      setFiles(transformedImages);
    } catch (error) {
      console.error('Failed to load files:', error);
      showError('Failed to load project files');
    }
  };

  const loadVideos = async () => {
    if (!projectId || projectId === 'new') return;

    try {
      console.log('Loading videos for project:', projectId);
      const projectData = await apiService.getProject(projectId);

      const transformedVideos: VideoFile[] = projectData.videos?.map((video: any) => ({
        id: video.id,
        name: video.name || video.filename,
        thumbnail: `/api/videos/${video.id}/thumbnail`,
        duration: video.duration || 0,
        status: video.status === 'completed' ? 'completed' :
          video.status === 'processing' ? 'processing' : 'error',
        createdAt: video.created_at,
        url: `/api/videos/${video.id}/stream`
      })) || [];

      console.log('Loaded videos:', transformedVideos.length);
      setVideos(transformedVideos);
    } catch (error) {
      console.error('Failed to load videos:', error);
      showError('Failed to load project videos');
    }
  };

  useEffect(() => {
    const sortedFiles = [...files].sort((a: UploadedFile, b: UploadedFile) => {
      if (imageSort === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (imageSort === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (imageSort === 'size-asc') {
        return a.size - b.size;
      } else if (imageSort === 'size-desc') {
        return b.size - a.size;
      }
      return 0;
    });

    setFiles(sortedFiles);

    if (projectId && projectId !== 'new' && sortedFiles.length > 0) {
      const imageOrders = sortedFiles.map((file, index) => ({
        id: file.id,
        order: index
      }));

      apiService.updateImageOrders(projectId, imageOrders)
        .then(() => {
          showSuccess('Image order updated.');
        })
        .catch((error) => {
          console.error('Failed to update image order in database:', error);
          showError('Failed to save image order. Please try again.');
        });
    }
  }, [imageSort, projectId]);

  useEffect(() => {
    const loadProjectData = async () => {
      setLoading(true);
      if (projectId === 'new') {
        setShowProjectNameDialog(true);
      } else if (projectId) {
        try {
          const projectData = await apiService.getProject(projectId);
          setProjectName(projectData.name);

          const transformedImages: UploadedFile[] = projectData.images?.map((image: any) => ({
            id: image.id,
            file: null,
            preview: `/api/images/${image.id}/preview`,
            name: image.original_name || image.filename,
            size: image.file_size || 0,
            uploadedAt: image.upload_time || image.created_at,
            imageOrder: image.image_order || 0
          })) || [];

          const transformedVideos: VideoFile[] = projectData.videos?.map((video: any) => ({
            id: video.id,
            name: video.name || video.filename,
            thumbnail: `/api/videos/${video.id}/thumbnail`,
            duration: video.duration || 0,
            status: video.status === 'completed' ? 'completed' :
              video.status === 'processing' ? 'processing' : 'error',
            createdAt: video.created_at,
            url: `/api/videos/${video.id}/stream`
          })) || [];

          setFiles(transformedImages);
          setVideos(transformedVideos);
        } catch (error) {
          console.error('Failed to load project data:', error);
          showError('Failed to load project data');
        }
      } else {
        showError('Invalid project ID');
        navigate('/dashboard');
      }
      setLoading(false);
    };

    loadProjectData();
  }, [projectId, navigate]);

  useEffect(() => {
    if (location.search) {
      const queryParams = new URLSearchParams(location.search);
      const tab = queryParams.get('tab');
      if (tab === 'videos') {
        setTabValue(1);
      }
    }
  }, [location.search]);

  const validateProjectName = async (name: string): Promise<boolean> => {
    if (!name.trim()) {
      setProjectNameError('Project name is required');
      return false;
    }
    if (name.length < 3) {
      setProjectNameError('Project name must be at least 3 characters long');
      return false;
    }
    if (name.length > 50) {
      setProjectNameError('Project name must be less than 50 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      setProjectNameError('Project name can only contain letters, numbers, spaces, hyphens, and underscores');
      return false;
    }

    try {
      const exists = await apiService.checkProjectNameExists(name);
      if (exists.exists) {
        setProjectNameError('A project with this name already exists. Please choose a different name.');
        return false;
      }
    } catch (error) {
      console.error('Error checking project name:', error);
    }

    setProjectNameError('');
    return true;
  };

  const handleProjectNameSubmit = async () => {

    const isValid = await validateProjectName(tempProjectName);
    if (isValid) {
      try {
        const projectData = await apiService.createProject({
          name: tempProjectName,
          description: ''
        });

        setProjectName(tempProjectName);
        setShowProjectNameDialog(false);
        setTempProjectName('');
        setProjectNameError('');

        showSuccess('Project created successfully!');

        if (projectData.name) {
          navigate(`/project/${projectData.name}`);
        }
      } catch (error) {
        console.error('Failed to create project:', error);
        setProjectNameError('Failed to create project. This may be due to a network issue or a duplicate project name. Please check your connection and try a different name if needed.');
      }
    }
  };

  const handleProjectNameCancel = () => {
    setShowProjectNameDialog(false);
    setTempProjectName('');
    setProjectNameError('');
    navigate('/dashboard');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!projectId || projectId === 'new') {
      showError('Please create a project first');
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = acceptedFiles.filter((file) => file.size > MAX_SIZE);
    const validFiles = acceptedFiles.filter((file) => file.size <= MAX_SIZE);

    if (oversizedFiles.length > 0) {
      showError(
        `The following files are too large (max 10MB): ${oversizedFiles
          .map((f) => f.name)
          .join(', ')}`
      );
    }

    if (validFiles.length === 0) {
      showError('No valid files selected');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('photos', file);
      });
      formData.append('projectId', projectId);

      const result = await apiService.uploadPhotos(formData, projectId, (progress) => {
        setUploadProgress(progress);
      });

      showSuccess(`${validFiles.length} photo(s) uploaded successfully!`);
      await loadFiles();
    } catch (error) {
      console.error('Upload error:', error);
      showError('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [projectId, loadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
    },
    maxFiles: 50,
  });

  const removeFile = async (fileId: string) => {
    try {
      await apiService.deleteImage(fileId, projectId || '');
      showSuccess('Photo removed successfully');
      await loadFiles();
    } catch (error) {
      showError('Failed to remove photo. Please try again.');
    }
  };

  const confirmDelete = (type: 'image' | 'music' | 'video', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteConfirmDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'image') {
        await apiService.deleteImage(itemToDelete.id, projectId || '');
        showSuccess('Photo removed successfully');
        await loadFiles();
      } else if (itemToDelete.type === 'music') {
        await apiService.deleteMusic(itemToDelete.id);
        showSuccess('Music removed successfully');
        await loadMusic();
      } else if (itemToDelete.type === 'video') {
        try {
          const result = await apiService.deleteVideo(itemToDelete.id);
          showSuccess('Video removed successfully');
          await loadVideos();
        } catch (videoDeleteError) {
          console.error('Video delete API error:', videoDeleteError);
          throw videoDeleteError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      console.error('Error details:', {
        type: itemToDelete?.type,
        id: itemToDelete?.id,
        name: itemToDelete?.name,
        projectId: projectId,
        error: error
      });

      if (itemToDelete?.type === 'video') {
        const errorResponse = error as any;
        if (errorResponse.response?.status === 404) {
          showError('Video not found. It may have already been deleted.');
        } else if (errorResponse.response?.status === 403) {
          showError('You do not have permission to delete this video.');
        } else if (errorResponse.response?.status >= 500) {
          showError('Server error occurred while deleting video. Please try again.');
        } else {
          showError(`Failed to delete video: ${errorResponse.message || 'Unknown error'}`);
        }
      } else if (itemToDelete?.type === 'image') {
        const errorResponse = error as any;
        if (errorResponse.response?.status === 404) {
          showError('Image not found. It may have already been deleted.');
        } else {
          showError('Failed to remove image. Please try again.');
        }
      } else if (itemToDelete?.type === 'music') {
        const errorResponse = error as any;
        if (errorResponse.response?.status === 404) {
          showError('Music not found. It may have already been deleted.');
        } else {
          showError('Failed to remove music. Please try again.');
        }
      } else {
        showError(`Failed to remove ${itemToDelete?.type}. Please try again.`);
      }
    } finally {
      setDeleteConfirmDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const uploadFiles = async () => {
    if (!projectName) {
      showError('Please set a project name first');
      return;
    }

    if (files.filter(f => f.file).length === 0) {
      showError('Please select at least one photo to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let currentProjectId: string | undefined = projectId;

      if (projectId === 'new') {
        const project = await apiService.createProject({ name: projectName });
        currentProjectId = project.id;
        setProjectName(project.name);
        navigate(`/project/${project.id}`);
      }

      if (files.filter(f => f.file).length > 0) {
        const formData = new FormData();
        formData.append('projectId', currentProjectId || '');

        files.forEach((fileData) => {
          if (fileData.file) { // Only append files that have a File object (new uploads)
            formData.append('photos', fileData.file);
          }
        });

        await apiService.uploadPhotos(formData, currentProjectId || '', (progress) => {
          setUploadProgress(progress);
        });
      }

      if (currentProjectId) {
        try {
          const updatedProjectData = await apiService.getProject(currentProjectId);
          const transformedImages: UploadedFile[] = updatedProjectData.images?.map((image: any) => ({
            id: image.id,
            file: null,
            preview: `/api/images/${image.id}/preview`,
            name: image.original_name || image.filename,
            size: image.file_size || 0,
            uploadedAt: image.upload_time || image.created_at,
            imageOrder: image.image_order || 0
          })) || [];

          const transformedVideos: VideoFile[] = updatedProjectData.videos?.map((video: any) => ({
            id: video.id,
            name: video.name || video.filename,
            thumbnail: `/api/videos/${video.id}/thumbnail`,
            duration: video.duration || 0,
            status: video.status === 'completed' ? 'completed' :
              video.status === 'processing' ? 'processing' : 'error',
            createdAt: video.created_at,
            url: `/api/videos/${video.id}/stream`
          })) || [];

          setFiles(transformedImages);
          setVideos(transformedVideos);
        } catch (refreshError) {
          console.error('Failed to refresh project data:', refreshError);
        }
      }

      setUploading(false);
      if (files.filter(f => f.file).length > 0) {
        showSuccess('Photos uploaded successfully!');
      } else {
        showSuccess('Project created successfully! You can now upload photos.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Failed to upload photos. Please try again.');
      setUploading(false);
    }
  };

  const onMusicDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (music.length > 0) {
      if (!(music[0] instanceof File)) {
        showError('You can only upload one music file at a time.');
        return;
      }
    }
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = acceptedFiles.filter((file) => file.size > MAX_SIZE);
    const validFiles = acceptedFiles.filter((file) => file.size <= MAX_SIZE);
    if (oversizedFiles.length > 0) {
      showError(
        `The following files are too large (max 50MB): ${oversizedFiles.map((f) => f.name).join(', ')}`
      );
    }
    if (validFiles.length === 0) return;
    setMusicUploading(true);
    setMusicUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('music', validFiles[0]);
      formData.append('projectId', projectId || '');
      await apiService.uploadMusic(formData, projectId || '', (progress) => {
        setMusicUploadProgress(progress);
      });
      await loadMusic();
      showSuccess('Music uploaded successfully!');
    } catch (error) {
      showError('Failed to upload music. Please try again.');
      setMusicUploading(false);
      return;
    }
    setMusicUploading(false);
  }, [music]);

  const {
    getRootProps: getMusicRootProps,
    getInputProps: getMusicInputProps,
    isDragActive: isMusicDragActive
  } = useDropzone({
    onDrop: onMusicDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
    },
    maxFiles: 1,
  });

  const createNewVideo = async () => {
    if (!projectId || files.length === 0) {
      showError('Please upload at least one photo before creating a video');
      return;
    }

    const id = projectId;
    const videoSettings = {
      ...newVideo.settings,
      videoName: newVideo.name.trim(),
      imageOrder: files.map(f => f.id),
    };

    try {
      const result = await apiService.startProcessing(id, videoSettings);
      showSuccess('Video processing started! Redirecting to processing page...');
      navigate(`/processing/${projectId}/${result.processingId}`);
    } catch (error) {
      showError('Failed to start video processing. Please try again.');
    }
  };

  const handleNewVideoDialogOpen = () => {
    navigate(`/project/${projectId}/settings`);
  };

  const handleNewVideoDialogClose = () => {
    setShowNewVideoDialog(false);
    setNewVideo(v => ({ ...v, name: '' }));
    setNewVideo(v => ({ ...v, nameError: '' }));
  };

  const cleanupFailedVideo = async () => {
    if (!selectedVideo) return;

    try {
      const projectData = await apiService.getProject(projectId!);
      const processingJob = projectData.processingJobs?.find((job: any) => job.video_id === selectedVideo.id);

      if (processingJob) {
        await apiService.cleanupFailedProcessing(processingJob.id);
        showSuccess('Failed video and processing job cleaned up successfully!');
      } else {
        await apiService.cleanupFailedVideo(selectedVideo.id);
        showSuccess('Failed video cleaned up successfully!');
      }

      await loadVideos();
      handleVideoMenuClose();
    } catch (error: any) {
      console.error('Failed to clean up video:', error);

      if (error.response?.status === 404) {
        showError('Video or processing job not found. It may have already been cleaned up.');
      } else if (error.response?.status === 400) {
        showError('Cannot clean up this video. Only failed videos can be cleaned up.');
      } else {
        showError('Failed to clean up failed video. Please try again.');
      }
    }
  };

  const retryFailedVideo = async () => {
    if (!selectedVideo) return;

    try {
      const projectData = await apiService.getProject(projectId!);
      const processingJob = projectData.processingJobs?.find((job: any) => job.video_id === selectedVideo.id);

      if (processingJob) {
        const result = await apiService.restartProcessing(processingJob.id);
        showSuccess('Video processing restarted successfully!');
        navigate(`/processing/${projectId}/${result.processingId}`);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (time: number) => {
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, file: UploadedFile) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handleVideoMenuClick = (event: React.MouseEvent<HTMLElement>, video: VideoFile) => {
    event.stopPropagation();
    setVideoAnchorEl(event.currentTarget);
    setSelectedVideo(video);
  };

  const handleVideoMenuClose = () => {
    setVideoAnchorEl(null);
    setSelectedVideo(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];

    newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);

    setFiles(newFiles);
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (projectId && projectId !== 'new') {
      const imageOrders = newFiles.map((file, index) => ({
        id: file.id,
        order: index
      }));

      apiService.updateImageOrders(projectId, imageOrders)
        .then(() => {
          showSuccess('Image order updated successfully');
        })
        .catch((error) => {
          console.error('Failed to update image order:', error);
          showError('Failed to save image order. Please try again.');
          loadFiles();
        });
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const loadMusic = async () => {
    try {
      const musicData = await apiService.getProjectMusic(projectId || 'new');
      console.log('musicData', musicData);
      setMusic(musicData);
    } catch (error) {
      showError('Failed to load music');
    }
  };

  const setDefaultMusic = async (musicId: string) => {
    try {
      await apiService.setDefaultMusic(musicId, projectId || 'new');
      showSuccess('Default music updated successfully!');
      await loadMusic();
    } catch (error) {
      showError('Failed to set default music. Please try again.');
    }
  };

  const deleteMusic = async (musicId: string) => {
    try {
      await apiService.deleteMusic(musicId);
      showSuccess('Music deleted successfully');
      await loadMusic();
    } catch (error) {
      showError('Failed to delete music. Please try again.');
    }
  };

  const playMusic = (musicId: string) => {
    if (playingMusicId === musicId) {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        setAudioElement(null);
      }
      setPlayingMusicId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(`/api/music/${musicId}/stream`);
      audio.play();
      setAudioElement(audio);
      setPlayingMusicId(musicId);
      audio.onended = () => {
        setPlayingMusicId(null);
        setAudioElement(null);
      };
    }
  };

  const openEditMusicDialog = (musicFile: MusicFile) => {
    setEditingMusic(musicFile);
    setEditMusicDescription(musicFile.description);
    setEditMusicDialogOpen(true);
  };
  const saveEditMusic = async () => {
    if (!editingMusic) return;
    try {
      await apiService.updateMusic(editingMusic.id, { description: editMusicDescription });
      await loadMusic();
      setEditMusicDialogOpen(false);
      showSuccess('Music description updated!');
    } catch (error) {
      showError('Failed to update music description');
    }
  };
  const formatMusicDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const formatMusicFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  useEffect(() => { if (projectId && projectId !== 'new') loadMusic(); }, [projectId]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <LoadingProgress />
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
      <Container maxWidth="xl">
        <Fade in timeout={600}>
          <Box>
            <Dialog
              open={showProjectNameDialog}
              maxWidth="sm"
              fullWidth
              disableEscapeKeyDown
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.2)'
                }
              }}
            >
              <DialogTitle sx={{
                background: GRADIENTS.PRIMARY,
                color: 'white',
                textAlign: 'center',
                py: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 40, height: 40 }}>
                    <Create sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Create New Project
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 4 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Enter a name for your new project. This will be used to organize your uploaded images and videos.
                </Typography>
                <TextField
                  autoFocus
                  fullWidth
                  label="Project Name"
                  value={tempProjectName}
                  onChange={(e) => {
                    const value = e.target.value;
                    const processedValue = value.split('').map(char => {
                      if (char === ' ') return '';
                      if (/[a-zA-Z0-9]/.test(char)) return char;
                      return '';
                    }).join('');
                    setTempProjectName(processedValue);
                    if (projectNameError) {
                      validateProjectName(e.target.value);
                    }
                  }}
                  onBlur={() => validateProjectName(tempProjectName)}
                  error={!!projectNameError}
                  helperText={projectNameError || 'Enter a descriptive name for your project'}
                  placeholder="e.g., LuxuryVillaDowntown, BeachHouseTour"
                  sx={{
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                  onClick={handleProjectNameCancel}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProjectNameSubmit}
                  variant="contained"
                  disabled={!tempProjectName.trim()}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                    }
                  }}
                >
                  Create Project
                </Button>
              </DialogActions>
            </Dialog>

            {(projectName || projectId !== 'new') && (
              <>
                <Fade in timeout={800}>
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
                    <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                      {projectName}
                    </Typography>
                  </Breadcrumbs>
                </Fade>

                <Fade in timeout={1000}>
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
                            <Typography variant="h3" component="h1" sx={{ fontWeight: 800, color: 'white', mr: 2 }}>
                              {projectName}
                            </Typography>
                            {projectId === 'new' && (
                              <Chip
                                label="New Project"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                            Manage your project images and videos with AI-powered creation
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={2}>
                          <Zoom in timeout={1200}>
                            <Button
                              variant="contained"
                              startIcon={<PlayArrow />}
                              onClick={() => handleNewVideoDialogOpen()}
                              disabled={processing || files.length === 0}
                              sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                fontWeight: 700,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                '&:hover': {
                                  bgcolor: 'grey.100',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                                },
                                '&:disabled': {
                                  bgcolor: 'rgba(255,255,255,0.3)',
                                  color: 'rgba(255,255,255,0.5)'
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {processing ? 'Processing...' : 'Generate Video'}
                            </Button>
                          </Zoom>
                        </Stack>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 32, height: 32 }}>
                            <Image sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {files.length}
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
                              {videos.length}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              Videos
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 32, height: 32 }}>
                            <AutoAwesome sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              AI Ready
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              Status
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

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
                </Fade>

                <Fade in timeout={1200}>
                  <Paper sx={{
                    mb: 4,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}>
                    <Tabs
                      value={tabValue}
                      onChange={handleTabChange}
                      sx={{
                        '& .MuiTab-root': {
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: '1rem',
                          py: 2,
                          px: 3,
                          '&.Mui-selected': {
                            color: 'primary.main'
                          }
                        },
                        '& .MuiTabs-indicator': {
                          height: 3,
                          borderRadius: '3px 3px 0 0',
                          background: GRADIENTS.PRIMARY
                        }
                      }}
                    >
                      <Tab
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{
                              bgcolor: tabValue === 0 ? 'primary.main' : 'grey.300',
                              width: 24,
                              height: 24,
                              mr: 1,
                              boxShadow: tabValue === 0 ? '0 2px 8px rgba(25, 118, 210, 0.3)' : 'none'
                            }}>
                              <PhotoLibrary sx={{ fontSize: 14 }} />
                            </Avatar>
                            Images ({files.length})
                          </Box>
                        }
                      />
                      <Tab
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{
                              bgcolor: tabValue === 1 ? 'primary.main' : 'grey.300',
                              width: 24,
                              height: 24,
                              mr: 1,
                              boxShadow: tabValue === 1 ? '0 2px 8px rgba(25, 118, 210, 0.3)' : 'none'
                            }}>
                              <VideoLibrary sx={{ fontSize: 14 }} />
                            </Avatar>
                            Videos ({videos.length})
                          </Box>
                        }
                      />
                    </Tabs>
                  </Paper>
                </Fade>

                <TabPanel value={tabValue} index={0}>
                  <Fade in timeout={1400}>
                    <Card sx={{
                      mb: 4,
                      borderRadius: 4,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <CardContent sx={{ p: 4 }}>
                         <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mb: 3 }}>
                           <Grid container spacing={4} alignItems="stretch" sx={{ minHeight: 400 }}>
                            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Avatar sx={{
                                  bgcolor: 'primary.main',
                                  mr: 2,
                                  width: 40,
                                  height: 40,
                                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
                                }}>
                                  <PhotoLibrary sx={{ fontSize: 20 }} />
                                </Avatar>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                  Upload Photos
                                </Typography>
                              </Box>
                              <Paper
                                {...getRootProps()}
                                sx={{
                                  p: 6,
                                  textAlign: 'center',
                                  border: '3px dashed',
                                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                                  bgcolor: isDragActive ? 'primary.50' : 'background.paper',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  mb: 3,
                                  minHeight: 320,
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  borderRadius: 4,
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'primary.50',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 32px rgba(25, 118, 210, 0.2)'
                                  },
                                }}
                              >
                                <input {...getInputProps()} />
                                <Avatar sx={{
                                  bgcolor: 'primary.main',
                                  width: 80,
                                  height: 80,
                                  mb: 3,
                                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)'
                                }}>
                                  <PhotoLibrary sx={{ fontSize: 40 }} />
                                </Avatar>
                                {isDragActive ? (
                                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    Drop the photos here...
                                  </Typography>
                                ) : (
                                  <>
                                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                                      Drag & drop photos here, or click to select
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                      Supports JPG, PNG, GIF, BMP, WebP (max 10MB each, up to 50 files)
                                    </Typography>
                                    <Chip
                                      label="Click to browse files"
                                      sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        fontWeight: 600,
                                        px: 2
                                      }}
                                    />
                                  </>
                                )}
                                {uploading && (
                                  <Box sx={{ mb: 2, width: '100%', maxWidth: 300 }}>
                                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                                      Uploading... {Math.round(uploadProgress)}%
                                    </Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={uploadProgress}
                                      sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 4,
                                          background: GRADIENTS.PRIMARY
                                        }
                                      }}
                                    />
                                  </Box>
                                )}

                                <Box sx={{
                                  position: 'absolute',
                                  top: -20,
                                  right: -20,
                                  width: 100,
                                  height: 100,
                                  borderRadius: '50%',
                                  background: 'rgba(25, 118, 210, 0.1)',
                                  zIndex: 0
                                }} />
                                <Box sx={{
                                  position: 'absolute',
                                  bottom: -30,
                                  left: -30,
                                  width: 80,
                                  height: 80,
                                  borderRadius: '50%',
                                  background: 'rgba(156, 39, 176, 0.1)',
                                  zIndex: 0
                                }} />
                              </Paper>
                             </Grid>
                             <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                               <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                 <Avatar sx={{ bgcolor: 'success.main', mr: 2, boxShadow: 2 }}>
                                   <MusicNote />
                                 </Avatar>
                                 <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                   Background Music
                                 </Typography>
                               </Box>
                              <Paper
                                {...getMusicRootProps()}
                                sx={{
                                  p: 6,
                                  textAlign: 'center',
                                  border: '3px dashed',
                                  borderColor: isMusicDragActive ? 'primary.main' : 'grey.300',
                                  bgcolor: isMusicDragActive ? 'primary.50' : 'background.paper',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  mb: 3,
                                  minHeight: 320,
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  borderRadius: 4,
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'primary.50',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 32px rgba(25, 118, 210, 0.2)'
                                  },
                                }}
                              >
                                <input {...getMusicInputProps()} />
                                <Avatar
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: 'success.main',
                                    mb: 3,
                                    boxShadow: 3,
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      transition: 'transform 0.2s ease'
                                    }
                                  }}
                                >
                                  <MusicNote sx={{ fontSize: 40, color: 'white' }} />
                                </Avatar>
                                {isMusicDragActive ? (
                                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    Drop the music file here...
                                  </Typography>
                                ) : (
                                  <>
                                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                                      Drag & drop music here, or click to select
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                      Supports MP3, WAV, OGG, M4A, AAC (max 50MB)
                                    </Typography>
                                    <Chip
                                      label="Click to browse files"
                                      variant="filled"
                                      sx={{
                                        bgcolor: 'success.main',
                                        color: 'white',
                                        fontWeight: 600,
                                        px: 3,
                                        py: 1,
                                        '&:hover': {
                                          bgcolor: 'success.dark',
                                          transform: 'translateY(-1px)',
                                          boxShadow: 2
                                        }
                                      }}
                                    />
                                  </>
                                )}
                                {music.length > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, cursor: 'pointer' }} onClick={(e) => {
                                    e.stopPropagation();
                                    openEditMusicDialog(music[0]);
                                  }}>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2,
                                        bgcolor: 'grey.100',
                                        boxShadow: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        position: 'relative',
                                        ':hover .music-remove-btn': { opacity: 1 }
                                      }}
                                    >
                                      {music[0] instanceof File ? (
                                        <>
                                          {music[0].name} ({formatMusicFileSize(music[0].size)})
                                        </>
                                      ) : (
                                        <>
                                          {music[0].original_name} ({formatMusicFileSize(music[0].file_size)}, {formatMusicDuration(music[0].duration)})
                                        </>
                                      )}
                                      <IconButton
                                        className="music-remove-btn"
                                        size="small"
                                        sx={{
                                          ml: 1,
                                          opacity: 0,
                                          transition: 'opacity 0.2s',
                                          position: 'absolute',
                                          right: 4,
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          bgcolor: 'rgba(255,255,255,0.9)',
                                          '&:hover': {
                                            bgcolor: 'rgba(255,255,255,1)',
                                            transform: 'translateY(-50%) scale(1.1)'
                                          }
                                        }}
                                        onClick={e => {
                                          e.stopPropagation();
                                          if (music[0] && !(music[0] instanceof File)) {
                                            confirmDelete('music', music[0].id, music[0].original_name);
                                          } else {
                                            setMusic([]);
                                          }
                                        }}
                                        aria-label="Remove music"
                                        title="Delete music"
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Typography>
                                  </Box>
                                )}
                                {musicUploading && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body1" gutterBottom>
                                      Uploading... {Math.round(musicUploadProgress)}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={musicUploadProgress} />
                                  </Box>
                                )}

                                <Box sx={{
                                  position: 'absolute',
                                  top: -20,
                                  right: -20,
                                  width: 100,
                                  height: 100,
                                  borderRadius: '50%',
                                  background: 'rgba(76, 175, 80, 0.1)',
                                  zIndex: 0
                                }} />
                                <Box sx={{
                                  position: 'absolute',
                                  bottom: -30,
                                  left: -30,
                                  width: 80,
                                  height: 80,
                                  borderRadius: '50%',
                                  background: 'rgba(33, 150, 243, 0.1)',
                                  zIndex: 0
                                }} />
                              </Paper>
                            </Grid>
                          </Grid>
                        </Box>
                      </CardContent>
                      <CardContent>
                        {files.length > 0 && (
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                              <Typography variant="h6">
                                Uploaded Photos ({files.length})
                              </Typography>
                              <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id="sort-images-label"><Sort sx={{ mr: 1, fontSize: 18 }} />Sort By</InputLabel>
                                <Select
                                  labelId="sort-images-label"
                                  value={imageSort}
                                  label={<><Sort sx={{ mr: 1, fontSize: 18 }} />Sort By</>}
                                  onChange={e => setImageSort(e.target.value as any)}
                                >
                                  <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                                  <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                                  <MenuItem value="size-asc">Size (Smallest)</MenuItem>
                                  <MenuItem value="size-desc">Size (Largest)</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                              {files.map((file, index) => (
                                <Grid item xs={6} sm={4} md={3} lg={2} key={file.id}>
                                  <Card
                                    sx={{
                                      position: 'relative',
                                      opacity: draggedIndex === index ? 0.5 : 1,
                                      transform: dragOverIndex === index ? 'scale(1.05)' : 'scale(1)',
                                      transition: 'all 0.2s ease',
                                      border: dragOverIndex === index ? '2px dashed #1976d2' : 'none',
                                      cursor: 'grab',
                                      '&:active': {
                                        cursor: 'grabbing'
                                      }
                                    }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                  >
                                    <Box
                                      component="img"
                                      src={file.preview}
                                      alt={file.name}
                                      sx={{
                                        width: '100%',
                                        height: 120,
                                        objectFit: 'cover',
                                        pointerEvents: 'none',
                                      }}
                                      onError={(e) => {
                                        console.error('Failed to load image:', file.name);
                                      }}
                                    />
                                    <Box sx={{ p: 1 }}>
                                      <Typography variant="caption" noWrap title={file.name}>
                                        {file.name}
                                      </Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        {formatFileSize(file.size)}
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        display: 'flex',
                                        gap: 0.5
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        onClick={(e) => confirmDelete('image', file.id, file.name)}
                                        sx={{
                                          bgcolor: 'rgba(255,255,255,0.9)',
                                          '&:hover': {
                                            bgcolor: 'rgba(255,255,255,1)',
                                            transform: 'scale(1.1)'
                                          },
                                          transition: 'all 0.2s ease'
                                        }}
                                        title="Delete image"
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                        <Dialog open={editMusicDialogOpen} onClose={() => setEditMusicDialogOpen(false)} maxWidth="sm" fullWidth>
                          <DialogTitle>Edit Music Description</DialogTitle>
                          <DialogContent>
                            <TextField
                              autoFocus
                              margin="dense"
                              label="Description"
                              fullWidth
                              multiline
                              rows={3}
                              value={editMusicDescription}
                              onChange={(e) => setEditMusicDescription(e.target.value)}
                            />
                          </DialogContent>
                          <DialogActions>
                            <Button onClick={() => setEditMusicDialogOpen(false)}>Cancel</Button>
                            <Button onClick={saveEditMusic} variant="contained">Save</Button>
                          </DialogActions>
                        </Dialog>
                      </CardContent>
                    </Card>
                  </Fade>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">
                      Project Videos ({videos.length})
                    </Typography>
                  </Box>

                  {videos.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center' }}>
                      <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h5" gutterBottom>
                        No videos yet
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {files.length === 0
                          ? 'Upload photos first to create videos'
                          : 'Create your first video with the photos you\'ve uploaded'
                        }
                      </Typography>
                      {files.length === 0 ? (
                        <Button
                          variant="contained"
                          onClick={() => setTabValue(0)}
                          startIcon={<PhotoLibrary />}
                        >
                          Go to Images
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNewVideoDialogOpen}
                          startIcon={<Create />}
                        >
                          Create First Video
                        </Button>
                      )}
                    </Paper>
                  ) : (
                    <Grid container spacing={3}>
                      {videos.map((video) => (
                        <Grid item xs={12} sm={6} md={4} key={video.id}>
                          <Card>
                            <CardMedia
                              component="div"
                              sx={{
                                height: 200,
                                bgcolor: 'grey.200',
                                backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative'
                              }}
                            >
                              {video.status === 'completed' && (
                                <>
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      display: 'flex',
                                      gap: 1
                                    }}

                                  >
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'primary.main', width: 56, height: 56, cursor: 'pointer' }} onClick={() => navigate(`/video/${video.id}/stream`)}>
                                      <PlayArrow sx={{ fontSize: 28 }} />
                                    </Avatar>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'primary.main', width: 56, height: 56, cursor: 'pointer' }} onClick={() => {
                                      apiService.downloadVideo(video.id);
                                      showSuccess('Video downloaded successfully!');
                                    }}>
                                      <Download sx={{ fontSize: 28 }} />
                                    </Avatar>
                                  </Box>
                                </>
                              )}
                              {video.status === 'processing' && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                >
                                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'primary.main', width: 56, height: 56 }}>
                                    <LinearProgress sx={{ width: 40, height: 4 }} />
                                  </Avatar>
                                </Box>
                              )}
                            </CardMedia>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" gutterBottom>
                                    {video.name.replace(/_\d+\.mp4$/, '')}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Created {new Date(video.createdAt).toLocaleDateString()}
                                  </Typography>
                                  {video.duration > 0 && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Duration: {formatDuration(video.duration)}
                                    </Typography>
                                  )}
                                  <Chip
                                    label={video.status}
                                    color={video.status === 'completed' ? 'success' : video.status === 'processing' ? 'primary' : 'error'}
                                    size="small"
                                    sx={{ mt: 1 }}
                                  />
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleVideoMenuClick(e, video)}
                                >
                                  <MoreVert />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  <Menu
                    anchorEl={videoAnchorEl}
                    open={Boolean(videoAnchorEl)}
                    onClose={handleVideoMenuClose}
                  >
                    {selectedVideo?.status === 'completed' && (
                      <MenuItem onClick={() => {
                        if (selectedVideo) {
                          navigate(`/video/${selectedVideo.id}/stream`);
                        }
                        handleVideoMenuClose();
                      }}>
                        <PlayArrow sx={{ mr: 1 }} />
                        Play Video
                      </MenuItem>
                    )}
                    {selectedVideo?.status === 'completed' && (
                      <MenuItem onClick={() => {
                        if (selectedVideo) {
                          apiService.downloadVideo(selectedVideo.id);
                          showSuccess('Video downloaded successfully!');
                        }
                        handleVideoMenuClose();
                      }}>
                        <Download sx={{ mr: 1 }} />
                        Download Video
                      </MenuItem>
                    )}
                    {selectedVideo?.status === 'error' && (
                      <MenuItem onClick={() => {
                        retryFailedVideo();
                        handleVideoMenuClose();
                      }}>
                        <Refresh sx={{ mr: 1 }} />
                        Retry Processing
                      </MenuItem>
                    )}
                    {selectedVideo?.status === 'error' && (
                      <MenuItem onClick={cleanupFailedVideo}>
                        <Delete sx={{ mr: 1 }} />
                        Clean Up Failed Video
                      </MenuItem>
                    )}
                    {selectedVideo?.status === 'completed' && (
                      <MenuItem onClick={() => {
                        if (selectedVideo) {
                          confirmDelete('video', selectedVideo.id, selectedVideo.name);
                          handleVideoMenuClose();
                        }
                      }}>
                        <Delete sx={{ mr: 1 }} />
                        Delete Video
                      </MenuItem>
                    )}
                  </Menu>
                </TabPanel>

                <Dialog open={showNewVideoDialog} onClose={handleNewVideoDialogClose} maxWidth="md" fullWidth>
                  <DialogTitle>Create New Video</DialogTitle>
                  <DialogContent>
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Video Name"
                        value={newVideo.name}
                        onChange={(e) => {
                          setNewVideo(v => ({ ...v, name: e.target.value }));
                          if (newVideo.nameError) {
                            setNewVideo(v => ({ ...v, nameError: '' }));
                          }
                        }}
                        error={!!newVideo.nameError}
                        helperText={newVideo.nameError || 'Give your video a descriptive name'}
                        placeholder="e.g., Luxury Villa Tour, Modern Apartment Showcase"
                        sx={{ mb: 3 }}
                      />

                      <Divider sx={{ my: 3 }} />

                      <Typography variant="h6" gutterBottom>
                        Video Settings
                      </Typography>

                      <Box sx={{ mt: 3 }}>
                        <Typography gutterBottom>Video Duration (seconds)</Typography>
                        <Slider
                          value={newVideo.settings.videoDuration}
                          onChange={(_, value) => setNewVideo(v => ({ ...v, settings: { ...v.settings, videoDuration: value as number } }))}
                          min={5}
                          max={10}
                          step={5}
                          marks
                          valueLabelDisplay="auto"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Total duration of the final video
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 3 }}>
                        <Typography gutterBottom>Music Volume</Typography>
                        <Slider
                          value={newVideo.settings.musicVolume}
                          onChange={(_, value) => setNewVideo(v => ({ ...v, settings: { ...v.settings, musicVolume: value as number } }))}
                          min={0}
                          max={1}
                          step={0.1}
                          marks
                          valueLabelDisplay="auto"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Background music volume level
                        </Typography>
                      </Box>
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleNewVideoDialogClose}>Cancel</Button>
                    <Button
                      variant="contained"
                      onClick={createNewVideo}
                      disabled={processing || !newVideo.name.trim()}
                      startIcon={processing ? <LinearProgress sx={{ width: 16, height: 16 }} /> : <Create />}
                    >
                      {processing ? 'Creating...' : 'Create Video'}
                    </Button>
                  </DialogActions>
                </Dialog>

                <Dialog open={deleteConfirmDialogOpen} onClose={() => setDeleteConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
                  <DialogTitle>Confirm Delete</DialogTitle>
                  <DialogContent>
                    <Typography>
                      Are you sure you want to delete this {itemToDelete?.type}?
                    </Typography>
                    {itemToDelete && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {itemToDelete.name}
                      </Typography>
                    )}
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                      This action cannot be undone.
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setDeleteConfirmDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">Delete</Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ProjectPage; 