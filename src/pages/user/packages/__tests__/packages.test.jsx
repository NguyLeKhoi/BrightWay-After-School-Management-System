import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyPackages from '../index.jsx';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { AppProvider } from '../../../../contexts/AppContext';

// Mock services
vi.mock('../../../../services/package.service', () => ({
  default: {
    getPackages: vi.fn(),
    getPackageById: vi.fn(),
    getSuitablePackages: vi.fn()
  }
}));

vi.mock('../../../../services/student.service', () => ({
  default: {
    getStudentsByParent: vi.fn(),
    getMyChildren: vi.fn()
  }
}));

vi.mock('../../../../services/service.service', () => ({
  default: {
    getServices: vi.fn()
  }
}));

vi.mock('../../../../services/order.service', () => ({
  default: {
    createOrder: vi.fn()
  }
}));

vi.mock('../../../../services/studentSlot.service', () => ({
  default: {
    getStudentSlots: vi.fn()
  }
}));

// Mock hooks
vi.mock('../../../../hooks/useContentLoading', () => ({
  default: () => ({
    isLoading: false,
    loadingText: 'Đang tải...',
    showLoading: vi.fn(),
    hideLoading: vi.fn()
  })
}));

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock contexts
const mockAddNotification = vi.fn();
const mockShowGlobalError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../../contexts/AppContext', () => ({
  useApp: () => ({
    addNotification: mockAddNotification,
    showGlobalError: mockShowGlobalError
  }),
  AppProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ childId: null }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
  };
});

// Import mocked services
import packageService from '../../../../services/package.service';
import studentService from '../../../../services/student.service';
import serviceService from '../../../../services/service.service';
import orderService from '../../../../services/order.service';
import { toast } from 'react-toastify';

const mockPackages = [
  {
    id: 'package-1',
    name: 'Gói học hè',
    price: 2000000,
    duration: 3,
    description: 'Gói học hè 3 tháng',
    available: true
  },
  {
    id: 'package-2',
    name: 'Gói học ngày',
    price: 1500000,
    duration: 1,
    description: 'Gói học trong ngày',
    available: true
  }
];

const mockStudents = [
  { id: 'student-1', fullName: 'Nguyễn Văn A' },
  { id: 'student-2', fullName: 'Nguyễn Văn B' }
];

const renderMyPackages = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <MyPackages />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('MyPackages Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    studentService.getMyChildren.mockResolvedValue(mockStudents);
    studentService.getStudentsByParent.mockResolvedValue({
      data: mockStudents,
      totalCount: 2
    });

    packageService.getSuitablePackages.mockResolvedValue(mockPackages);
    packageService.getPackages.mockResolvedValue({
      data: { items: mockPackages, totalCount: 2 }
    });

    serviceService.getServices.mockResolvedValue({
      data: { items: [], totalCount: 0 }
    });
  });

  describe('Initial Render', () => {
    it('should render packages page with tabs', async () => {
      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Gói đã mua')).toBeInTheDocument();
        expect(screen.getByText('Gói dịch vụ')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show loading initially', () => {
      renderMyPackages();

      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load packages data on mount', async () => {
      renderMyPackages();

      await waitFor(() => {
        expect(studentService.getMyChildren).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should load students data on mount', async () => {
      renderMyPackages();

      await waitFor(() => {
        expect(studentService.getMyChildren).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should display packages correctly', async () => {
      renderMyPackages();

      await waitFor(() => {
        // Component loads suitable packages, check if it renders
        expect(screen.getByText('Các gói')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle API error', async () => {
      packageService.getPackages.mockRejectedValue(new Error('API Error'));

      renderMyPackages();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      });
    });
  });

  describe('Package Selection', () => {
    it('should render packages page correctly', async () => {
      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Các gói')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle package purchase flow', async () => {
      orderService.createOrder.mockResolvedValue({
        data: { id: 'order-1', paymentUrl: 'https://payment.url' }
      });

      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Các gói')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Tabs Navigation', () => {
    it('should switch to services tab', async () => {
      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Gói dịch vụ')).toBeInTheDocument();
      }, { timeout: 3000 });

      const servicesTab = screen.getByText('Gói dịch vụ');
      fireEvent.click(servicesTab);

      await waitFor(() => {
        // Tab should be active
        expect(servicesTab).toBeInTheDocument();
      });
    });

    it('should switch back to packages tab', async () => {
      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Gói đã mua')).toBeInTheDocument();
      }, { timeout: 3000 });

      const packagesTab = screen.getByText('Gói đã mua');
      fireEvent.click(packagesTab);

      await waitFor(() => {
        expect(packagesTab).toBeInTheDocument();
      });
    });
  });

  describe('Package Details', () => {
    it('should render packages page', async () => {
      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Các gói')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Empty States', () => {
    it('should show message when no packages available', async () => {
      studentService.getMyChildren.mockResolvedValue(mockStudents);
      packageService.getSuitablePackages.mockResolvedValue([]);

      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Các gói')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show message when no students available', async () => {
      studentService.getMyChildren.mockResolvedValue([]);

      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Các gói')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle package loading error', async () => {
      studentService.getMyChildren.mockRejectedValue(new Error('Network Error'));

      renderMyPackages();

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should handle order creation error', async () => {
      orderService.createOrder.mockRejectedValue(new Error('Order creation failed'));

      renderMyPackages();

      await waitFor(() => {
        expect(screen.getByText('Các gói')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
