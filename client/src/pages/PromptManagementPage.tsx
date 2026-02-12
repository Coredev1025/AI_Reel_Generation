import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Breadcrumbs,
  Link,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Divider,
  Pagination,
  InputAdornment,
  SelectChangeEvent,
  Paper,
  Avatar,
  Fade,
  Zoom
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  ContentCopy,
  TrendingUp,
  Search,
  Clear,
  AutoAwesome,
  BookmarkBorder,
  Star
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

interface SavedPrompt {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

const PromptManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<SavedPrompt | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadPrompts();
  }, [currentPage, itemsPerPage, searchTerm]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSavedPrompts({
        searchTerm: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      
      // Handle both paginated and non-paginated responses
      if (response.pagination) {
        setPrompts(response.prompts || []);
        setTotalPages(response.pagination.totalPages || 1);
        setTotalItems(response.pagination.totalItems || 0);
      } else {
        // Fallback for non-paginated response
        setPrompts(response.prompts || []);
        setTotalPages(1);
        setTotalItems(response.prompts?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
      showError('Failed to load saved prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrompt = () => {
    setFormData({
      name: '',
      description: ''
    });
    setEditingPrompt(null);
    setAddDialogOpen(true);
  };

  const handleEditPrompt = (prompt: SavedPrompt) => {
    setFormData({
      name: prompt.name,
      description: prompt.description
    });
    setEditingPrompt(prompt);
    setAddDialogOpen(true);
  };

  const handleSavePrompt = async () => {
    try {
      if (!formData.name.trim()) {
        showError('Name is required');
        return;
      }

      if (!formData.description.trim()) {
        showError('Description is required');
        return;
      }

      if (editingPrompt) {
        await apiService.updateSavedPrompt(editingPrompt.id, formData);
        showSuccess('Prompt updated successfully!');
      } else {
        await apiService.createSavedPrompt(formData);
        showSuccess('Prompt created successfully!');
      }

      setAddDialogOpen(false);
      loadPrompts();
    } catch (error) {
      console.error('Failed to save prompt:', error);
      showError('Failed to save prompt. Please try again.');
    }
  };

  const handleDeletePrompt = (prompt: SavedPrompt) => {
    setPromptToDelete(prompt);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!promptToDelete) return;

    try {
      await apiService.deleteSavedPrompt(promptToDelete.id);
      showSuccess('Prompt deleted successfully!');
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
      loadPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      showError('Failed to delete prompt. Please try again.');
    }
  };

  const handleCopyPrompt = (description: string) => {
    navigator.clipboard.writeText(description);
    showInfo('Prompt copied to clipboard!');
  };

  const handleUsePrompt = async (promptId: string) => {
    try {
      await apiService.useSavedPrompt(promptId);
      showInfo('Prompt usage recorded!');
      loadPrompts(); // Refresh to update usage count
    } catch (error) {
      console.error('Failed to record prompt usage:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: GRADIENTS.PAGE_BG,
      py: 4
    }}>
      <Container maxWidth="xl">
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
              <Typography color="text.primary">Prompt Management</Typography>
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
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                      Prompt Management
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                      Manage your saved prompts for video generation
                    </Typography>
                  </Box>
                  <Zoom in timeout={800}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Add />}
                      onClick={handleAddPrompt}
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
                          boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Add New Prompt
                    </Button>
                  </Zoom>
                </Box>
                
                {/* Quick Stats */}
                <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 32, height: 32 }}>
                      <BookmarkBorder sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {totalItems}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Total Prompts
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 32, height: 32 }}>
                      <TrendingUp sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {prompts.reduce((sum, prompt) => sum + (prompt.usage_count || 0), 0)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Total Uses
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 32, height: 32 }}>
                      <Star sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {prompts.filter(p => (p.usage_count || 0) > 0).length}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Used Prompts
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

            {/* Search and Filters */}
            <Fade in timeout={800}>
              <Card sx={{ 
                mb: 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' } }}>
                    {/* Search Input */}
                    <TextField
                      fullWidth
                      placeholder="Search prompts by name or description..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={handleClearSearch}
                              edge="end"
                            >
                              <Clear />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        maxWidth: { xs: '100%', md: '400px' },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                    
                    {/* Items per page selector */}
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>Items per page</InputLabel>
                      <Select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        label="Items per page"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value={6}>6 per page</MenuItem>
                        <MenuItem value={12}>12 per page</MenuItem>
                        <MenuItem value={24}>24 per page</MenuItem>
                        <MenuItem value={48}>48 per page</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            </Fade>

            {/* Stats */}
            <Fade in timeout={1000}>
              <Card sx={{ 
                mb: 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ minWidth: 'fit-content', fontWeight: 600 }}>
                      Saved Prompts:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {totalItems} prompt{totalItems !== 1 ? 's' : ''} found
                      {searchTerm && ` (filtered by "${searchTerm}")`}
                    </Typography>
                    {totalPages > 1 && (
                      <Typography variant="body2" color="text.secondary">
                        • Page {currentPage} of {totalPages}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>

            {/* Prompts Grid */}
            {loading ? (
              <Fade in timeout={1200}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <Typography>Loading prompts...</Typography>
                </Box>
              </Fade>
            ) : prompts.length === 0 ? (
              <Fade in timeout={1200}>
                <Paper sx={{ 
                  p: 8, 
                  textAlign: 'center',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                  <Avatar sx={{ 
                    bgcolor: 'primary.main', 
                    width: 80, 
                    height: 80, 
                    mb: 3, 
                    mx: 'auto',
                    boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)'
                  }}>
                    <AutoAwesome sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                    No prompts found
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                    Create your first prompt to start building amazing video content with AI
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Add />}
                    onClick={handleAddPrompt}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 700,
                      boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(25, 118, 210, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Create First Prompt
                  </Button>
                </Paper>
              </Fade>
            ) : (
              <Grid container spacing={4}>
                {prompts.map((prompt, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={prompt.id}>
                    <Fade in timeout={1200 + (index * 200)}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 4,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, color: 'text.primary' }}>
                              {prompt.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditPrompt(prompt)}
                                sx={{ 
                                  color: 'primary.main',
                                  '&:hover': {
                                    bgcolor: 'primary.50',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePrompt(prompt)}
                                sx={{ 
                                  color: 'error.main',
                                  '&:hover': {
                                    bgcolor: 'error.50',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box sx={{
                            p: 2,
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            border: 1,
                            borderColor: 'grey.200',
                            flex: 1,
                            mb: 2,
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              fontSize: '2rem',
                              color: 'grey.300',
                              fontFamily: 'serif'
                            }
                          }}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                              "{prompt.description}"
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                            <Typography variant="caption" color="text.secondary">
                              Created {formatDate(prompt.created_at)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ContentCopy />}
                                onClick={() => handleCopyPrompt(prompt.description)}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  '&:hover': {
                                    transform: 'translateY(-1px)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Copy
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleUsePrompt(prompt.id)}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                                  '&:hover': {
                                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                                    transform: 'translateY(-1px)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Use
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Fade in timeout={1400}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontSize: '1rem',
                        minWidth: '40px',
                        height: '40px',
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.2)'
                        },
                        transition: 'all 0.2s ease'
                      }
                    }}
                  />
                </Box>
              </Fade>
            )}

        {/* Add/Edit Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Prompt Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter a descriptive name for this prompt..."
                required
              />
              <TextField
                fullWidth
                label="Prompt Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter the camera motion prompt text..."
                multiline
                rows={6}
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSavePrompt} startIcon={<Save />}>
              {editingPrompt ? 'Update' : 'Create'} Prompt
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Prompt</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to delete this prompt? This action cannot be undone.
            </Typography>
            {promptToDelete && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This prompt has been used {promptToDelete.usage_count} times.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDelete}
              startIcon={<Delete />}
            >
              Delete Prompt
            </Button>
          </DialogActions>
            </Dialog>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default PromptManagementPage;
