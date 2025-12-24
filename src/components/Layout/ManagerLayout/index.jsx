import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import GenericDrawer from '../../Common/Drawer/GenericDrawer';
import ManagerStaffHeader from '../../Headers/ManagementHeader';
import PageTransition from '../../Common/PageTransition';
import ScrollToTop from '../../Common/ScrollToTop';
import authService from '../../../services/auth.service';
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
  LocalOffer as ServiceIcon,
  Lock as LockIcon,
  Category as SlotTypeIcon,
  CreditCard as NfcCardIcon,
  SwapHoriz as TransferIcon
  ,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

const ManagerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Clear stepper form data when route changes to prevent navigation conflicts
  React.useEffect(() => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('stepperForm_')) {
        sessionStorage.removeItem(key);
      }
    });
  }, [location.pathname]); // Clear when route changes

  // Clear stepper form data on component mount and before unload
  React.useEffect(() => {
    const clearStepperData = () => {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('stepperForm_')) {
          sessionStorage.removeItem(key);
        }
      });
    };

    const handleBeforeUnload = () => {
      clearStepperData();
    };

    // Clear on mount
    clearStepperData();

    // Listen for beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {

      // Force logout even on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const menuItems = [
    {
      path: '/manager/dashboard',
      label: 'Tổng quan',
      icon: DashboardIcon
    },
    {
      groupKey: 'user-management',
      label: 'Tài khoản & thẻ NFC',
      icon: PeopleGroupIcon,
      children: [
    {
      path: '/manager/staff',
      label: 'Nhân Viên',
      icon: UserIcon
    },
    {
      path: '/manager/parents',
      label: 'Phụ huynh',
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
        },
        {
          path: '/manager/branch-transfer',
          label: 'Chuyển chi nhánh',
          icon: TransferIcon
        }
      ]
    },
     {
      groupKey: 'PackageServiceManagement',
      label: 'Gói & Dịch vụ',
      icon: FacilityServiceIcon,
      children: [
         {
      path: '/manager/packages',
      label: 'Gói dịch vụ',
      icon: CoursesIcon
        },
        {
          path: '/manager/services',
          label: 'Dịch Vụ',
          icon: ServiceIcon
        },
      ]
        },
    {
      groupKey: 'facility-service-management',
      label: 'Cơ sở & Lịch giữ trẻ',
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
      ]
    },
     {
      path: '/manager/notifications',
      label: 'Thông báo',
      icon: NotificationsIcon
    },
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

