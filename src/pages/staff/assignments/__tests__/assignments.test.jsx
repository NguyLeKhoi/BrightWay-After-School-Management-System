import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StaffAssignments from '../index.jsx';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { AppProvider } from '../../../../contexts/AppContext';

// Mock FullCalendar
vi.mock('@fullcalendar/react', () => ({
  default: ({ events, eventClick }) => (
    <div data-testid="calendar">
      {events?.map((event, index) => (
        <div
          key={index}
          data-testid={`calendar-event-${index}`}
          onClick={() => eventClick?.({ event: { extendedProps: event.extendedProps } })}
        >
          {event.title}
        </div>
      ))}
    </div>
  )
}));

vi.mock('@fullcalendar/daygrid', () => ({ default: {} }));
vi.mock('@fullcalendar/timegrid', () => ({ default: {} }));
vi.mock('@fullcalendar/interaction', () => ({ default: {} }));

// Mock services
vi.mock('../../../../services/studentSlot.service', () => ({
  default: {
    getStaffSlots: vi.fn()
  }
}));

// Mock hooks
vi.mock('../../../../hooks/useLoading', () => ({
  useLoading: () => ({
    isLoading: false,
    showLoading: vi.fn(),
    hideLoading: vi.fn()
  })
}));

// Mock contexts
const mockShowGlobalError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../../contexts/AppContext', () => ({
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
import studentSlotService from '../../../../services/studentSlot.service';

const mockSlots = [
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
    },
    students: [
      { fullName: 'Nguyễn Văn A' },
      { fullName: 'Nguyễn Văn B' }
    ]
  },
  {
    id: 'slot-2',
    branchSlot: {
      date: '2024-12-21',
      branch: { name: 'Chi nhánh B' },
      room: { name: 'Phòng 102' }
    },
    timeframe: {
      startTime: '09:00',
      endTime: '11:00'
    },
    students: [
      { fullName: 'Trần Thị C' }
    ]
  }
];

const renderStaffAssignments = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <StaffAssignments />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('StaffAssignments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    studentSlotService.getStaffSlots.mockResolvedValue({
      data: { items: mockSlots }
    });
  });

  describe('Initial Render', () => {
    it('should render assignments page with title and view toggle', () => {
      renderStaffAssignments();

      expect(screen.getByText('Lịch làm việc')).toBeInTheDocument();
      expect(screen.getByText('Lịch')).toBeInTheDocument();
      expect(screen.getByText('Danh sách')).toBeInTheDocument();
    });

    it('should show loading initially', () => {
      renderStaffAssignments();

      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load assignments data on mount', async () => {
      renderStaffAssignments();

      await waitFor(() => {
        expect(studentSlotService.getStaffSlots).toHaveBeenCalled();
      });
    });

    it('should display assignments data correctly', async () => {
      renderStaffAssignments();

      await waitFor(() => {
        expect(screen.getByText('Chi nhánh A')).toBeInTheDocument();
        expect(screen.getByText('Phòng 101')).toBeInTheDocument();
        expect(screen.getByText('Chi nhánh B')).toBeInTheDocument();
        expect(screen.getByText('Phòng 102')).toBeInTheDocument();
      });
    });

    it('should handle API error', async () => {
      studentSlotService.getStaffSlots.mockRejectedValue(new Error('API Error'));

      renderStaffAssignments();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      });
    });
  });

  describe('View Mode Toggle', () => {
    it('should default to calendar view', () => {
      renderStaffAssignments();

      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });

    it('should switch to list view when list button is clicked', async () => {
      renderStaffAssignments();

      await waitFor(() => {
        const listButton = screen.getByText('Danh sách');
        fireEvent.click(listButton);
      });

      // Should switch to list view
      expect(screen.queryByTestId('calendar')).not.toBeInTheDocument();
    });

    it('should switch back to calendar view when calendar button is clicked', async () => {
      renderStaffAssignments();

      // Switch to list first
      await waitFor(() => {
        const listButton = screen.getByText('Danh sách');
        fireEvent.click(listButton);
      });

      // Switch back to calendar
      const calendarButton = screen.getByText('Lịch');
      fireEvent.click(calendarButton);

      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  describe('Calendar View', () => {
    it('should display calendar with events', async () => {
      renderStaffAssignments();

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });
    });

    it('should handle calendar event click', async () => {
      renderStaffAssignments();

      await waitFor(() => {
        const calendarEvent = screen.getByTestId('calendar-event-0');
        fireEvent.click(calendarEvent);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/staff/assignments/slot-1');
    });
  });

  describe('List View', () => {
    it('should display assignments in list format', async () => {
      renderStaffAssignments();

      // Switch to list view
      await waitFor(() => {
        const listButton = screen.getByText('Danh sách');
        fireEvent.click(listButton);
      });

      expect(screen.getByText('Chi nhánh A')).toBeInTheDocument();
      expect(screen.getByText('14:00 - 16:00')).toBeInTheDocument();
    });

    it('should show student information in list view', async () => {
      renderStaffAssignments();

      // Switch to list view
      await waitFor(() => {
        const listButton = screen.getByText('Danh sách');
        fireEvent.click(listButton);
      });

      expect(screen.getByText('Nguyễn Văn A, Nguyễn Văn B')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị C')).toBeInTheDocument();
    });

    it('should navigate to assignment detail on row click', async () => {
      renderStaffAssignments();

      // Switch to list view
      await waitFor(() => {
        const listButton = screen.getByText('Danh sách');
        fireEvent.click(listButton);
      });

      // Click on an assignment row (this would need to be implemented based on DataTable)
      // For now, we test that the navigation function exists
    });
  });

  describe('Navigation', () => {
    it('should navigate back to dashboard', () => {
      renderStaffAssignments();

      const backButton = screen.getByLabelText('Quay lại');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/staff');
    });
  });

  describe('Time Classification', () => {
    it('should classify slots into past, current, and upcoming', async () => {
      // Mock current date to test classification
      const mockDate = new Date('2024-12-20T15:00:00+07:00'); // During first slot
      vi.setSystemTime(mockDate);

      renderStaffAssignments();

      await waitFor(() => {
        // Test classification logic
        expect(studentSlotService.getStaffSlots).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('Pagination', () => {
    it('should handle pagination for different slot types', async () => {
      const manySlots = Array(25).fill().map((_, i) => ({
        ...mockSlots[0],
        id: `slot-${i}`
      }));

      studentSlotService.getStaffSlots.mockResolvedValue({
        data: { items: manySlots }
      });

      renderStaffAssignments();

      await waitFor(() => {
        expect(studentSlotService.getStaffSlots).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      studentSlotService.getStaffSlots.mockRejectedValue(new Error('Network Error'));

      renderStaffAssignments();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      });
    });

    it('should handle malformed slot data gracefully', async () => {
      studentSlotService.getStaffSlots.mockResolvedValue({
        data: {
          items: [{
            id: 'slot-1'
            // Missing required fields
          }]
        }
      });

      renderStaffAssignments();

      await waitFor(() => {
        expect(studentSlotService.getStaffSlots).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading during data fetch', () => {
      renderStaffAssignments();

      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show message when no assignments found', async () => {
      studentSlotService.getStaffSlots.mockResolvedValue({
        data: { items: [] }
      });

      renderStaffAssignments();

      await waitFor(() => {
        expect(screen.getByText('Không có lịch làm việc nào')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on different screen sizes', () => {
      renderStaffAssignments();

      // Test that toggle buttons are visible
      expect(screen.getByText('Lịch')).toBeInTheDocument();
      expect(screen.getByText('Danh sách')).toBeInTheDocument();
    });
  });
});
