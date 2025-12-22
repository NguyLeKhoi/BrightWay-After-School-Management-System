import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import ManagerStaffHeader from '../../Headers/ManagementHeader';
import GenericDrawer from '../../Common/Drawer/GenericDrawer';
import PageTransition from '../../Common/PageTransition';
import ScrollToTop from '../../Common/ScrollToTop';
import {
  Dashboard as DashboardIcon,
  Category as ActivityTypeIcon,
  Assignment as AssignmentIcon,
  Person as ProfileIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

const StaffLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {

      navigate('/login');
    }
  };

  const menuItems = [
    {
      path: '/staff/dashboard',
      label: 'Tổng quan',
      icon: DashboardIcon
    },
    {
      path: '/staff/activity-types',
      label: 'Loại Hoạt Động',
      icon: ActivityTypeIcon
    },
    {
      path: '/staff/assignments',
      label: 'Lịch Làm Việc',
      icon: AssignmentIcon
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', paddingTop: '64px' }}>
      {/* Header */}
      <ManagerStaffHeader />

      <Box sx={{ display: 'flex' }}>
        {/* Sidebar */}
        <GenericDrawer
          title="BRIGHTWAY"
          subtitle="Cổng Nhân Viên"
          menuItems={menuItems}
          onLogout={handleLogout}
          profilePath="/staff/profile"
          changePasswordPath="/staff/change-password"
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: 'var(--bg-secondary)',
            minHeight: 'calc(100vh - 64px)',
            transition: 'background-color 0.3s ease'
          }}
        >
          <ScrollToTop />
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Box>
      </Box>
    </Box>
  );
};

export default StaffLayout;

