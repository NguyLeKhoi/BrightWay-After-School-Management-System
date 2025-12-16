import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../dashboard/index.jsx';
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
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
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
    getAdminOverview: vi.fn()
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
  totalUsers: 500,
  totalBranches: 10,
  totalPackages: 50,
  totalRevenue: 100000000,
  monthlyRevenue: [
    { month: '01', revenue: 80000000 },
    { month: '02', revenue: 90000000 },
    { month: '03', revenue: 100000000 }
  ],
  branchStats: [
    { name: 'Chi nhánh A', users: 100, revenue: 20000000 },
    { name: 'Chi nhánh B', users: 80, revenue: 15000000 }
  ],
  packageStats: [
    { name: 'Gói cơ bản', count: 200 },
    { name: 'Gói nâng cao', count: 150 },
    { name: 'Gói premium', count: 100 }
  ],
  roleDistribution: [
    { name: 'Admin', count: 5 },
    { name: 'Manager', count: 20 },
    { name: 'Staff', count: 50 },
    { name: 'User', count: 425 }
  ]
};

const renderAdminDashboard = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    overviewService.getAdminOverview.mockResolvedValue(mockOverviewData);
  });

  describe('Initial Render', () => {
    it('should render dashboard with title and filters', () => {
      renderAdminDashboard();

      expect(screen.getByText('Bảng điều khiển quản trị')).toBeInTheDocument();
      expect(screen.getByText('Chọn tháng:')).toBeInTheDocument();
      expect(screen.getByText('Chọn năm:')).toBeInTheDocument();
    });

    it('should show loading initially', () => {
      renderAdminDashboard();

      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });
  });

  describe('Dashboard Data Loading', () => {
    it('should load dashboard data on mount', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(overviewService.getAdminOverview).toHaveBeenCalledWith({
          month: expect.any(Number),
          year: expect.any(Number)
        });
      });
    });

    it('should display overview statistics correctly', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument(); // total users
        expect(screen.getByText('10')).toBeInTheDocument(); // total branches
        expect(screen.getByText('50')).toBeInTheDocument(); // total packages
        expect(screen.getByText('₫100,000,000')).toBeInTheDocument(); // total revenue
      });
    });

    it('should handle API error', async () => {
      overviewService.getAdminOverview.mockRejectedValue(new Error('API Error'));

      renderAdminDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      });
    });

    it('should reload data when month/year changes', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(overviewService.getAdminOverview).toHaveBeenCalledTimes(1);
      });

      // Change month
      const monthSelect = screen.getByLabelText('Chọn tháng:');
      fireEvent.change(monthSelect, { target: { value: '6' } });

      await waitFor(() => {
        expect(overviewService.getAdminOverview).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Charts Rendering', () => {
    it('should render revenue chart', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should render branch statistics chart', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should render package statistics pie chart', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('should render role distribution chart', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display all statistics cards', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('Tổng người dùng')).toBeInTheDocument();
        expect(screen.getByText('Tổng chi nhánh')).toBeInTheDocument();
        expect(screen.getByText('Tổng gói học')).toBeInTheDocument();
        expect(screen.getByText('Tổng doanh thu')).toBeInTheDocument();
      });
    });

    it('should display correct values in statistics cards', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('₫100,000,000')).toBeInTheDocument();
      });
    });
  });

  describe('Tables and Lists', () => {
    it('should display branch statistics table', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('Chi nhánh A')).toBeInTheDocument();
        expect(screen.getByText('Chi nhánh B')).toBeInTheDocument();
      });
    });

    it('should display role distribution', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Manager')).toBeInTheDocument();
        expect(screen.getByText('Staff')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument();
      });
    });
  });

  describe('Currency and Number Formatting', () => {
    it('should format currency correctly', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('₫100,000,000')).toBeInTheDocument();
      });
    });

    it('should format numbers correctly', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      overviewService.getAdminOverview.mockRejectedValue(new Error('Network Error'));

      renderAdminDashboard();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalledWith('Network Error');
      });
    });

    it('should handle malformed data gracefully', async () => {
      overviewService.getAdminOverview.mockResolvedValue({});

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('Bảng điều khiển quản trị')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading during data fetch', () => {
      renderAdminDashboard();

      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });

    it('should hide loading after data loads', async () => {
      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument();
      });
    });
  });
});
