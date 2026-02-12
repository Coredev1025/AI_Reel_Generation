import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { AppNavBar } from './components/AppNavBar';
import ErrorBoundary from './components/ErrorBoundary';
import { ROUTES } from './constants/routes';
import { GRADIENTS, COLORS } from './constants/theme';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import ProcessingPage from './pages/ProcessingPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import SettingsPage from './pages/SettingsPage';
import PromptManagementPage from './pages/PromptManagementPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import SharedVideoPage from './pages/SharedVideoPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function AppContent() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === ROUTES.SIGN_IN ||
    location.pathname === ROUTES.SIGN_UP ||
    location.pathname === ROUTES.FORGOT_PASSWORD ||
    location.pathname.startsWith('/reset-password');
  const isPublicPage = location.pathname.startsWith('/share/');

  if (isAuthPage) {
    return (
      <Routes>
        <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
        <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
      </Routes>
    );
  }

  if (isPublicPage) {
    return (
      <Routes>
        <Route path="/share/:token" element={<SharedVideoPage />} />
      </Routes>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
        background: GRADIENTS.PAGE_BG,
        position: 'relative',
      }}
    >
      <AppNavBar />
      <ErrorBoundary>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/settings"
            element={
              <ProtectedRoute allowViewer={false}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processing/:projectId/:processingId"
            element={
              <ProtectedRoute>
                <ProcessingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video/:videoId/stream"
            element={
              <ProtectedRoute>
                <VideoPlayerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROMPT_MANAGEMENT}
            element={
              <ProtectedRoute allowViewer={false}>
                <PromptManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROFILE}
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ANALYTICS}
            element={
              <ProtectedRoute>
                <AnalyticsDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.USER_MANAGEMENT}
            element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN}
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
        </Routes>
      </ErrorBoundary>
    </Box>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
