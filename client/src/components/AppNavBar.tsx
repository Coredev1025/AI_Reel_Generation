import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Avatar,
  Fade,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home,
  Dashboard,
  Settings,
  Login,
  Logout,
  People,
  Menu as MenuIcon,
  Person,
  BarChart,
  AdminPanelSettings,
  SmartDisplay,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: Dashboard },
  { path: ROUTES.PROMPT_MANAGEMENT, label: 'Prompts', icon: Settings },
] as const;

interface NavButtonProps {
  path: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onNavigate: (path: string) => void;
}

function NavButton({ path, label, icon: Icon, isActive, onNavigate }: NavButtonProps) {
  return (
    <Button
      variant={isActive ? 'contained' : 'text'}
      startIcon={<Icon sx={{ fontSize: 18 }} />}
      onClick={() => onNavigate(path)}
      sx={{
        borderRadius: RADIUS.SM,
        px: 2.5,
        py: 0.8,
        fontWeight: 600,
        textTransform: 'none',
        fontSize: '0.9rem',
        minHeight: 36,
        ...(isActive && {
          background: GRADIENTS.PRIMARY,
          boxShadow: SHADOWS.NAV_ACTIVE,
          color: 'white',
          '&:hover': {
            background: GRADIENTS.PRIMARY_HOVER,
            boxShadow: SHADOWS.NAV_ACTIVE_HOVER,
          },
        }),
        ...(!isActive && {
          color: 'text.secondary',
          '&:hover': {
            bgcolor: `${COLORS.PRIMARY}08`,
            color: COLORS.PRIMARY,
          },
        }),
      }}
    >
      {label}
    </Button>
  );
}

export function AppNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { isAuthenticated, user, logout } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const userMenuOpen = Boolean(userMenuAnchor);

  const isActiveRoute = (path: string) => {
    if (path === ROUTES.HOME) return location.pathname === ROUTES.HOME;
    return location.pathname.startsWith(path);
  };

  const handleCloseUserMenu = () => setUserMenuAnchor(null);

  const handleUserMenuAction = (action: () => void) => {
    handleCloseUserMenu();
    action();
  };

  const handleMobileNav = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  const mobileDrawerContent = (
    <Box sx={{ width: 280 }} role="presentation">
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SmartDisplay sx={{ color: COLORS.PRIMARY, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.PRIMARY }}>
            ReelBuilder
          </Typography>
        </Box>
      </Box>
      <List sx={{ py: 1 }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <ListItemButton
            key={path}
            selected={isActiveRoute(path)}
            onClick={() => handleMobileNav(path)}
            sx={{
              py: 1.5,
              mx: 1,
              borderRadius: RADIUS.SM,
              mb: 0.5,
              '&.Mui-selected': {
                background: `${COLORS.PRIMARY}12`,
                color: COLORS.PRIMARY,
                '&:hover': { background: `${COLORS.PRIMARY}18` },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon color={isActiveRoute(path) ? 'primary' : 'action'} />
            </ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ mx: 2 }} />
      <List sx={{ py: 1 }}>
        {isAuthenticated ? (
          <>
            <ListItemButton
              onClick={() => handleMobileNav(ROUTES.PROFILE)}
              sx={{ py: 1.5, mx: 1, borderRadius: RADIUS.SM }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: GRADIENTS.PRIMARY,
                  }}
                >
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={user?.name || user?.email || 'User'}
                primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
              />
            </ListItemButton>
            {user?.role === 'admin' && (
              <ListItemButton
                onClick={() => handleMobileNav(ROUTES.USER_MANAGEMENT)}
                sx={{ py: 1.5, mx: 1, borderRadius: RADIUS.SM }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <People />
                </ListItemIcon>
                <ListItemText primary="User Management" primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            )}
            <ListItemButton
              onClick={() => handleUserMenuAction(logout)}
              sx={{ py: 1.5, mx: 1, borderRadius: RADIUS.SM }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Sign out" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </>
        ) : (
          <ListItemButton
            onClick={() => handleMobileNav(ROUTES.SIGN_IN)}
            sx={{
              py: 1.5,
              mx: 1,
              borderRadius: RADIUS.SM,
              background: GRADIENTS.PRIMARY,
              color: 'white',
              '&:hover': { background: GRADIENTS.PRIMARY_HOVER, color: 'white' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <Login />
            </ListItemIcon>
            <ListItemText primary="Get Started" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: SHADOWS.NAV,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ py: 0.5, minHeight: { xs: 56, md: 64 } }} disableGutters>
            {/* Logo */}
            <Fade in timeout={500}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  mr: { xs: 1, sm: 4 },
                  transition: 'opacity 0.2s ease',
                  '&:hover': { opacity: 0.8 },
                }}
                onClick={() => navigate(ROUTES.HOME)}
              >
                <SmartDisplay
                  sx={{
                    color: COLORS.PRIMARY,
                    fontSize: { xs: 28, sm: 32 },
                    mr: 1,
                  }}
                />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.1rem', sm: '1.3rem' },
                    color: COLORS.DARK,
                    letterSpacing: '-0.3px',
                  }}
                >
                  Reel
                  <Box component="span" sx={{ color: COLORS.PRIMARY }}>
                    Builder
                  </Box>
                </Typography>
              </Box>
            </Fade>

            <Box sx={{ flexGrow: 1 }} />

            {/* Desktop nav */}
            <Fade in timeout={600}>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center' }}>
                {NAV_ITEMS.map(({ path, label, icon }) => (
                  <NavButton
                    key={path}
                    path={path}
                    label={label}
                    icon={icon}
                    isActive={isActiveRoute(path)}
                    onNavigate={navigate}
                  />
                ))}

                {isAuthenticated ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1.5 }}>
                    <Button
                      onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2,
                        py: 0.8,
                        borderRadius: RADIUS.SM,
                        background: GRADIENTS.USER_BUTTON_BG,
                        border: `1px solid ${COLORS.PRIMARY}20`,
                        textTransform: 'none',
                        '&:hover': {
                          background: GRADIENTS.USER_BUTTON_BG_HOVER,
                          borderColor: `${COLORS.PRIMARY}35`,
                        },
                      }}
                      aria-controls={userMenuOpen ? 'user-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={userMenuOpen ? 'true' : undefined}
                    >
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: GRADIENTS.PRIMARY,
                        }}
                      >
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user?.name || user?.email || 'User'}
                      </Typography>
                    </Button>
                    <Menu
                      id="user-menu"
                      anchorEl={userMenuAnchor}
                      open={userMenuOpen}
                      onClose={handleCloseUserMenu}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 200,
                          borderRadius: RADIUS.MD,
                          boxShadow: SHADOWS.USER_MENU,
                          border: '1px solid rgba(0,0,0,0.06)',
                        },
                      }}
                    >
                      <MenuItem
                        onClick={() => handleUserMenuAction(() => navigate(ROUTES.PROFILE))}
                        sx={{ py: 1.5, gap: 1.5, fontWeight: 600, fontSize: '0.9rem' }}
                      >
                        <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
                        Profile
                      </MenuItem>
                      {(user?.role === 'admin' || user?.role === 'user') && (
                        <MenuItem
                          onClick={() => handleUserMenuAction(() => navigate(ROUTES.ANALYTICS))}
                          sx={{ py: 1.5, gap: 1.5, fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          <BarChart sx={{ fontSize: 20, color: 'text.secondary' }} />
                          Analytics
                        </MenuItem>
                      )}
                      {user?.role === 'admin' && (
                        <MenuItem
                          onClick={() =>
                            handleUserMenuAction(() => navigate(ROUTES.USER_MANAGEMENT))
                          }
                          sx={{ py: 1.5, gap: 1.5, fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          <People sx={{ fontSize: 20, color: 'text.secondary' }} />
                          User Management
                        </MenuItem>
                      )}
                      {user?.role === 'admin' && (
                        <MenuItem
                          onClick={() => handleUserMenuAction(() => navigate(ROUTES.ADMIN))}
                          sx={{ py: 1.5, gap: 1.5, fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          <AdminPanelSettings sx={{ fontSize: 20, color: 'text.secondary' }} />
                          Admin Panel
                        </MenuItem>
                      )}
                      <Divider sx={{ my: 0.5 }} />
                      <MenuItem
                        onClick={() => handleUserMenuAction(logout)}
                        sx={{ py: 1.5, gap: 1.5, fontWeight: 600, fontSize: '0.9rem', color: 'error.main' }}
                      >
                        <Logout sx={{ fontSize: 20 }} />
                        Sign out
                      </MenuItem>
                    </Menu>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Login />}
                    onClick={() => navigate(ROUTES.SIGN_IN)}
                    sx={{
                      borderRadius: RADIUS.SM,
                      px: 3,
                      py: 0.8,
                      ml: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      background: GRADIENTS.PRIMARY,
                      boxShadow: SHADOWS.BUTTON,
                      '&:hover': {
                        background: GRADIENTS.PRIMARY_HOVER,
                        boxShadow: SHADOWS.BUTTON_HOVER,
                      },
                    }}
                  >
                    Get Started
                  </Button>
                )}
              </Box>
            </Fade>

            {/* Mobile menu button */}
            <IconButton
              aria-label="Open menu"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: 'text.primary',
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {mobileDrawerContent}
      </Drawer>
    </>
  );
}
