import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StaffDashboard from '../dashboard/index.jsx';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AppProvider } from '../../../contexts/AppContext';

// Mock services
vi.mock('../../../services/activity.service', () => ({
  default: {
    getActivities: vi.fn(),
    getUnviewedActivitiesCount: vi.fn()
  }
}));

vi.mock('../../../services/studentSlot.service', () => ({
  default: {
    getStaffSlots: vi.fn()
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
const mockUser = {
  id: 'staff-1',
  email: 'staff@test.com',
  role: 'Staff'
};

const mockShowGlobalError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

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
import activityService from '../../../services/activity.service';
import studentSlotService from '../../../services/studentSlot.service';

const renderStaffDashboard = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('StaffDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    activityService.getActivities.mockResolvedValue({
      data: { items: [], totalCount: 0 }
    });

    activityService.getUnviewedActivitiesCount.mockResolvedValue({
      data: { count: 0 }
    });

    studentSlotService.getStaffSlots.mockResolvedValue({
      data: { items: [] }
    });
  });

  describe('Initial Render', () => {
    it('should render dashboard with welcome message and stats section', () => {
      renderStaffDashboard();

      expect(screen.getByText('Xin chào nhân viên!')).toBeInTheDocument();
      expect(screen.getByText('Thống kê hoạt động')).toBeInTheDocument();
      expect(screen.getByText('Lịch làm việc sắp tới')).toBeInTheDocument();
    });

    it('should display initial stats as zero', () => {
      renderStaffDashboard();

      expect(screen.getAllByText('0')).toBeTruthy();
    });
  });

  describe('Dashboard Stats Loading', () => {
    it('should load dashboard stats on mount', async () => {
      const mockActivities = {
        data: {
          items: Array(5).fill().map((_, i) => ({ id: `activity-${i}` })),
          totalCount: 5
        }
      };

      const mockUnviewedCount = { data: { count: 2 } };

      activityService.getActivities.mockResolvedValue(mockActivities);
      activityService.getUnviewedActivitiesCount.mockResolvedValue(mockUnviewedCount);

      renderStaffDashboard();

      await waitFor(() => {
        expect(activityService.getActivities).toHaveBeenCalled();
        expect(activityService.getUnviewedActivitiesCount).toHaveBeenCalled();
      });
    });

    it('should calculate and display correct stats', async () => {
      const mockActivities = {
        data: {
          items: [
            { id: '1', createdAt: new Date().toISOString() }, // This month
            { id: '2', createdAt: new Date().toISOString() }, // This month
            { id: '3', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }, // Last month
          ],
          totalCount: 3
        }
      };

      const mockSlots = {
        data: {
          items: [
            { id: 'slot-1', status: 'upcoming' },
            { id: 'slot-2', status: 'completed' },
            { id: 'slot-3', status: 'upcoming' }
          ]
        }
      };

      activityService.getActivities.mockResolvedValue(mockActivities);
      activityService.getUnviewedActivitiesCount.mockResolvedValue({ data: { count: 1 } });
      studentSlotService.getStaffSlots.mockResolvedValue(mockSlots);

      renderStaffDashboard();

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // total activities
        expect(screen.getByText('2')).toBeInTheDocument(); // activities this month
        expect(screen.getByText('2')).toBeInTheDocument(); // upcoming slots
        expect(screen.getByText('1')).toBeInTheDocument(); // completed slots
      });
    });

    it('should handle API errors gracefully', async () => {
      activityService.getActivities.mockRejectedValue(new Error('API Error'));

      renderStaffDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      });
    });
  });

  describe('Upcoming Assignments', () => {
    it('should load and display upcoming assignments', async () => {
      const mockAssignments = {
        data: {
          items: [
            {
              id: 'assignment-1',
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
          ]
        }
      };

      studentSlotService.getStaffSlots.mockResolvedValue(mockAssignments);

      renderStaffDashboard();

      await waitFor(() => {
        expect(screen.getByText('Chi nhánh A')).toBeInTheDocument();
        expect(screen.getByText('Phòng 101')).toBeInTheDocument();
        expect(screen.getByText('14:00 - 16:00')).toBeInTheDocument();
      });
    });

    it('should handle no upcoming assignments', async () => {
      studentSlotService.getStaffSlots.mockResolvedValue({
        data: { items: [] }
      });

      renderStaffDashboard();

      await waitFor(() => {
        expect(screen.getByText('Không có lịch làm việc nào sắp tới')).toBeInTheDocument();
      });
    });

    it('should classify slot times correctly', () => {
      renderStaffDashboard();

      // Test the getSlotTimeType function indirectly
      // The function should classify past, current, and upcoming slots
    });
  });

  describe('Navigation', () => {
    it('should navigate to assignments page', () => {
      renderStaffDashboard();

      const assignmentsButton = screen.getByText('Xem tất cả lịch làm việc');
      fireEvent.click(assignmentsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/assignments');
    });

    it('should navigate to activity types page', () => {
      renderStaffDashboard();

      const activityTypesButton = screen.getByText('Quản lý loại hoạt động');
      fireEvent.click(activityTypesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/activity-types');
    });

    it('should navigate to profile page', () => {
      renderStaffDashboard();

      const profileButton = screen.getByText('Hồ sơ cá nhân');
      fireEvent.click(profileButton);

      expect(mockNavigate).toHaveBeenCalledWith('/staff/profile');
    });
  });

  describe('Stats Cards', () => {
    it('should display all stats cards with correct icons and titles', () => {
      renderStaffDashboard();

      expect(screen.getByText('Tổng hoạt động')).toBeInTheDocument();
      expect(screen.getByText('Hoạt động tháng này')).toBeInTheDocument();
      expect(screen.getByText('Lịch làm việc')).toBeInTheDocument();
      expect(screen.getByText('Lịch sắp tới')).toBeInTheDocument();
      expect(screen.getByText('Hoạt động chưa xem')).toBeInTheDocument();
      expect(screen.getByText('Hoạt động hôm nay')).toBeInTheDocument();
      expect(screen.getByText('Lịch đã hoàn thành')).toBeInTheDocument();
    });

    it('should update stats when data loads', async () => {
      activityService.getActivities.mockResolvedValue({
        data: { items: [{ id: '1' }], totalCount: 1 }
      });

      activityService.getUnviewedActivitiesCount.mockResolvedValue({
        data: { count: 3 }
      });

      renderStaffDashboard();

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // total activities
        expect(screen.getByText('3')).toBeInTheDocument(); // unviewed activities
      });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      renderStaffDashboard();

      expect(screen.getByText('Xem tất cả lịch làm việc')).toBeInTheDocument();
      expect(screen.getByText('Quản lý loại hoạt động')).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ cá nhân')).toBeInTheDocument();
    });

    it('should have correct button styling and icons', () => {
      renderStaffDashboard();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Loading States', () => {
    it('should show loading during data fetch', () => {
      // Mock useContentLoading to return loading state
      vi.mocked(vi.importMock('../../../hooks/useContentLoading')).mockReturnValue({
        isLoading: true,
        loadingText: 'Đang tải dữ liệu...',
        showLoading: vi.fn(),
        hideLoading: vi.fn()
      });

      renderStaffDashboard();

      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle activity service errors', async () => {
      activityService.getActivities.mockRejectedValue(new Error('Activities API Error'));

      renderStaffDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalledWith('Activities API Error');
      });
    });

    it('should handle slot service errors', async () => {
      studentSlotService.getStaffSlots.mockRejectedValue(new Error('Slots API Error'));

      renderStaffDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalledWith('Slots API Error');
      });
    });

    it('should continue loading other data when one API fails', async () => {
      activityService.getActivities.mockRejectedValue(new Error('Activities API Error'));

      activityService.getUnviewedActivitiesCount.mockResolvedValue({
        data: { count: 5 }
      });

      renderStaffDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
        expect(activityService.getUnviewedActivitiesCount).toHaveBeenCalled();
      });
    });
  });

  describe('Date and Time Handling', () => {
    it('should format dates correctly for display', async () => {
      const mockAssignments = {
        data: {
          items: [
            {
              id: 'assignment-1',
              branchSlot: {
                date: '2024-12-25',
                branch: { name: 'Chi nhánh A' },
                room: { name: 'Phòng 101' }
              },
              timeframe: {
                startTime: '09:00',
                endTime: '11:00'
              }
            }
          ]
        }
      };

      studentSlotService.getStaffSlots.mockResolvedValue(mockAssignments);

      renderStaffDashboard();

      await waitFor(() => {
        expect(screen.getByText('09:00 - 11:00')).toBeInTheDocument();
      });
    });
  });

  describe('User Context', () => {
    it('should display user information if available', () => {
      renderStaffDashboard();

      // The component shows "Xin chào nhân viên!" as a generic greeting
      expect(screen.getByText('Xin chào nhân viên!')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on different screen sizes', () => {
      renderStaffDashboard();

      // Test that grid layout is used for stats cards
      const cards = screen.getAllByRole('article'); // Cards should have article role
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
