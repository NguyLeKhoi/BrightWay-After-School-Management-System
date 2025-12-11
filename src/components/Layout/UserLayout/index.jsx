import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import GenericDrawer from '../../Common/Drawer/GenericDrawer';
import UserHeader from '../../Headers/UserHeader';
import PageTransition from '../../Common/PageTransition';
import ScrollToTop from '../../Common/ScrollToTop';
import authService from '../../../services/auth.service';
import {
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  ChildCare as ChildIcon,
  EventAvailable as ScheduleIcon,
  AccountBalanceWallet as WalletIcon,
  School as BookIcon,
  Notifications as BellIcon,
  Person as ProfileIcon,
  Lock as LockIcon,
  AccountBalance as FinanceIcon,
  Wallet as MainWalletIcon,
  ChildCare as ChildrenWalletIcon,
  History as TransactionHistoryIcon,
  Settings as ManagementIcon,
  Inventory as PackageIcon
} from '@mui/icons-material';

const UserLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const menuItems = [
    {
      path: '/user/dashboard',
      label: 'Tổng quan',
      icon: DashboardIcon
    },
    {
      groupKey: 'management',
      label: 'Con',
      icon: ChildIcon,
      children: [
        {
          path: '/user/management/children',
          label: 'Hồ sơ của các con',
          icon: ChildIcon
        },
        {
          path: '/user/management/packages',
          label: 'Mua gói',
          icon: PackageIcon
        },
        {
          path: '/user/management/schedule',
          label: 'Lịch giữ trẻ',
          icon: ScheduleIcon
        }
      ]
    },
    {
      groupKey: 'finance',
      label: 'Tài chính',
      icon: FinanceIcon,
      children: [
        {
          path: '/user/finance/wallet',
          label: 'Ví của tôi',
          icon: MainWalletIcon
        },
        
      ]
    },
    {
      path: '/user/notifications',
      label: 'Thông báo',
      icon: BellIcon
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', paddingTop: '64px' }}>
      {/* Header */}
      <UserHeader />

      <Box sx={{ display: 'flex' }}>
        {/* Generic Drawer */}
        <GenericDrawer
          title="BRIGHTWAY"
          subtitle="Cổng Người Dùng"
          menuItems={menuItems}
          onLogout={handleLogout}
          profilePath="/user/profile"
          changePasswordPath="/user/change-password"
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

export default UserLayout;