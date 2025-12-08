import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import GenericDrawer from '../../Common/Drawer/GenericDrawer';
import ManagerStaffHeader from '../../Headers/ManagementHeader';
import PageTransition from '../../Common/PageTransition';
import ScrollToTop from '../../Common/ScrollToTop';
import {
  Person as UserIcon,
  School as CoursesIcon,
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  Group as StudentIcon,
  AccessTime as BranchSlotIcon,
  FamilyRestroom as ParentIcon,
  People as PeopleGroupIcon,
  BusinessCenter as FacilityServiceIcon,
  Person as ProfileIcon,
  Lock as LockIcon,
  Category as SlotTypeIcon,
  CreditCard as NfcCardIcon
} from '@mui/icons-material';

const ManagerLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/manager/dashboard',
      label: 'Dashboard',
      icon: DashboardIcon
    },
    {
      groupKey: 'user-management',
      label: 'Quản lý Người dùng',
      icon: PeopleGroupIcon,
      children: [
    {
      path: '/manager/staff',
      label: 'Nhân Viên',
      icon: UserIcon
    },
    {
      path: '/manager/parents',
      label: 'Người dùng',
      icon: ParentIcon
    },
    {
      path: '/manager/students',
      label: 'Trẻ em',
      icon: StudentIcon
        },
        {
          path: '/manager/nfc-cards',
          label: 'Thẻ NFC',
          icon: NfcCardIcon
        }
      ]
    },
    {
      groupKey: 'facility-service-management',
      label: 'Quản lý Cơ sở & Dịch vụ',
      icon: FacilityServiceIcon,
      children: [
    {
      path: '/manager/rooms',
      label: 'Phòng Học',
      icon: RoomIcon
    },
        {
          path: '/manager/branch-slots',
          label: 'Ca Giữ Trẻ',
          icon: BranchSlotIcon
        },
        {
          path: '/manager/slot-types',
          label: 'Loại Ca Giữ Trẻ',
          icon: SlotTypeIcon
        },
    {
      path: '/manager/packages',
      label: 'Gói dịch vụ',
      icon: CoursesIcon
        }
      ]
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
          subtitle="Cổng Quản Lý"
          menuItems={menuItems}
          onLogout={handleLogout}
          profilePath="/manager/profile"
          changePasswordPath="/manager/change-password"
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

export default ManagerLayout;
