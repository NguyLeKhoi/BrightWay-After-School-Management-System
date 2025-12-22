import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import useManagerNotifications from '../../../hooks/useManagerNotifications';

const ManagerNotificationDropdown = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    handleNotificationClick
  } = useManagerNotifications();

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNotificationItemClick = async (notification) => {
    try {
      await handleNotificationClick(notification, navigate);
      handleCloseMenu();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (createdAt) => {
    try {
      const date = new Date(createdAt);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return '';
    }
  };

  const isOpen = Boolean(anchorEl);

  return (
    <>
      {/* Notification Button */}
      <IconButton
        onClick={handleOpenMenu}
        sx={{
          color: 'white',
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationIcon />
        </Badge>
      </IconButton>

      {/* Notification Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            maxHeight: 'calc(100vh - 100px)',
            width: '420px',
            maxWidth: '90vw',
            backgroundColor: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-lg)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
              Thông báo
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error">
                <Box sx={{ width: 0 }} />
              </Badge>
            )}
          </Box>

          {/* Action Buttons */}
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={async () => {
                await markAllAsRead();
              }}
              sx={{
                textTransform: 'none',
                color: 'primary.main',
                mb: 1,
                display: 'block',
                width: '100%'
              }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Notifications List */}
        {isLoading ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Đang tải...
            </Typography>
          </MenuItem>
        ) : notifications.length > 0 ? (
          <List sx={{ p: 0, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                disablePadding
                sx={{
                  backgroundColor: !notification.isRead
                    ? 'action.hover'
                    : 'transparent',
                  borderLeft: !notification.isRead
                    ? '4px solid'
                    : '4px solid transparent',
                  borderColor: 'primary.main',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: !notification.isRead
                      ? 'action.selected'
                      : 'action.hover'
                  }
                }}
              >
                <ListItemButton
                  onClick={() => handleNotificationItemClick(notification)}
                  sx={{ p: 2, pt: 1.5, pb: 1.5 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={!notification.isRead ? 700 : 500}
                          sx={{ color: 'text.primary', flex: 1 }}
                        >
                          {notification.title}
                        </Typography>
                        {notification.priority && (
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={getPriorityColor(notification.priority)}
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            mb: 0.5,
                            fontSize: '0.875rem'
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.disabled',
                              fontSize: '0.75rem'
                            }}
                          >
                            {formatTimeAgo(notification.createdAt)}
                          </Typography>
                          {!notification.isRead && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'primary.main'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationIcon
              sx={{
                fontSize: 48,
                color: 'text.disabled',
                mb: 1
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Không có thông báo
            </Typography>
          </Box>
        )}

        {/* View All Button */}
        {notifications.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <MenuItem
              onClick={() => {
                navigate('/manager/notifications');
                handleCloseMenu();
              }}
              sx={{
                justifyContent: 'center',
                py: 1.5,
                color: 'primary.main',
                fontWeight: 500
              }}
            >
              Xem tất cả thông báo
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default ManagerNotificationDropdown;
