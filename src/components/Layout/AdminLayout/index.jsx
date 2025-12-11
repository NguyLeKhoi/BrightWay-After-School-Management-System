import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import GenericDrawer from '../../Common/Drawer/GenericDrawer';
import ManagerStaffHeader from '../../Headers/ManagementHeader';
import PageTransition from '../../Common/PageTransition';
import ScrollToTop from '../../Common/ScrollToTop';
import authService from '../../../services/auth.service';
import {
  Business as BranchIcon,
  Room as FacilityIcon,
  Person as UserIcon,
  School as CoursesIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  CardGiftcard as BenefitIcon,
  School as StudentLevelIcon,
  ShoppingCart as PackageIcon,
  AccountBalance as SchoolIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  BusinessCenter as SystemIcon,
  LocationCity as BranchGroupIcon,
  LocalOffer as ServiceIcon,
  AccessTime as SlotTypeIcon
} from '@mui/icons-material';

const AdminLayout = () => {
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
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: DashboardIcon
    },
    {
      groupKey: 'user-management',
      label: 'Quản lý Người dùng',
      icon: GroupIcon,
      children: [
    {
      path: '/admin/staffAndManager',
      label: 'Nhân Viên',
      icon: UserIcon
    },
    {
      path: '/admin/users',
      label: 'Người Dùng',
      icon: PeopleIcon
        }
      ]
    },
    {
      groupKey: 'system-management',
      label: 'Quản lý Hệ thống',
      icon: SystemIcon,
      children: [
    {
      path: '/admin/schools',
      label: 'Trường',
      icon: SchoolIcon
    },
    {
      path: '/admin/student-levels',
      label: 'Cấp Độ Học Sinh',
      icon: StudentLevelIcon
        }
      ]
    },
    {
      groupKey: 'branch-management',
      label: 'Quản lý Chi nhánh',
      icon: BranchGroupIcon,
      children: [
    {
      path: '/admin/branches',
      label: 'Chi Nhánh',
      icon: BranchIcon
    },
    {
      path: '/admin/facilities',
      label: 'Cơ Sở Vật Chất',
      icon: FacilityIcon
    }
      ]
    },
    {
      groupKey: 'service-management',
      label: 'Quản lý Dịch vụ',
      icon: ServiceIcon,
      children: [
    {
      path: '/admin/packages',
      label: 'Gói Bán',
      icon: PackageIcon
    },
    {
      path: '/admin/benefits',
      label: 'Lợi Ích',
      icon: BenefitIcon
    },
    {
      path: '/admin/services',
      label: 'Dịch Vụ',
      icon: ServiceIcon
        }
      ]
    }
  ];

  const bottomMenuItems = [
    {
      path: '/admin/settings',
      label: 'Cài Đặt Hệ Thống',
      icon: SettingsIcon
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', paddingTop: '64px' }}>
      {/* Header */}
      <ManagerStaffHeader />

      <Box sx={{ display: 'flex' }}>
        {/* Generic Drawer */}
        <GenericDrawer
          title="BRIGHTWAY"
          subtitle="Cổng Quản Trị"
          menuItems={menuItems}
          bottomMenuItems={bottomMenuItems}
          onLogout={handleLogout}
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

export default AdminLayout;
