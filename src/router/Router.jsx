import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import AuthLayout from '../components/Layout/AuthLayout';
import UserLayout from '../components/Layout/UserLayout';
import AdminLayout from '../components/Layout/AdminLayout';
import ManagerLayout from '../components/Layout/ManagerLayout';
import StaffLayout from '../components/Layout/StaffLayout';
import ProtectedRoute from './ProtectedRoute';

// Main Pages
import CombinedLanding from '../pages/main/CombinedLanding';
import Contact from '../pages/main/Contact';
import FAQ from '../pages/main/FAQ';

// Auth Pages
import Login from '../pages/auth/Login';
import SetPassword from '../pages/auth/SetPassword';

// user Pages
import UserDashboard from '../pages/user/dashboard';
import UserProfile from '../pages/user/profile';
import ChangePassword from '../pages/common/ChangePassword';
import MySchedule from '../pages/user/children/ChildSchedule/schedule';
import BulkSchedule from '../pages/user/children/ChildSchedule/schedule/BulkBooking/BulkSchedule';
import ChildrenList from '../pages/user/children/AllChildren';
import CreateChild from '../pages/user/children/CreateChild';
import ChildProfile from '../pages/user/children/ChildProfile';
import ChildSchedule from '../pages/user/children/ChildSchedule';
import ChildScheduleDetail from '../pages/user/children/ChildSchedule/ChildScheduleDetail';
import MainWallet from '../pages/user/finance/MainWallet';
import ChildrenWallet from '../pages/user/finance/ChildrenWallet';
import TransactionHistory from '../pages/user/finance/TransactionHistory';
import MyPackages from '../pages/user/packages';
import UserPackageDetail from '../pages/user/packages/PackageDetail';
import Notifications from '../pages/user/notifications';
import PaymentSuccess from '../pages/user/paymentSuccess';
import PaymentCancel from '../pages/user/paymentCancel';
import ScheduleSelect from '../pages/user/management/ScheduleSelect';
import PackageSelect from '../pages/user/management/PackageSelect';

// Branch Transfer Pages
import CreateTransferRequest from '../pages/user/branch-transfer/request';
import TransferRequestsList from '../pages/user/branch-transfer/requests';
import TransferRequestDetail from '../pages/user/branch-transfer/requests/[id]';

// Admin Pages
import AdminDashboard from '../pages/admin/dashboard';
import BranchManagement from '../pages/admin/branchManagement';
import CreateBranch from '../pages/admin/branchManagement/CreateBranch';
import UpdateBranch from '../pages/admin/branchManagement/UpdateBranch';
import BranchDetail from '../pages/admin/branchManagement/BranchDetail';
import FacilityManagement from '../pages/admin/facilityManagement';
import FacilityDetail from '../pages/admin/facilityManagement/FacilityDetail';
import ManagerManagement from '../pages/admin/managerManagement';
import ManagerDetail from '../pages/admin/managerManagement/ManagerDetail';
import UserManagement from '../pages/admin/userManagement';
import UserDetail from '../pages/admin/userManagement/UserDetail';
import BenefitManagement from '../pages/admin/benefitManagement';
import BenefitDetail from '../pages/admin/benefitManagement/BenefitDetail';
import StudentLevelManagement from '../pages/admin/studentLevelManagement';
import StudentLevelDetail from '../pages/admin/studentLevelManagement/StudentLevelDetail';
import SettingManagement from '../pages/admin/settingManagement';
import PackageManagement from '../pages/admin/packageManagement';
import PackageDetail from '../pages/admin/packageManagement/PackageDetail';
import AdminCreateTemplate from '../pages/admin/packageManagement/CreateTemplate';
import AdminUpdateTemplate from '../pages/admin/packageManagement/UpdateTemplate';
import TemplateDetail from '../pages/admin/packageManagement/TemplateDetail';
import AdminCreatePackage from '../pages/admin/packageManagement/CreatePackage';
import AdminUpdatePackage from '../pages/admin/packageManagement/UpdatePackage';
import SchoolManagement from '../pages/admin/schoolManagement';
import SchoolDetail from '../pages/admin/schoolManagement/SchoolDetail';
import ServiceManagement from '../pages/admin/serviceManagement';
import ServiceDetail from '../pages/admin/serviceManagement/ServiceDetail';
import SlotTypeManagement from '../pages/admin/slotTypeManagement';
import SlotTypeDetail from '../pages/admin/slotTypeManagement/SlotTypeDetail';

// Manager Pages
import ManagerDashboard from '../pages/manager/dashboard';
import ManagerRoomManagement from '../pages/manager/roomManagement';
import ManagerRoomDetail from '../pages/manager/roomManagement/RoomDetail';
import ManagerNotifications from '../pages/manager/notifications';
import StaffManagement from '../pages/manager/staffManagement';
import StaffDetail from '../pages/manager/staffManagement/StaffDetail';
import ParentManagement from '../pages/manager/parentManagement';
import CreateParent from '../pages/manager/parentManagement/CreateParent';
import ManagerPackageManagement from '../pages/manager/packageManagement';
import ManagerPackageDetail from '../pages/manager/packageManagement/PackageDetail';
import CreatePackage from '../pages/manager/packageManagement/CreatePackage';
import UpdatePackage from '../pages/manager/packageManagement/UpdatePackage';
import ManagerStudentManagement from '../pages/manager/studentManagement';
import ManagerBranchSlotManagement from '../pages/manager/branchSlotManagement';
import CreateBranchSlot from '../pages/manager/branchSlotManagement/CreateBranchSlot';
import BulkCreateBranchSlot from '../pages/manager/branchSlotManagement/BulkCreateBranchSlot';
import UpdateBranchSlot from '../pages/manager/branchSlotManagement/UpdateBranchSlot';
import BranchSlotDetail from '../pages/manager/branchSlotManagement/BranchSlotDetail';
import CreateStudent from '../pages/manager/studentManagement/CreateStudent';
import UpdateStudent from '../pages/manager/studentManagement/UpdateStudent';
import NfcCardManagement from '../pages/manager/nfcCardManagement';
import NfcCardDetail from '../pages/manager/nfcCardManagement/NfcCardDetail';

// Branch Transfer Pages
import ManagerTransferRequests from '../pages/manager/branch-transfer';
import ManagerTransferRequestDetail from '../pages/manager/branch-transfer/[id]';


// Staff Pages
import StaffDashboard from '../pages/staff/dashboard';
import StaffActivityTypes from '../pages/staff/activityTypes';
import StaffAssignments from '../pages/staff/assignments';
import StaffAssignmentDetail from '../pages/staff/assignments/AssignmentDetail';
import StaffProfile from '../pages/staff/profile';

// Other Pages
import NotFound from '../components/Common/NotFound';

export const routes = createBrowserRouter([
  // Main Layout Routes (Landing Pages)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <CombinedLanding />,
      },
      {
        path: 'packages',
        element: <CombinedLanding />,
      },
      {
        path: 'facilities',
        element: <CombinedLanding />,
      },
      {
        path: 'contact',
        element: <Contact />,
      },
      {
        path: 'faq',
        element: <FAQ />,
      },
    ],
  },

  // Auth Routes (Authentication Pages)
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Login />,
      },
    ],
  },

  // Set Password Route (for new account activation)
  {
    path: '/set-password',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <SetPassword />,
      },
    ],
  },

  // Payment Success Route (uses AuthLayout for background, but requires User role)
  {
    path: '/payment/success',
    element: (
      <ProtectedRoute allowedRoles={['User']}>
        <AuthLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <PaymentSuccess />,
      },
    ],
  },

  // Payment Cancel Route (uses AuthLayout for background, but requires User role)
  {
    path: '/payment/cancel',
    element: (
      <ProtectedRoute allowedRoles={['User']}>
        <AuthLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <PaymentCancel />,
      },
    ],
  },

  // Parent Layout Routes (Parent Portal)
  {
    path: '/user',
    element: (
      <ProtectedRoute allowedRoles={['User']}>
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <UserDashboard />,
      },
      {
        path: 'dashboard',
        element: <UserDashboard />,
      },
      {
        path: 'profile',
        element: <UserProfile />,
      },
      {
        path: 'change-password',
        element: <ChangePassword />,
      },
      {
        path: 'management/children',
        element: <ChildrenList />,
      },
      {
        path: 'management/children/create',
        element: <CreateChild />,
      },
      {
        path: 'management/children/:childId/profile',
        element: <ChildProfile />,
      },
      {
        path: 'management/schedule',
        element: <ScheduleSelect />,
      },
      {
        path: 'management/schedule/:childId',
        element: <ChildSchedule />,
      },
      {
        path: 'management/schedule/:childId/:slotId',
        element: <ChildScheduleDetail />,
      },
      {
        path: 'management/schedule/:childId/register',
        element: <MySchedule />,
      },
       {
         path: 'management/schedule/:childId/bulk-register',
         element: <BulkSchedule />,
       },
      {
        path: 'management/packages',
        element: <PackageSelect />,
      },
      {
        path: 'management/packages/:childId',
        element: <MyPackages />,
      },
      {
        path: 'packages/detail/:id',
        element: <UserPackageDetail />,
      },
      {
        path: 'finance/wallet',
        element: <MainWallet />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'payment/cancel',
        element: <PaymentCancel />,
      },
      {
        path: 'branch-transfer/request',
        element: <CreateTransferRequest />,
      },
      {
        path: 'branch-transfer/requests',
        element: <TransferRequestsList />,
      },
      {
        path: 'branch-transfer/requests/:id',
        element: <TransferRequestDetail />,
      },
    ],
  },

  // Admin Layout Routes (Admin Portal)
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'branches',
        element: <BranchManagement />,
      },
      {
        path: 'branches/create',
        element: <CreateBranch />,
      },
      {
        path: 'branches/update/:id',
        element: <UpdateBranch />,
      },
      {
        path: 'branches/detail/:id',
        element: <BranchDetail />,
      },
      {
        path: 'facilities',
        element: <FacilityManagement />,
      },
      {
        path: 'facilities/detail/:id',
        element: <FacilityDetail />,
      },
      {
        path: 'staffAndManager',
        element: <ManagerManagement />,
      },
      {
        path: 'staffAndManager/detail/:id',
        element: <ManagerDetail />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'users/detail/:id',
        element: <UserDetail />,
      },
      {
        path: 'benefits',
        element: <BenefitManagement />,
      },
      {
        path: 'benefits/detail/:id',
        element: <BenefitDetail />,
      },
      {
        path: 'student-levels',
        element: <StudentLevelManagement />,
      },
      {
        path: 'student-levels/detail/:id',
        element: <StudentLevelDetail />,
      },
      {
        path: 'settings',
        element: <SettingManagement />,
      },
      {
        path: 'packages',
        element: <PackageManagement />,
      },
      {
        path: 'packages/detail/:id',
        element: <PackageDetail />,
      },
      {
        path: 'packages/templates/create',
        element: <AdminCreateTemplate />
      },
      { path: 'packages/templates/update/:id', element: <AdminUpdateTemplate /> },
      { path: 'packages/templates/detail/:id', element: <TemplateDetail /> },
      { path: 'packages/create', element: <AdminCreatePackage /> },
      { path: 'packages/update/:id', element: <AdminUpdatePackage /> },
      {
        path: 'schools',
        element: <SchoolManagement />,
      },
      {
        path: 'schools/detail/:id',
        element: <SchoolDetail />,
      },
      {
        path: 'services',
        element: <ServiceManagement />,
      },
      {
        path: 'services/detail/:id',
        element: <ServiceDetail />,
      },
    ],
  },

  // Manager Layout Routes (Manager Portal)
  {
    path: '/manager',
    element: (
      <ProtectedRoute allowedRoles={['Manager']}>
        <ManagerLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ManagerDashboard />,
      },
      {
        path: 'dashboard',
        element: <ManagerDashboard />,
      },
      {
        path: 'notifications',
        element: <ManagerNotifications />,
      },
      {
        path: 'staff',
        element: <StaffManagement />,
      },
      {
        path: 'staff/detail/:id',
        element: <StaffDetail />,
      },
      {
        path: 'slot-types',
        element: <SlotTypeManagement />,
      },
      {
        path: 'slot-types/detail/:id',
        element: <SlotTypeDetail />,
      },
      {
        path: 'parents',
        element: <ParentManagement />,
      },
      {
        path: 'parents/create',
        element: <CreateParent />,
      },
      {
        path: 'rooms',
        element: <ManagerRoomManagement />,
      },
      {
        path: 'rooms/detail/:id',
        element: <ManagerRoomDetail />,
      },
      {
        path: 'packages',
        element: <ManagerPackageManagement />,
      },
      {
        path: 'packages/detail/:id',
        element: <ManagerPackageDetail />,
      },
      {
        path: 'packages/create',
        element: <CreatePackage />,
      },
      {
        path: 'packages/update/:id',
        element: <UpdatePackage />,
      },
      {
        path: 'students',
        element: <ManagerStudentManagement />,
      },
      {
        path: 'students/create',
        element: <CreateStudent />,
      },
      {
        path: 'students/update/:id',
        element: <UpdateStudent />,
      },
      {
        path: 'branch-slots',
        element: <ManagerBranchSlotManagement />,
      },
      {
        path: 'branch-slots/create',
        element: <CreateBranchSlot />,
      },
      {
        path: 'branch-slots/bulk-create',
        element: <BulkCreateBranchSlot key={Date.now()} />,
      },
      {
        path: 'branch-slots/update/:id',
        element: <UpdateBranchSlot />,
      },
      {
        path: 'branch-slots/detail/:id',
        element: <BranchSlotDetail />,
      },
      {
        path: 'nfc-cards',
        element: <NfcCardManagement />,
      },
      {
        path: 'nfc-cards/detail/:studentId',
        element: <NfcCardDetail />,
      },
      {
        path: 'branch-transfer',
        element: <ManagerTransferRequests />,
      },
      {
        path: 'branch-transfer/:id',
        element: <ManagerTransferRequestDetail />,
      },
      {
        path: 'profile',
        element: <StaffProfile />,
      },
      {
        path: 'change-password',
        element: <ChangePassword />,
      },
    ],
  },


  // Staff Layout Routes (Staff Portal)
  {
    path: '/staff',
    element: (
      <ProtectedRoute allowedRoles={['Staff']}>
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StaffDashboard />,
      },
      {
        path: 'dashboard',
        element: <StaffDashboard />,
      },
      {
        path: 'activity-types',
        element: <StaffActivityTypes />,
      },
      {
        path: 'assignments',
        element: <StaffAssignments />,
      },
      {
        path: 'assignments/:slotId',
        element: <StaffAssignmentDetail />,
      },
      {
        path: 'profile',
        element: <StaffProfile />,
      },
      {
        path: 'change-password',
        element: <ChangePassword />,
      },
    ],
  },

  // 404 Page
  {
    path: '*',
    element: <NotFound />,
  },
]);

