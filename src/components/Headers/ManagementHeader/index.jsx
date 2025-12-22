import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Chip,
  Avatar
} from '@mui/material';
import {
  Business as BusinessIcon
} from '@mui/icons-material';
import userService from '../../../services/user.service.js';

const withCacheBuster = (url) => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
};

const ManagerStaffHeader = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await userService.getCurrentUser();
        setUserInfo({
          ...user,
          profilePictureUrl: withCacheBuster(user?.profilePictureUrl || '')
        });
      } catch (error) {

        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);


  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

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
          {/* Branch Info */}
          {userInfo?.branchName && (
            <Chip
              icon={<BusinessIcon />}
              label={userInfo.branchName}
              color="secondary"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.8)',
                color: 'white',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                },
                '& .MuiChip-icon': {
                  color: 'white'
                }
              }}
            />
          )}

          {/* User Name */}
          {userInfo?.name && (
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600,
                color: 'white',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {userInfo.name}
            </Typography>
          )}

          {/* Avatar (display only, no menu) */}
          <Avatar
            src={userInfo?.profilePictureUrl || ''}
            alt={userInfo?.name || userInfo?.fullName || 'Người dùng'}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              width: 36,
              height: 36,
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {!userInfo?.profilePictureUrl && getInitials(userInfo?.name || userInfo?.fullName)}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ManagerStaffHeader;


