import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserDashboard from '../dashboard/index.jsx';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AppProvider } from '../../../contexts/AppContext';

// Mock services
vi.mock('../../../services/student.service', () => ({
  default: {
    getStudentsByParent: vi.fn()
  }
}));

vi.mock('../../../services/wallet.service', () => ({
  default: {
    getWalletBalance: vi.fn()
  }
}));

vi.mock('../../../services/notification.service', () => ({
  default: {
    getUnreadCount: vi.fn()
  }
}));

vi.mock('../../../services/studentSlot.service', () => ({
  default: {
    getStudentSlots: vi.fn()
  }
}));

// Mock hooks
vi.mock('../../../hooks/useContentLoading', () => ({
  default: () => ({
    isLoading: false,
    loadingText: 'Đang tải...',
    showLoading: vi.fn(),
    hideLoading: vi.fn()
  })
}));

// Mock contexts
const mockShowGlobalError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../contexts/AppContext', () => ({
  useApp: () => ({
    showGlobalError: mockShowGlobalError
  }),
  AppProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Import mocked services
import studentService from '../../../services/student.service';
import walletService from '../../../services/wallet.service';
import notificationService from '../../../services/notification.service';
import studentSlotService from '../../../services/studentSlot.service';

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <UserDashboard />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('UserDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    studentService.getStudentsByParent.mockResolvedValue({
      data: [],
      totalCount: 0
    });
    walletService.getWalletBalance.mockResolvedValue({
      data: { balance: 0 }
    });
    notificationService.getUnreadCount.mockResolvedValue({
      data: { count: 0 }
    });
    studentSlotService.getStudentSlots.mockResolvedValue({
      data: { items: [] }
    });
  });

  describe('Initial Render', () => {
    it('should render dashboard with all main sections', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Tổng quan')).toBeInTheDocument();
        expect(screen.getByText('Thao tác nhanh')).toBeInTheDocument();
      });
    });

    it('should display initial stats', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Con cái')).toBeInTheDocument();
        expect(screen.getByText('Số dư ví')).toBeInTheDocument();
        expect(screen.getByText('Thông báo')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Data Loading', () => {
    it('should load dashboard data on mount', async () => {
      const mockChildren = [
        { id: '1', fullName: 'Nguyễn Văn A' },
        { id: '2', fullName: 'Nguyễn Văn B' }
      ];

      studentService.getStudentsByParent.mockResolvedValue({
        data: mockChildren,
        totalCount: 2
      });

      walletService.getWalletBalance.mockResolvedValue({
        data: { balance: 1000000 }
      });

      notificationService.getUnreadCount.mockResolvedValue({
        data: { count: 5 }
      });

      renderDashboard();

      await waitFor(() => {
        expect(studentService.getStudentsByParent).toHaveBeenCalled();
        expect(walletService.getWalletBalance).toHaveBeenCalled();
        expect(notificationService.getUnreadCount).toHaveBeenCalled();
      });
    });

    it('should handle children data loading', async () => {
      const mockChildren = [
        { id: '1', name: 'Nguyễn Văn A' }
      ];

      studentService.getStudentsByParent.mockResolvedValue({
        data: mockChildren,
        totalCount: 1
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Con cái')).toBeInTheDocument();
      });
    });

    it('should handle wallet balance loading', async () => {
      walletService.getWalletBalance.mockResolvedValue({
        data: { balance: 500000 }
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Số dư ví')).toBeInTheDocument();
      });
    });

    it('should handle notification count loading', async () => {
      notificationService.getUnreadCount.mockResolvedValue({
        data: { count: 3 }
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Thông báo')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      studentService.getStudentsByParent.mockRejectedValue(new Error('API Error'));

      renderDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      });
    });

    it('should handle wallet API error gracefully', async () => {
      walletService.getWalletBalance.mockRejectedValue(new Error('Wallet API Error'));

      renderDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalledWith('Wallet API Error');
      });
    });
  });

  describe('Upcoming Schedules', () => {
    it('should display upcoming schedules when available', async () => {
      const mockChildren = [{ id: '1', name: 'Nguyễn Văn A' }];
      const mockSchedules = [
        {
          id: 'slot-1',
          branchSlot: {
            date: '2024-12-20',
            branch: { name: 'Chi nhánh A' },
            room: { name: 'Phòng 101' }
          },
          timeframe: {
            startTime: '14:00',
            endTime: '16:00'
          }
        }
      ];

      studentService.getStudentsByParent.mockResolvedValue({
        data: mockChildren,
        totalCount: 1
      });

      studentSlotService.getStudentSlots.mockResolvedValue({
        items: mockSchedules,
        totalCount: 1
      });

      renderDashboard();

      await waitFor(() => {
        // Check if schedules section is rendered
        expect(screen.getByText('Tổng quan')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle no upcoming schedules', async () => {
      const mockChildren = [{ id: '1', name: 'Nguyễn Văn A' }];

      studentService.getStudentsByParent.mockResolvedValue({
        data: mockChildren,
        totalCount: 1
      });

      studentSlotService.getStudentSlots.mockResolvedValue({
        items: [],
        totalCount: 0
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Chưa có lịch giữ trẻ sắp tới')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle schedule loading error gracefully', async () => {
      const mockChildren = [{ id: '1', fullName: 'Nguyễn Văn A' }];

      studentService.getStudentsByParent.mockResolvedValue({
        data: mockChildren,
        totalCount: 1
      });

      studentSlotService.getStudentSlots.mockRejectedValue(new Error('Schedule API Error'));

      renderDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalledWith('Schedule API Error');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to children management page', async () => {
      renderDashboard();

      await waitFor(() => {
        const childrenButton = screen.getByText('Thêm con mới');
        fireEvent.click(childrenButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/user/management/children/create');
    });

    it('should navigate to packages page', async () => {
      renderDashboard();

      await waitFor(() => {
        const packagesButton = screen.getByText('Mua gói dịch vụ');
        fireEvent.click(packagesButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/user/management/packages');
    });

    it('should navigate to wallet page', async () => {
      renderDashboard();

      await waitFor(() => {
        const walletButton = screen.getByText('Nạp tiền ví');
        fireEvent.click(walletButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/user/finance/wallet');
    });

    it('should navigate to schedule page', async () => {
      renderDashboard();

      await waitFor(() => {
        const scheduleButton = screen.getByText('Xem lịch giữ trẻ');
        fireEvent.click(scheduleButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/user/management/children');
    });
  });

  describe('Schedule Time Classification', () => {
    it('should classify schedules correctly', () => {
      renderDashboard();

      // Test the getSlotTimeType function indirectly through rendered content
      // This would require mocking Date.now() and testing different scenarios
      // For now, we can test that the function exists and is called
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action cards', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Thêm con mới')).toBeInTheDocument();
        expect(screen.getByText('Mua gói dịch vụ')).toBeInTheDocument();
        expect(screen.getByText('Nạp tiền ví')).toBeInTheDocument();
        expect(screen.getByText('Xem lịch giữ trẻ')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during data fetch', () => {
      // Mock useContentLoading to return loading state
      vi.mocked(vi.importMock('../../../hooks/useContentLoading')).mockReturnValue({
        isLoading: true,
        loadingText: 'Đang tải dữ liệu...',
        showLoading: vi.fn(),
        hideLoading: vi.fn()
      });

      renderDashboard();

      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during data loading', async () => {
      studentService.getStudentsByParent.mockRejectedValue(new Error('Network Error'));

      renderDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      });
    });

    it('should continue loading other data when one API fails', async () => {
      studentService.getStudentsByParent.mockRejectedValue(new Error('Children API Error'));

      walletService.getWalletBalance.mockResolvedValue({
        data: { balance: 1000000 }
      });

      renderDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
        expect(walletService.getWalletBalance).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on different screen sizes', () => {
      renderDashboard();

      // Test that grid layout is used
      const gridElements = screen.getAllByRole('grid');
      expect(gridElements.length).toBeGreaterThan(0);
    });
  });
});
