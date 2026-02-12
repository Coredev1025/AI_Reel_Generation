import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowViewer?: boolean;
}

export function ProtectedRoute({ children, allowViewer = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.SIGN_IN} state={{ from: location }} replace />;
  }

  // Viewer role restrictions: viewers can view but not create/edit/delete
  // The actual enforcement happens at the API level; here we just allow/deny page access
  if (user?.role === 'viewer' && !allowViewer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', p: 4 }}>
        <Typography color="text.secondary" variant="h6">
          You have viewer access only. Contact an admin to get full access.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
