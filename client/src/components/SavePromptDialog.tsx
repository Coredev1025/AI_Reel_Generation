import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { BookmarkBorder, Save } from '@mui/icons-material';

interface SavePromptDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  initialDescription?: string;
  imageName?: string;
}

const SavePromptDialog: React.FC<SavePromptDialogProps> = ({
  open,
  onClose,
  onSave,
  initialDescription = '',
  imageName
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Update description when dialog opens
  useEffect(() => {
    if (open && initialDescription) {
      setDescription(initialDescription);
      // Auto-generate name from description
      const autoName = initialDescription.trim().substring(0, 50) + (initialDescription.length > 50 ? '...' : '');
      setName(autoName);
    }
  }, [open, initialDescription]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setError('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a prompt name');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a prompt description');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(name.trim(), description.trim());
      onClose();
    } catch (err) {
      setError('Failed to save prompt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <BookmarkBorder color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Save Prompt
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {imageName && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Saving prompt for: <strong>{imageName}</strong>
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            label="Prompt Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a descriptive name for this prompt"
            variant="outlined"
            disabled={saving}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            helperText="Choose a memorable name to easily identify this prompt later"
          />
          
          <TextField
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            label="Prompt Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter the prompt description..."
            variant="outlined"
            disabled={saving}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            helperText="This is the actual prompt text that will be used for video generation"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={saving}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={saving ? <Save /> : <BookmarkBorder />}
          disabled={saving || !name.trim() || !description.trim()}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
            }
          }}
        >
          {saving ? 'Saving...' : 'Save Prompt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SavePromptDialog;
