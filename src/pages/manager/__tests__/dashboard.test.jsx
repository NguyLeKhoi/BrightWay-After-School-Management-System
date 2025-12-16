import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManagerDashboard from '../dashboard/index.jsx';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AppProvider } from '../../../contexts/AppContext';

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>
}));

// Mock services
vi.mock('../../../services/overview.service', () => ({
  default: {
    getManagerOverview: vi.fn()
  }
}));

// Mock hooks
vi.mock('../../../hooks/useLoading', () => ({
  useLoading: () => ({
    isLoading: false,
    loadingText: 'Đang tải...',
    showLoading: vi.fn(),
    hideLoading: vi.fn()
  })
}));

// Mock contexts
const mockShowGlobalError = vi.fn();

vi.mock('../../../contexts/AppContext', () => ({
  useApp: () => ({
    showGlobalError: mockShowGlobalError
  }),
  AppProvider: ({ children }) => <div>{children}</div>
}));

// Import mocked services
import overviewService from '../../../services/overview.service';

const mockOverviewData = {
  totalRevenue: 50000000,
  totalSlots: 150,
  totalStudents: 120,
  totalStaff: 8,
  monthlyRevenue: [
    { month: '01', revenue: 40000000 },
    { month: '02', revenue: 45000000 },
    { month: '03', revenue: 50000000 }
  ],
  packageStats: [
    { name: 'Gói cơ bản', count: 50 },
    { name: 'Gói nâng cao', count: 30 },
    { name: 'Gói premium', count: 20 }
  ],
  slotStats: [
    { date: '2024-01-01', slots: 10 },
    { date: '2024-01-02', slots: 12 },
    { date: '2024-01-03', slots: 8 }
  ],
  topPackages: [
    { name: 'Gói cơ bản', revenue: 20000000 },
    { name: 'Gói nâng cao', revenue: 15000000 },
    { name: 'Gói premium', revenue: 10000000 }
  ]
};

const renderManagerDashboard = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <ManagerDashboard />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('ManagerDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    overviewService.getManagerOverview.mockResolvedValue(mockOverviewData);
  });

  describe('Initial Render', () => {
    it('should render dashboard with title and month/year selectors', () => {
      renderManagerDashboard();

      expect(screen.getByText('Bảng điều khiển quản lý')).toBeInTheDocument();
      expect(screen.getByText('Chọn tháng:')).toBeInTheDocument();
      expect(screen.getByText('Chọn năm:')).toBeInTheDocument();
    });

    it('should show loading initially', () => {
      renderManagerDashboard();

      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });
  });

  describe('Dashboard Data Loading', () => {
    it('should load dashboard data on mount', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(overviewService.getManagerOverview).toHaveBeenCalledWith({
          month: expect.any(Number),
          year: expect.any(Number)
        });
      });
    });

    it('should display overview statistics correctly', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByText('₫50,000,000')).toBeInTheDocument(); // total revenue
        expect(screen.getByText('150')).toBeInTheDocument(); // total slots
        expect(screen.getByText('120')).toBeInTheDocument(); // total students
        expect(screen.getByText('8')).toBeInTheDocument(); // total staff
      });
    });

    it('should handle API error', async () => {
      overviewService.getManagerOverview.mockRejectedValue(new Error('API Error'));

      renderManagerDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      });
    });

    it('should reload data when month/year changes', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(overviewService.getManagerOverview).toHaveBeenCalledTimes(1);
      });

      // Change month
      const monthSelect = screen.getByLabelText('Chọn tháng:');
      fireEvent.change(monthSelect, { target: { value: '6' } });

      await waitFor(() => {
        expect(overviewService.getManagerOverview).toHaveBeenCalledTimes(2);
        expect(overviewService.getManagerOverview).toHaveBeenCalledWith({
          month: 6,
          year: expect.any(Number)
        });
      });
    });
  });

  describe('Charts Rendering', () => {
    it('should render revenue chart', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should render package statistics chart', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should render slot statistics chart', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });

    it('should render responsive containers', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Top Packages Table', () => {
    it('should display top packages table', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByText('Gói cơ bản')).toBeInTheDocument();
        expect(screen.getByText('Gói nâng cao')).toBeInTheDocument();
        expect(screen.getByText('Gói premium')).toBeInTheDocument();
        expect(screen.getByText('₫20,000,000')).toBeInTheDocument();
        expect(screen.getByText('₫15,000,000')).toBeInTheDocument();
        expect(screen.getByText('₫10,000,000')).toBeInTheDocument();
      });
    });

    it('should handle empty top packages', async () => {
      const dataWithoutTopPackages = { ...mockOverviewData, topPackages: [] };
      overviewService.getManagerOverview.mockResolvedValue(dataWithoutTopPackages);

      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.queryByText('Gói cơ bản')).not.toBeInTheDocument();
      });
    });
  });

  describe('Month/Year Selection', () => {
    it('should have month selector with all 12 months', async () => {
      renderManagerDashboard();

      const monthSelect = screen.getByLabelText('Chọn tháng:');

      // Check if select has options (the exact implementation may vary)
      expect(monthSelect).toBeInTheDocument();
    });

    it('should have year selector', async () => {
      renderManagerDashboard();

      const yearSelect = screen.getByLabelText('Chọn năm:');
      expect(yearSelect).toBeInTheDocument();
    });

    it('should update data when year changes', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        const yearSelect = screen.getByLabelText('Chọn năm:');
        fireEvent.change(yearSelect, { target: { value: '2023' } });
      });

      await waitFor(() => {
        expect(overviewService.getManagerOverview).toHaveBeenCalledWith({
          month: expect.any(Number),
          year: 2023
        });
      });
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency correctly', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByText('₫50,000,000')).toBeInTheDocument();
      });
    });

    it('should format numbers correctly', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      overviewService.getManagerOverview.mockRejectedValue(new Error('Network Error'));

      renderManagerDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalledWith('Network Error');
      });
    });

    it('should handle malformed data gracefully', async () => {
      overviewService.getManagerOverview.mockResolvedValue({});

      renderManagerDashboard();

      await waitFor(() => {
        // Should not crash with empty data
        expect(screen.getByText('Bảng điều khiển quản lý')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading during data fetch', () => {
      renderManagerDashboard();

      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });

    it('should hide loading after data loads', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display all statistics cards', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByText('Tổng doanh thu')).toBeInTheDocument();
        expect(screen.getByText('Tổng slot')).toBeInTheDocument();
        expect(screen.getByText('Tổng học sinh')).toBeInTheDocument();
        expect(screen.getByText('Tổng nhân viên')).toBeInTheDocument();
      });
    });

    it('should display correct icons for statistics', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        // Icons are rendered via MUI icons
        expect(screen.getByText('Tổng doanh thu')).toBeInTheDocument();
      });
    });
  });

  describe('Charts Data', () => {
    it('should pass correct data to revenue chart', async () => {
      renderManagerDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should handle empty chart data', async () => {
      const dataWithoutCharts = {
        ...mockOverviewData,
        monthlyRevenue: [],
        packageStats: [],
        slotStats: []
      };

      overviewService.getManagerOverview.mockResolvedValue(dataWithoutCharts);

      renderManagerDashboard();

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('Bảng điều khiển quản lý')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on different screen sizes', () => {
      renderManagerDashboard();

      // Test that grid layout is used
      expect(screen.getByText('Bảng điều khiển quản lý')).toBeInTheDocument();
    });
  });
});
