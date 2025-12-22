import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/user.service.js';
import { useApp } from '../../../contexts/AppContext';

const withCacheBuster = (url) => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
};

const UserHeader = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showGlobalError } = useApp();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await userService.getCurrentUser();
        setUserInfo({
          ...user,
          profilePictureUrl: withCacheBuster(user?.profilePictureUrl || '')
        });
      } catch (error) {

        showGlobalError('Không thể tải thông tin người dùng.');
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [showGlobalError]);


  if (loading) {
    return (
      <AppBar position="fixed" sx={{ bgcolor: 'var(--color-primary)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Đang tải...
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end', pr: 2 }}>
        {/* User Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
          {/* User Name */}
          {(userInfo?.fullName || userInfo?.name) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                {userInfo.fullName || userInfo.name}
              </Typography>
            </Box>
          )}
              <Avatar
                src={userInfo?.profilePictureUrl || ''}
                alt={userInfo?.fullName || 'Người dùng'}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: 36,
                  height: 36,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                {!userInfo?.profilePictureUrl && <PersonIcon />}
              </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default UserHeader;


