import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Person as ProfileIcon,
  Lock as LockIcon
} from '@mui/icons-material';

const drawerWidth = 250;
const collapsedDrawerWidth = 64;

const GenericDrawer = ({ 
  title = "BRIGHTWAY",
  subtitle = "Portal",
  menuItems = [],
  bottomMenuItems = [],
  onLogout = () => {},
  open: controlledOpen,
  onToggle,
  profilePath = null,
  changePasswordPath = null
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalOpen, setInternalOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (value) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Toggle expanded state for menu groups
  const handleGroupToggle = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Check if any child is active
  const isGroupActive = (children) => {
    if (!children) return false;
    return children.some(child => 
      location.pathname === child.path || 
      location.pathname.startsWith(child.path + '/')
    );
  };

  // Auto-expand groups with active children
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children && isGroupActive(item.children)) {
        const groupKey = item.groupKey || item.label;
        setExpandedGroups(prev => ({
          ...prev,
          [groupKey]: true
        }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleNavigation = (path) => {
    // Clear any stepper form data before navigation to prevent conflicts
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('stepperForm_')) {
        sessionStorage.removeItem(key);
      }
    });

    // Force full page reload to ensure clean navigation
    setTimeout(() => {
      window.location.href = path;
    }, 50);
  };

  const handleLogout = () => {
    onLogout();
  };

  const currentWidth = isOpen ? drawerWidth : collapsedDrawerWidth;

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ 
          minHeight: '64px',
          height: '64px',
          display: 'flex',
          flexDirection: isOpen ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          px: isOpen ? 2 : 1,
          py: 1,
          textAlign: 'center', 
          borderBottom: 1, 
          borderColor: 'divider',
          background: 'var(--color-primary)',
          color: 'white',
          position: 'relative'
        }}>
          {isOpen ? (
            <>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  letterSpacing: '0.05em',
                  mb: 0.5,
                  lineHeight: 1.2
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  lineHeight: 1
                }}
              >
                {subtitle}
              </Typography>
              <Tooltip title="Thu gọn" placement="right">
                <IconButton
                  onClick={() => setIsOpen(!isOpen)}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                  size="small"
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Mở rộng" placement="right">
              <IconButton
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                  color: 'white',
                  width: '100%',
                  height: '100%',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
                size="large"
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </motion.div>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        <AnimatePresence>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const groupKey = item.groupKey || item.label;
            const isExpanded = expandedGroups[groupKey] || false;
            const isGroupActiveState = hasChildren ? isGroupActive(item.children) : false;
            const isActive = !hasChildren && (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
            
            // If item has children, render as accordion group
            if (hasChildren) {
              return (
                <motion.div
                  key={groupKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <ListItem disablePadding>
                    <Tooltip title={!isOpen ? item.label : ''} placement="right">
                      <ListItemButton
                        onClick={() => {
                          if (!isOpen) {
                            setIsOpen(true);
                          } else {
                            handleGroupToggle(groupKey);
                          }
                        }}
                        component={motion.div}
                        whileHover={isOpen ? { x: 4 } : { scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        sx={{
                          mx: 1,
                          my: 0.5,
                          borderRadius: 2,
                          backgroundColor: isGroupActiveState 
                            ? 'var(--color-primary-100)' 
                            : 'transparent',
                          color: isGroupActiveState 
                            ? 'var(--color-primary-dark)' 
                            : 'var(--text-primary)',
                          fontWeight: isGroupActiveState ? 600 : 500,
                          transition: 'all 0.2s ease',
                          justifyContent: isOpen ? 'flex-start' : 'center',
                          px: isOpen ? 2 : 1,
                          '&:hover': {
                            backgroundColor: isGroupActiveState 
                              ? 'var(--color-primary-100)' 
                              : 'var(--bg-secondary)',
                            transform: isOpen ? 'translateX(4px)' : 'scale(1.05)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ 
                          color: isGroupActiveState 
                            ? 'var(--color-primary-dark)' 
                            : 'var(--text-secondary)',
                          minWidth: isOpen ? 40 : 'auto',
                          justifyContent: isOpen ? 'flex-start' : 'center',
                          mr: isOpen ? 0 : 0
                        }}>
                          <Icon />
                        </ListItemIcon>
                        {isOpen && (
                          <>
                            <ListItemText 
                              primary={item.label}
                              primaryTypographyProps={{
                                fontSize: '0.95rem',
                                fontWeight: isGroupActiveState ? 600 : 500
                              }}
                            />
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRightIcon sx={{ fontSize: '1.2rem' }} />
                            </motion.div>
                          </>
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  {isOpen && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.children.map((child, childIndex) => {
                          const ChildIcon = child.icon;
                          const isChildActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
                          
                          return (
                            <ListItem key={child.path} disablePadding>
                              <Tooltip title={child.label} placement="right">
                                <ListItemButton
                                  onClick={() => handleNavigation(child.path)}
                                  component={motion.div}
                                  whileHover={{ x: 4 }}
                                  whileTap={{ scale: 0.98 }}
                                  sx={{
                                    mx: 1,
                                    my: 0.25,
                                    ml: isOpen ? 4 : 1,
                                    borderRadius: 2,
                                    backgroundColor: isChildActive 
                                      ? 'var(--color-primary-100)' 
                                      : 'transparent',
                                    color: isChildActive 
                                      ? 'var(--color-primary-dark)' 
                                      : 'var(--text-primary)',
                                    fontWeight: isChildActive ? 600 : 400,
                                    transition: 'all 0.2s ease',
                                    justifyContent: 'flex-start',
                                    px: 2,
                                    py: 0.75,
                                    '&:hover': {
                                      backgroundColor: isChildActive 
                                        ? 'var(--color-primary-100)' 
                                        : 'var(--bg-secondary)',
                                      transform: 'translateX(4px)',
                                    },
                                  }}
                                >
                                  <ListItemIcon sx={{ 
                                    color: isChildActive 
                                      ? 'var(--color-primary-dark)' 
                                      : 'var(--text-secondary)',
                                    minWidth: 32,
                                    mr: 1
                                  }}>
                                    <ChildIcon sx={{ fontSize: '1.1rem' }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={child.label}
                                    primaryTypographyProps={{
                                      fontSize: '0.875rem',
                                      fontWeight: isChildActive ? 600 : 400
                                    }}
                                  />
                                </ListItemButton>
                              </Tooltip>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </motion.div>
              );
            }
            
            // Regular menu item without children
            return (
              <motion.div
                key={item.path || groupKey}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <ListItem disablePadding>
                  <Tooltip title={!isOpen ? item.label : ''} placement="right">
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      component={motion.div}
                      whileHover={isOpen ? { x: 4 } : { scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      sx={{
                        mx: 1,
                        my: 0.5,
                        borderRadius: 2,
                        backgroundColor: isActive 
                          ? 'var(--color-primary-100)' 
                          : 'transparent',
                        color: isActive 
                          ? 'var(--color-primary-dark)' 
                          : 'var(--text-primary)',
                        fontWeight: isActive ? 600 : 500,
                        transition: 'all 0.2s ease',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        px: isOpen ? 2 : 1,
                        '&:hover': {
                          backgroundColor: isActive 
                            ? 'var(--color-primary-100)' 
                            : 'var(--bg-secondary)',
                          transform: isOpen ? 'translateX(4px)' : 'scale(1.05)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: isActive 
                          ? 'var(--color-primary-dark)' 
                          : 'var(--text-secondary)',
                        minWidth: isOpen ? 40 : 'auto',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        mr: isOpen ? 0 : 0
                      }}>
                        <Icon />
                      </ListItemIcon>
                      {isOpen && (
                        <ListItemText 
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.95rem',
                            fontWeight: isActive ? 600 : 500
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </List>

      <Divider />

      {/* Footer - Profile, Change Password & Logout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <Box sx={{ p: isOpen ? 2 : 1 }}>
          {/* Profile & Change Password */}
          {(profilePath || changePasswordPath) && (
            <Box sx={{ mb: 1 }}>
              {profilePath && (
                <ListItem disablePadding>
                  <Tooltip title={!isOpen ? 'Hồ sơ' : ''} placement="right">
                    <ListItemButton
                      onClick={() => handleNavigation(profilePath)}
                      component={motion.div}
                      whileHover={isOpen ? { x: 4 } : { scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      sx={{
                        mx: 1,
                        my: 0.5,
                        borderRadius: 2,
                        backgroundColor: location.pathname === profilePath || location.pathname.startsWith(profilePath + '/')
                          ? 'var(--color-primary-100)' 
                          : 'transparent',
                        color: location.pathname === profilePath || location.pathname.startsWith(profilePath + '/')
                          ? 'var(--color-primary-dark)' 
                          : 'var(--text-primary)',
                        fontWeight: (location.pathname === profilePath || location.pathname.startsWith(profilePath + '/')) ? 600 : 500,
                        transition: 'all 0.2s ease',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        px: isOpen ? 2 : 1,
                        '&:hover': {
                          backgroundColor: (location.pathname === profilePath || location.pathname.startsWith(profilePath + '/'))
                            ? 'var(--color-primary-100)' 
                            : 'var(--bg-secondary)',
                          transform: isOpen ? 'translateX(4px)' : 'scale(1.05)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: (location.pathname === profilePath || location.pathname.startsWith(profilePath + '/'))
                          ? 'var(--color-primary-dark)' 
                          : 'var(--text-secondary)',
                        minWidth: isOpen ? 40 : 'auto',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        mr: isOpen ? 0 : 0
                      }}>
                        <ProfileIcon />
                      </ListItemIcon>
                      {isOpen && (
                        <ListItemText 
                          primary="Hồ sơ"
                          primaryTypographyProps={{
                            fontSize: '0.95rem',
                            fontWeight: (location.pathname === profilePath || location.pathname.startsWith(profilePath + '/')) ? 600 : 500
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              )}
              {changePasswordPath && (
                <ListItem disablePadding>
                  <Tooltip title={!isOpen ? 'Đổi mật khẩu' : ''} placement="right">
                    <ListItemButton
                      onClick={() => handleNavigation(changePasswordPath)}
                      component={motion.div}
                      whileHover={isOpen ? { x: 4 } : { scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      sx={{
                        mx: 1,
                        my: 0.5,
                        borderRadius: 2,
                        backgroundColor: location.pathname === changePasswordPath || location.pathname.startsWith(changePasswordPath + '/')
                          ? 'var(--color-primary-100)' 
                          : 'transparent',
                        color: location.pathname === changePasswordPath || location.pathname.startsWith(changePasswordPath + '/')
                          ? 'var(--color-primary-dark)' 
                          : 'var(--text-primary)',
                        fontWeight: (location.pathname === changePasswordPath || location.pathname.startsWith(changePasswordPath + '/')) ? 600 : 500,
                        transition: 'all 0.2s ease',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        px: isOpen ? 2 : 1,
                        '&:hover': {
                          backgroundColor: (location.pathname === changePasswordPath || location.pathname.startsWith(changePasswordPath + '/'))
                            ? 'var(--color-primary-100)' 
                            : 'var(--bg-secondary)',
                          transform: isOpen ? 'translateX(4px)' : 'scale(1.05)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: (location.pathname === changePasswordPath || location.pathname.startsWith(changePasswordPath + '/'))
                          ? 'var(--color-primary-dark)' 
                          : 'var(--text-secondary)',
                        minWidth: isOpen ? 40 : 'auto',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        mr: isOpen ? 0 : 0
                      }}>
                        <LockIcon />
                      </ListItemIcon>
                      {isOpen && (
                        <ListItemText 
                          primary="Đổi mật khẩu"
                          primaryTypographyProps={{
                            fontSize: '0.95rem',
                            fontWeight: (location.pathname === changePasswordPath || location.pathname.startsWith(changePasswordPath + '/')) ? 600 : 500
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              )}
            </Box>
          )}

          {/* Bottom Menu Items */}
          {bottomMenuItems && bottomMenuItems.length > 0 && (
            <Box sx={{ pt: 1 }}>
              {bottomMenuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <ListItem disablePadding>
                      <Tooltip title={!isOpen ? item.label : ''} placement="right">
                        <ListItemButton
                          onClick={() => handleNavigation(item.path)}
                          component={motion.div}
                          whileHover={isOpen ? { x: 4 } : { scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          sx={{
                            mx: 1,
                            my: 0.5,
                            borderRadius: 2,
                            backgroundColor: isActive 
                              ? 'var(--color-primary-100)' 
                              : 'transparent',
                            color: isActive 
                              ? 'var(--color-primary-dark)' 
                              : 'var(--text-primary)',
                            fontWeight: isActive ? 600 : 500,
                            transition: 'all 0.2s ease',
                            justifyContent: isOpen ? 'flex-start' : 'center',
                            px: isOpen ? 2 : 1,
                            '&:hover': {
                              backgroundColor: isActive 
                                ? 'var(--color-primary-100)' 
                                : 'var(--bg-secondary)',
                              transform: isOpen ? 'translateX(4px)' : 'scale(1.05)',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ 
                            color: isActive 
                              ? 'var(--color-primary-dark)' 
                              : 'var(--text-secondary)',
                            minWidth: isOpen ? 40 : 'auto',
                            justifyContent: isOpen ? 'flex-start' : 'center',
                            mr: isOpen ? 0 : 0
                          }}>
                            <Icon />
                          </ListItemIcon>
                          {isOpen && (
                            <ListItemText 
                              primary={item.label}
                              primaryTypographyProps={{
                                fontSize: '0.95rem',
                                fontWeight: isActive ? 600 : 500
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  </motion.div>
                );
              })}
            </Box>
          )}

          {/* Logout Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isOpen ? (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ 
                  mb: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }
                }}
              >
                Đăng xuất
              </Button>
            ) : (
              <Tooltip title="Đăng xuất" placement="right">
                <IconButton
                  onClick={handleLogout}
                  color="error"
                  sx={{
                    width: '100%',
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)'
                    }
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            )}
          </motion.div>
          {isOpen && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'var(--text-tertiary)',
                display: 'block', 
                textAlign: 'center',
                fontSize: '0.7rem',
                fontWeight: 500
              }}
            >
              v1.0.0
            </Typography>
          )}
        </Box>
      </motion.div>
    </Drawer>
  );
};

export default GenericDrawer;