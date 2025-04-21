import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Typography,
  ListItemButton,
  useTheme,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Support as SupportIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  People as ClientsIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { logout } from '../store/slices/authSlice';
import Logo from './Logo';

const drawerWidth = 260;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin } = useSelector((state) => state.auth);
  const theme = useTheme();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin/calendar') {
       return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = isAdmin ? [
    { text: 'Tickets', icon: <SupportIcon />, path: '/admin' },
    { text: 'Calendar', icon: <CalendarMonthIcon />, path: '/admin/calendar' },
    { text: 'Clients', icon: <ClientsIcon />, path: '/admin/clients' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' }
  ] : [
    { text: 'Tickets', icon: <SupportIcon />, path: '/tickets' },
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'center',
        py: 2,
        pl: 3,
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        minHeight: 64,
        borderRadius: 0,
        position: 'relative'
      }}>
        <Logo width={130} variant="sidebar" />
      </Box>
      <Box sx={{ flexGrow: 1, mt: 2 }}>
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem 
                key={item.text} 
                disablePadding
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: '10px',
                    mx: 0,
                    backgroundColor: active ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                    '&:hover': {
                      backgroundColor: active 
                        ? 'rgba(25, 118, 210, 0.18)' 
                        : 'rgba(0, 0, 0, 0.05)'
                    },
                    py: 1.2,
                    pl: 2,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: active ? theme.palette.primary.main : 'inherit',
                    minWidth: 36
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: active ? 600 : 400,
                          color: active ? theme.palette.primary.main : 'inherit'
                        }}
                      >
                        {item.text}
                      </Typography>
                    } 
                  />
                  {active && (
                    <Box 
                      sx={{ 
                        width: 4, 
                        height: 28, 
                        backgroundColor: theme.palette.primary.main,
                        position: 'absolute',
                        left: 0,
                        borderRadius: '0 4px 4px 0'
                      }} 
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <Box sx={{ p: 3, mt: 'auto' }}>
        <Divider sx={{ mb: 2, opacity: 0.6 }} />
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.07)'
            },
            position: 'relative'
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 42,
              height: 42
            }}
          >
            {user?.firstName?.[0]}
          </Avatar>
          <Box sx={{ ml: 1.5, flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isAdmin ? 'Administrator' : 'Client'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            aria-controls="account-menu"
            aria-haspopup="true"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 180
              }
            }}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error' }} />
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)'
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: 'none'
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f5f7fa',
          minHeight: '100vh'
        }}
      >
        <Box
          sx={{
            backgroundColor: '#f0f4f8',
            borderBottom: '1px solid #e0e0e0',
            py: 1.5,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            backgroundColor: 'white',
            px: 2,
            py: 0.8,
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 500,
                letterSpacing: '0.5px',
                fontStyle: 'italic'
              }}
            >
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;