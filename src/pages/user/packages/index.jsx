import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  ChildCare as ChildIcon,
  Inventory as PackageIcon,
  Receipt as ServiceIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { Box, Typography, Chip, Select, MenuItem, FormControl, InputLabel, Button, Alert } from '@mui/material';
import ContentLoading from '@components/Common/ContentLoading';
import Tabs from '@components/Common/Tabs';
import Card from '@components/Common/Card';
import ManagementFormDialog from '@components/Management/FormDialog';
import Form from '@components/Common/Form';
import ConfirmDialog from '@components/Common/ConfirmDialog';
import { useApp } from '../../../contexts/AppContext';
import useContentLoading from '../../../hooks/useContentLoading';
import packageService from '../../../services/package.service';
import adminService from '../../../services/admin.service';
import studentService from '../../../services/student.service';
import serviceService from '../../../services/service.service';
import orderService from '../../../services/order.service';
import studentSlotService from '../../../services/studentSlot.service';
import * as yup from 'yup';
import styles from './Packages.module.css';

const buyPackageSchema = yup.object().shape({
  studentId: yup.string().required('Vui lòng chọn con')
});

const getFieldWithFallback = (source, candidates, defaultValue = 0) => {
  if (!source) return defaultValue;
  
  for (const key of candidates) {
    if (key in source && source[key] !== null && source[key] !== undefined) {
      return source[key];
    }
  }
  
  return defaultValue;
};

const MyPackages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { childId } = useParams();
  const [searchParams] = useSearchParams();
  const isInitialMount = useRef(true);
  const selectedStudentId = childId || searchParams.get('studentId');
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl && ['available', 'purchased'].includes(tabFromUrl) ? tabFromUrl : 'purchased');

  const [availablePackages, setAvailablePackages] = useState([]);
  const [purchasedPackages, setPurchasedPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isLoadingPurchased, setIsLoadingPurchased] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [error, setError] = useState(null);
  const [availableError, setAvailableError] = useState(null);
  const [servicesError, setServicesError] = useState(null);
  
  // Buy package dialog state
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [children, setChildren] = useState([]);
  const [hasChildren, setHasChildren] = useState(false);
  const [buyForm, setBuyForm] = useState({
    studentId: ''
  });
  const [isBuying, setIsBuying] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [refundDialog, setRefundDialog] = useState({
    open: false,
    package: null,
    policy: null,
    loading: false
  });
  const [isRefunding, setIsRefunding] = useState(false);
  const [renewDialog, setRenewDialog] = useState({
    open: false,
    package: null,
    policy: null,
    loading: false
  });
  const [isRenewing, setIsRenewing] = useState(false);
  const [upgradeDialog, setUpgradeDialog] = useState({
    open: false,
    package: null,
    studentId: null,
    policy: null,
    loading: false
  });

  // Buy service dialog state
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [orderForm, setOrderForm] = useState({
    childId: '',
    studentSlotId: '',
    quantity: 1
  });
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccessInfo, setOrderSuccessInfo] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [studentSlots, setStudentSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [childrenError, setChildrenError] = useState(null);

  const { showGlobalError, addNotification } = useApp();
  const { isLoading: isPageLoading, loadingText, showLoading, hideLoading } = useContentLoading();

  // Load available packages (suitable packages) from API
  const loadAvailablePackages = useCallback(async () => {
    setIsLoadingAvailable(true);
    setAvailableError(null);

    try {
      // Fetch all children of current user
      const children = await studentService.getMyChildren();
      
      if (!Array.isArray(children) || children.length === 0) {
        setAvailablePackages([]);
        setHasChildren(false);
        return;
      }
      
      setHasChildren(true);

      // If studentId is provided in query params, filter by that student's branch
      let targetChildren = children;
      let targetBranchId = null;
      let targetBranchName = null;

      if (selectedStudentId) {
        const selectedChild = children.find(child => child.id === selectedStudentId);
        if (selectedChild) {
          targetChildren = [selectedChild];
          targetBranchId = selectedChild.branchId || selectedChild.branch?.id;
          targetBranchName = selectedChild.branchName || selectedChild.branch?.branchName;
        }
      }

      // Fetch suitable packages for target children
      const packagesPromises = targetChildren.map(child => 
        packageService.getSuitablePackages(child.id)
      );

      const packagesArrays = await Promise.all(packagesPromises);
      
      // Flatten and remove duplicates by package ID, filter by branch if needed
      const allPackages = [];
      const seenPackageIds = new Set();
      
      packagesArrays.forEach((packages) => {
        if (Array.isArray(packages)) {
          packages.forEach(pkg => {
            // Only add if we haven't seen this package ID before
            if (!seenPackageIds.has(pkg.id)) {
              // If filtering by branch, check if package belongs to that branch
              if (targetBranchId) {
                const pkgBranchId = pkg.branchId || pkg.branch?.id;
                if (pkgBranchId && pkgBranchId !== targetBranchId) {
                  return; // Skip packages from different branches
                }
              }

              seenPackageIds.add(pkg.id);
              
              // Map API response to component format
              const totalSlots = getFieldWithFallback(pkg, [
                'totalSlots',
                'totalslots',
                'totalSlot',
                'totalslot',
                'slotTotal',
                'slotsTotal',
                'slots',
                'slotCount'
              ], 0);
              
              const durationInMonths = getFieldWithFallback(pkg, [
                'durationInMonths',
                'durationmonths',
                'durationMonth',
                'durationMonths',
                'duration',
                'monthsDuration'
              ], 0);

              allPackages.push({
                id: pkg.id,
                name: pkg.name || 'Gói không tên',
                desc: pkg.desc || '',
                price: pkg.price || 0,
                durationInMonths,
                totalSlots,
                branch: pkg.branch 
                  ? { 
                      id: pkg.branch.id || pkg.branchId,
                      branchName: pkg.branch.branchName || pkg.branchName || '' 
                    }
                  : { 
                      id: pkg.branchId,
                      branchName: pkg.branchName || '' 
                    },
                studentLevel: pkg.studentLevel 
                  ? { levelName: pkg.studentLevel.name || pkg.studentLevel.levelName || '' } 
                  : { levelName: pkg.studentLevelName || '' },
                benefits: Array.isArray(pkg.benefits) 
                  ? pkg.benefits.map(b => ({ name: b.name || '' }))
                  : [],
                status: pkg.isActive !== false // Default to true if not specified
              });
            }
          });
        }
      });

      setAvailablePackages(allPackages);
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể tải danh sách gói dịch vụ';
      
      setAvailableError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingAvailable(false);
    }
  }, [showGlobalError, selectedStudentId]);

  // Load purchased packages (subscriptions) from API
  const loadPurchasedPackages = useCallback(async () => {
    setIsLoadingPurchased(true);
    setError(null);

    try {
      // Fetch all children of current user
      const children = await studentService.getMyChildren();
      
      if (!Array.isArray(children) || children.length === 0) {
        setPurchasedPackages([]);
        setHasChildren(false);
        return;
      }
      
      setHasChildren(true);

      // Create a map of studentId to student info (including branch)
      const childrenMap = new Map();
      children.forEach(child => {
        childrenMap.set(child.id, {
          id: child.id,
          name: child.name || child.userName || 'Không tên',
          branchName: child.branchName || child.branch?.branchName || '',
          levelName: child.studentLevelName || child.studentLevel?.levelName || ''
        });
      });

      // Filter by selectedStudentId if provided
      let targetChildren = children;
      if (selectedStudentId || childId) {
        const targetStudentId = selectedStudentId || childId;
        const selectedChild = children.find(child => child.id === targetStudentId);
        if (selectedChild) {
          targetChildren = [selectedChild];
        }
      }

      // Fetch subscriptions for target children only
      const subscriptionPromises = targetChildren.map(async (child) => {
        try {
          const subscriptionResponse = await packageService.getSubscriptionsByStudent(child.id);
          return { childId: child.id, subscriptionResponse };
        } catch {
          return { childId: child.id, subscriptionResponse: null };
        }
      });

      const subscriptionResults = await Promise.all(subscriptionPromises);
      
      // Flatten and map subscriptions to component format
      const mappedPackages = [];
      
      // Dùng for...of thay vì forEach để có thể dùng await
      for (const { childId, subscriptionResponse } of subscriptionResults) {
        if (!subscriptionResponse) continue;
        
        const childInfo = childrenMap.get(childId);
        if (!childInfo) continue;
        
        // API có thể trả về object hoặc array
        let subscriptions = [];
        if (Array.isArray(subscriptionResponse)) {
          subscriptions = subscriptionResponse;
        } else if (subscriptionResponse && typeof subscriptionResponse === 'object') {
          // Nếu là object, có thể là single subscription hoặc có items property
          if (subscriptionResponse.items && Array.isArray(subscriptionResponse.items)) {
            subscriptions = subscriptionResponse.items;
          } else {
            // Single subscription object - kiểm tra xem có phải là subscription object không
            if (subscriptionResponse.id || subscriptionResponse.packageName) {
              subscriptions = [subscriptionResponse];
            }
          }
        }
        
        // Fetch package details for subscriptions that need it
        // Thay vì dùng getPackageById (bị 403), dùng getSuitablePackages cho studentId
        // Tối ưu: chỉ fetch một lần cho mỗi child, không fetch nhiều lần cho mỗi subscription
        let suitablePackagesForChild = null;
        const needsPackageDetails = subscriptions.some(sub => {
          // Check cả camelCase và lowercase
          const totalSlotsSnapshot = sub.totalSlotsSnapshot ?? sub.totalslotsSnapshot;
          const durationMonthsSnapshot = sub.durationMonthsSnapshot ?? sub.durationmonthsSnapshot;
          const needsTotalSlots = totalSlotsSnapshot === null || totalSlotsSnapshot === undefined;
          const needsDuration = durationMonthsSnapshot === null || durationMonthsSnapshot === undefined;
          return (needsTotalSlots || needsDuration) && sub.packageId;
        });
        
        if (needsPackageDetails && childId) {
          try {
            // Fetch suitable packages một lần cho child
            suitablePackagesForChild = await packageService.getSuitablePackages(childId);
          } catch {
            // Silently fail - package details will be null
          }
        }
        
        // Map subscriptions với package details
        const subscriptionsWithPackageDetails = subscriptions.map((sub) => {
          let packageDetails = null;
          
          // Tìm package có id trùng với packageId trong subscription
          if (suitablePackagesForChild) {
            if (Array.isArray(suitablePackagesForChild)) {
              packageDetails = suitablePackagesForChild.find(pkg => pkg.id === sub.packageId);
            } else if (suitablePackagesForChild.id === sub.packageId) {
              packageDetails = suitablePackagesForChild;
            }
          }
          
          return { sub, packageDetails };
        });
        
        subscriptionsWithPackageDetails.forEach(({ sub, packageDetails }) => {
          // Ưu tiên dùng snapshot từ subscription, nếu null/undefined thì dùng từ package details
          // Xử lý cả camelCase và lowercase cho totalSlotsSnapshot
          const totalSlotsSnapshot = sub.totalSlotsSnapshot ?? sub.totalslotsSnapshot;
          
          // Lấy totalSlots từ package - ưu tiên totalslots (lowercase) như trong available packages
          const totalSlotsFromPackage = packageDetails?.totalslots 
            ?? packageDetails?.totalSlots 
            ?? packageDetails?.totalSlotsSnapshot
            ?? 0;
          
          // Kiểm tra snapshot trước, nếu null/undefined thì dùng từ package
          // Không check !== 0 vì 0 có thể là giá trị hợp lệ
          const totalSlots = (totalSlotsSnapshot !== null && totalSlotsSnapshot !== undefined) 
            ? totalSlotsSnapshot 
            : totalSlotsFromPackage;
          
          // Lấy durationInMonths từ package - ưu tiên durationInMonths (camelCase)
          const durationInMonthsFromPackage = packageDetails?.durationInMonths 
            ?? packageDetails?.durationmonths 
            ?? packageDetails?.durationMonthsSnapshot
            ?? 0;
          
          // Xử lý cả camelCase và lowercase cho durationMonthsSnapshot
          const durationMonthsSnapshot = sub.durationMonthsSnapshot ?? sub.durationmonthsSnapshot;
          
          // Kiểm tra snapshot trước, nếu null/undefined thì dùng từ package
          // Không check !== 0 vì 0 có thể là giá trị hợp lệ
          const durationInMonths = (durationMonthsSnapshot !== null && durationMonthsSnapshot !== undefined)
            ? durationMonthsSnapshot
            : durationInMonthsFromPackage;
          
          // Xử lý cả camelCase và lowercase cho usedSlot
          const usedSlots = sub.usedSlot ?? sub.usedslot ?? 0;
          const remainingSlots = Math.max(0, totalSlots - usedSlots);
          
          // Lấy branch và level từ package nếu chưa có từ student
          const branchName = childInfo.branchName || packageDetails?.branch?.branchName || '';
          const levelName = childInfo.levelName || packageDetails?.studentLevel?.name || '';
          
          // Ưu tiên lấy benefits từ subscription, nếu không có thì lấy từ packageDetails
          const benefits = sub.benefits && Array.isArray(sub.benefits) && sub.benefits.length > 0
            ? sub.benefits
            : (packageDetails?.benefits || []);
          
          mappedPackages.push({
            id: sub.id,
            name: sub.packageName || packageDetails?.name || 'Gói không tên',
            desc: packageDetails?.desc || '', // Lấy desc từ package nếu có
            price: sub.priceFinal ?? packageDetails?.price ?? 0,
            durationInMonths: durationInMonths,
            totalSlots: totalSlots,
            usedSlots: usedSlots,
            remainingSlots: remainingSlots,
            purchasedDate: sub.startDate,
            expiryDate: sub.endDate,
            childName: sub.studentName || childInfo.name,
            studentId: sub.studentId || childId,
            branch: { 
              branchName: branchName
            },
            studentLevel: { 
              levelName: levelName
            },
            status: sub.status?.toLowerCase() === 'active' ? 'active' : 'expired',
            benefits: benefits // Ưu tiên từ subscription, sau đó từ package
          });
        });
      }

      // Filter by selectedStudentId if provided (additional check to ensure only correct student's packages)
      let packagesToFilter = mappedPackages;
      if (selectedStudentId || childId) {
        const targetStudentId = selectedStudentId || childId;
        packagesToFilter = mappedPackages.filter(pkg => {
          const pkgStudentId = pkg.studentId;
          return pkgStudentId === targetStudentId;
        });
      }

      // Lọc bỏ các gói đã hết hạn hoặc đã refund
      const filteredPackages = packagesToFilter.filter(pkg => {
        // Bỏ các gói đã hết hạn
        if (pkg.status === 'expired') {
          return false;
        }
        
        // Bỏ các gói có status là 'refunded' hoặc 'Refunded'
        const statusLower = (pkg.status || '').toLowerCase();
        if (statusLower === 'refunded' || statusLower === 'refund') {
          return false;
        }
        
        return true;
      });

      setPurchasedPackages(filteredPackages);
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể tải danh sách gói đã mua';
      
      setError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingPurchased(false);
    }
  }, [showGlobalError, selectedStudentId, childId]);

  const loadServices = useCallback(async () => {
    setIsLoadingServices(true);
    setServicesError(null);

    try {
      // First, get children to get studentId
      const childrenList = await studentService.getMyChildren();
      const childrenArray = Array.isArray(childrenList) ? childrenList : [];
      
      if (childrenArray.length === 0) {
        setServices([]);
        setServicesError('Bạn chưa có trẻ em nào. Vui lòng thêm trẻ em trước.');
        return;
      }

      // Use the first child to get add-ons (all children should be in the same branch)
      const firstChild = childrenArray[0];
      if (!firstChild?.id) {
        setServices([]);
        setServicesError('Không tìm thấy thông tin trẻ em.');
        return;
      }

      // Get add-ons for the first child
      const response = await serviceService.getAddOnsForStudent(firstChild.id);
      const items = Array.isArray(response) ? response : [];

      const mappedServices = items.map((service) => ({
        id: service.serviceId || service.id,
        name: service.name || 'Dịch vụ không tên',
        type: service.serviceType || 'Dịch vụ bổ sung',
        isActive: service.isActive !== false,
        description: service.description || service.desc || '',
        price: service.priceOverride ?? service.price ?? service.effectivePrice ?? 0,
        effectivePrice: service.effectivePrice ?? service.priceOverride ?? service.price ?? 0,
        priceOverride: service.priceOverride,
        benefits: service.benefits || [],
        note: service.note || ''
      }));

      setServices(mappedServices);
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể tải danh sách dịch vụ';

      setServicesError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingServices(false);
    }
  }, [showGlobalError]);

  // Load children list
  const loadChildren = async () => {
    try {
      const childrenList = await studentService.getMyChildren();
      const childrenArray = Array.isArray(childrenList) ? childrenList : [];
      setChildren(childrenArray);
      setHasChildren(childrenArray.length > 0);
    } catch {
      // Silently fail
      setHasChildren(false);
    }
  };

  useEffect(() => {
    loadAvailablePackages();
    loadPurchasedPackages();
    loadServices();
    loadChildren();
  }, []);

  // Update activeTab when tab query param changes
  useEffect(() => {
    if (tabFromUrl && ['available', 'purchased'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Redirect if no childId
  useEffect(() => {
    if (!childId && !selectedStudentId) {
      navigate('/user/management/packages');
    }
  }, [childId, selectedStudentId, navigate]);

  // Reload data when navigate back to this page or when studentId changes
  useEffect(() => {
    if (location.pathname.includes('/management/packages')) {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      loadAvailablePackages();
      loadPurchasedPackages();
      loadServices();
      loadChildren();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, selectedStudentId]);

  // Handle buy package
  const handleBuyClick = (pkg) => {
    setSelectedPackage(pkg);
    
    // Tự động chọn con nếu:
    // 1. Có childId trong URL (selectedStudentId)
    // 2. Hoặc chỉ có 1 con trong danh sách
    let autoSelectedStudentId = '';
    if (selectedStudentId) {
      autoSelectedStudentId = selectedStudentId;
    } else if (children.length === 1) {
      autoSelectedStudentId = children[0].id;
    }
    
    setBuyForm({
      studentId: autoSelectedStudentId
    });
    setShowBuyDialog(true);
  };

  const handleBuyPackage = async (data) => {
    if (!selectedPackage) return;

    setIsBuying(true);
    showLoading();

    try {
      // Always use current date as start date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateISO = today.toISOString();
      
      await packageService.buyPackageForChild({
        packageId: selectedPackage.id,
        studentId: data.studentId,
        startDate: startDateISO
      });

      addNotification({
        message: 'Mua gói thành công!',
        severity: 'success'
      });

      setShowBuyDialog(false);
      setSelectedPackage(null);
      setBuyForm({
        studentId: ''
      });
      
      // Always refresh purchased packages list after successful purchase
        await loadPurchasedPackages();
      
      // Also refresh available packages to update counts
      await loadAvailablePackages();
      
      // Switch to purchased tab to show the newly purchased package
      setActiveTab('purchased');
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể mua gói';
      
      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsBuying(false);
      hideLoading();
    }
  };

  const handleRefundClick = (pkg) => {
    // Open refund dialog and fetch refund policy from admin endpoint
    setRefundDialog({ open: true, package: pkg, policy: null, loading: true });

    adminService.getPackageRefundSettings()
      .then((res) => {
        setRefundDialog((prev) => ({ ...prev, policy: res, loading: false }));
      })
      .catch((err) => {
        setRefundDialog((prev) => ({ ...prev, policy: null, loading: false }));
        addNotification({ message: 'Không thể tải chính sách hoàn tiền', severity: 'warning' });
      });
  };

  const handleRenewClick = (pkg) => {
    // Open dialog and fetch renewal policy from admin endpoint
    setRenewDialog({ open: true, package: pkg, policy: null, loading: true });

    adminService.getPackageRenewalSettings()
      .then((res) => {
        setRenewDialog((prev) => ({ ...prev, policy: res, loading: false }));
      })
      .catch((err) => {
        setRenewDialog((prev) => ({ ...prev, policy: null, loading: false }));
        addNotification({ message: 'Không thể tải chính sách gia hạn', severity: 'warning' });
      });
  };

  const handleConfirmRenew = async () => {
    if (!renewDialog.package) return;

    const pkg = renewDialog.package;
    const studentId = pkg.studentId || selectedStudentId || childId;

    if (!studentId) {
      addNotification({ message: 'Không xác định học sinh để gia hạn', severity: 'error' });
      setRenewDialog({ open: false, package: null });
      return;
    }

    showLoading();
    setIsRenewing(true);

    try {
      await packageService.renewSubscription(studentId);

      addNotification({ message: 'Gia hạn gói thành công!', severity: 'success' });

      setRenewDialog({ open: false, package: null });
      await loadPurchasedPackages();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err?.message || err?.error || 'Không thể gia hạn gói';
      showGlobalError(errorMessage);
      addNotification({ message: errorMessage, severity: 'error' });
    } finally {
      setIsRenewing(false);
      hideLoading();
    }
  };

  const handleConfirmRefund = async () => {
    if (!refundDialog.package) return;

    const pkg = refundDialog.package;
    const p = refundDialog.policy || {};

    // Determine eligibility for full refund: usedSlots <= fullRefundMaxSlots (default 0)
    const fullMax = Number(p.fullRefundMaxSlots ?? 0);
    const usedSlots = Number(pkg.usedSlots ?? 0);
    const eligibleFullRefund = usedSlots <= fullMax;

    if (!eligibleFullRefund) {
      addNotification({ message: 'Gói không đủ điều kiện hoàn tiền đầy đủ.', severity: 'error' });
      setRefundDialog({ open: false, package: null, policy: null, loading: false });
      return;
    }

    showLoading();
    setIsRefunding(true);

    try {
      await packageService.refundPackageSubscription(pkg.id);

      addNotification({ message: 'Hoàn tiền gói thành công!', severity: 'success' });

      setRefundDialog({ open: false, package: null, policy: null, loading: false });
      await loadPurchasedPackages();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err?.message || err?.error || 'Không thể hoàn tiền gói';
      showGlobalError(errorMessage);
      addNotification({ message: errorMessage, severity: 'error' });
    } finally {
      setIsRefunding(false);
      hideLoading();
    }
  };



  const handleUpgradeClick = (pkg) => {
    const studentId = selectedStudentId || childId;
    if (!studentId) {
      addNotification({
        message: 'Vui lòng chọn con để nâng cấp gói.',
        severity: 'warning'
      });
      return;
    }

    // Open dialog and fetch upgrade policy
    setUpgradeDialog({ open: true, package: pkg, studentId: studentId, policy: null, loading: true });
    adminService.getPackageUpgradeSettings()
      .then((res) => {
        setUpgradeDialog((prev) => ({ ...prev, policy: res, loading: false }));
      })
      .catch(() => {
        setUpgradeDialog((prev) => ({ ...prev, policy: null, loading: false }));
        addNotification({ message: 'Không thể tải chính sách nâng cấp', severity: 'warning' });
      });
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradeDialog.package || !upgradeDialog.studentId) return;

    setIsUpgrading(true);
    showLoading();

    try {
      await packageService.upgradeSubscription(
        upgradeDialog.studentId,
        upgradeDialog.package.id
      );

      addNotification({
        message: 'Nâng cấp gói thành công!',
        severity: 'success'
      });

      setUpgradeDialog({ open: false, package: null, studentId: null });
      
      // Reload both lists
      await loadPurchasedPackages();
      await loadAvailablePackages();
      
      // Switch to purchased tab to show the upgraded package
      setActiveTab('purchased');
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể nâng cấp gói';
      
      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsUpgrading(false);
      hideLoading();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Service order handlers
  const handleOrderClick = (service) => {
    setSelectedService(service);
    setOrderForm({
      childId: '',
      studentSlotId: '',
      quantity: 1
    });
    setShowOrderDialog(true);
    setStudentSlots([]);
    setSlotsError(null);
    if (children.length === 0) {
      loadServiceChildren();
    }
  };

  const loadServiceChildren = async () => {
    setIsLoadingChildren(true);
    setChildrenError(null);
    try {
      const response = await studentService.getMyChildren();
      const items = Array.isArray(response) ? response : [];
      setChildren(items);
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Không thể tải danh sách con';
      setChildrenError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const loadStudentSlots = async (childId) => {
    if (!childId) {
      setStudentSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    setSlotsError(null);
    try {
      const response = await studentSlotService.getStudentSlots({
        pageIndex: 1,
        pageSize: 50,
        studentId: childId,
        status: 'booked',
        upcomingOnly: true
      });

      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
          ? response.items
          : [];

      const mapped = items.map((slot) => ({
        id: slot.id,
        date: slot.date,
        status: slot.status,
        parentNote: slot.parentNote,
        branchSlotId: slot.branchSlotId,
        roomId: slot.roomId
      }));

      setStudentSlots(mapped);
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Không thể tải lịch giữ trẻ đã đặt';
      setSlotsError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleChildChange = (childId) => {
    setOrderForm((prev) => ({
      ...prev,
      childId,
      studentSlotId: ''
    }));
    loadStudentSlots(childId);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) return;

    if (!orderForm.childId) {
      addNotification({
        message: 'Vui lòng chọn trẻ em.',
        severity: 'warning'
      });
      return;
    }

    if (!orderForm.studentSlotId) {
      addNotification({
        message: 'Vui lòng chọn lịch giữ trẻ đã đặt.',
        severity: 'warning'
      });
      return;
    }

    if (orderForm.quantity <= 0) {
      addNotification({
        message: 'Số lượng phải lớn hơn 0.',
        severity: 'warning'
      });
      return;
    }

    setIsOrdering(true);
    try {
      const response = await orderService.createOrder({
        studentSlotId: orderForm.studentSlotId,
        items: [
          {
            serviceId: selectedService.id,
            quantity: orderForm.quantity
          }
        ]
      });

      setOrderSuccessInfo({
        orderId: response?.orderId || response?.id,
        orderTotal:
          response?.totalAmount ||
          selectedService.effectivePrice * orderForm.quantity,
        childName:
          children.find((child) => child.id === orderForm.childId)?.name ||
          children.find((child) => child.id === orderForm.childId)?.userName ||
          'Không tên'
      });
      setPaymentResult(null);
      setShowOrderDialog(false);
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Không thể tạo đơn dịch vụ';
      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsOrdering(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const tabs = [
    { id: 'purchased', label: `Gói đã mua (${purchasedPackages.length})` },
    { id: 'available', label: `Gói dịch vụ (${availablePackages.length})` }
  ];

  // Get current active package price for comparison
  const currentActivePackage = useMemo(() => {
    if (!selectedStudentId) {
      // If no specific student selected, find the first active package
      return purchasedPackages.find(pkg => pkg.status === 'active');
    }
    // Find active package for selected student
    return purchasedPackages.find(pkg => 
      pkg.status === 'active' && 
      (pkg.studentId === selectedStudentId || pkg.studentId === childId)
    );
  }, [purchasedPackages, selectedStudentId, childId]);

  const renderPackageCard = (pkg, isPurchased = false, canUpgrade = false) => (
    <div key={pkg.id} className={styles.packageCard}>
      <div className={styles.packageHeader}>
        <h3 className={styles.packageName}>{pkg.name}</h3>
        {isPurchased ? (
          <span className={`${styles.statusBadge} ${styles[pkg.status]}`}>
            {pkg.status === 'active' ? 'Đang sử dụng' : 'Đã hết hạn'}
          </span>
        ) : (
          pkg.status && (
            <span className={styles.statusBadge}>Hoạt động</span>
          )
        )}
      </div>

      <div className={styles.packagePrice}>
        <span className={styles.priceLabel}>Giá:</span>
        <span className={styles.priceValue}>{formatCurrency(pkg.price)}</span>
      </div>

      <div className={styles.packageInfo}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Thời hạn:</span>
          <span className={styles.infoValue}>{pkg.durationInMonths} tháng</span>
        </div>
        {!isPurchased && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Số slot:</span>
            <span className={styles.infoValue}>{pkg.totalSlots}</span>
          </div>
        )}
        {isPurchased && pkg.usedSlots !== undefined && pkg.totalSlots !== undefined && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Đã dùng:</span>
            <span className={styles.infoValue}>
              {pkg.usedSlots}/{pkg.totalSlots} slot
            </span>
          </div>
        )}
      </div>

      {/* Benefits - chỉ hiển thị 3 lợi ích đầu tiên */}
      {pkg.benefits && pkg.benefits.length > 0 && (
        <div className={styles.benefitsSection}>
          <ul className={styles.benefitsList}>
            {pkg.benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className={styles.benefitItem}>
                <span className={styles.benefitIcon}>✓</span>
                {benefit.name || benefit}
              </li>
            ))}
            {pkg.benefits.length > 3 && (
              <li className={styles.benefitItem} style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                +{pkg.benefits.length - 3} lợi ích khác...
              </li>
            )}
          </ul>
        </div>
      )}

      <div className={styles.packageActions}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/user/packages/detail/${pkg.id}?type=${isPurchased ? 'purchased' : 'available'}`, {
            state: { packageData: pkg, childId: selectedStudentId || childId }
          })}
          sx={{
            flex: 1,
            textTransform: 'none',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            borderColor: 'var(--border-medium)',
            color: 'var(--text-primary)',
            '&:hover': {
              borderColor: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-50)',
              color: 'var(--color-primary)'
            }
          }}
        >
          Xem chi tiết
        </Button>
        {!isPurchased && canUpgrade ? (
          <Button
            variant="contained"
            onClick={() => handleUpgradeClick(pkg)}
            disabled={isUpgrading}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              background: 'var(--color-primary)',
              color: 'white',
              boxShadow: 'var(--shadow-sm)',
              '&:hover': {
                background: 'var(--color-primary-dark)',
                transform: 'translateY(-2px)',
                boxShadow: 'var(--shadow-md)'
              }
            }}
          >
            Nâng cấp
          </Button>
        ) : !isPurchased && (
          <Button
            variant="contained"
            onClick={() => handleBuyClick(pkg)}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              background: 'var(--color-secondary)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
              '&:hover': {
                background: 'var(--color-secondary-dark)',
                color: 'var(--text-inverse)',
                transform: 'translateY(-2px)',
                boxShadow: 'var(--shadow-md)'
              }
            }}
          >
            Đăng ký ngay
          </Button>
        )}
      </div>
    </div>
  );

  const renderServiceCard = (service) => (
    <div key={service.id || service.name} className={styles.packageCard}>
      <div className={styles.packageHeader}>
        <h3 className={styles.packageName}>{service.name}</h3>
        <span className={`${styles.statusBadge} ${service.isActive ? styles.active : styles.expired}`}>
          {service.isActive ? 'Hoạt động' : 'Tạm dừng'}
        </span>
      </div>

      <div className={styles.packageInfo}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Loại dịch vụ:</span>
          <span className={styles.infoValue}>{service.type || 'Dịch vụ bổ sung'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Giá:</span>
          <span className={styles.infoValue}>{formatCurrency(service.effectivePrice)}</span>
        </div>
        {service.priceOverride !== null && service.priceOverride !== undefined && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Giá gốc:</span>
            <span className={styles.infoValue}>{formatCurrency(service.priceOverride)}</span>
          </div>
        )}
      </div>

      {service.description && (
        <p className={styles.packageDescription}>{service.description}</p>
      )}

      {service.benefits && service.benefits.length > 0 && (
        <div className={styles.benefitsSection}>
          <h4 className={styles.benefitsTitle}>Lợi ích:</h4>
          <ul className={styles.benefitsList}>
            {service.benefits.map((benefit, index) => (
              <li key={index} className={styles.benefitItem}>
                <span className={styles.benefitIcon}>✓</span>
                {benefit.name || benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {service.note && (
        <div className={styles.packageNote}>
          <strong>Lưu ý:</strong> {service.note}
        </div>
      )}

      {service.isActive && (
        <div className={styles.packageActions}>
          <button 
            className={styles.registerButton}
            onClick={() => handleOrderClick(service)}
          >
            Mua dịch vụ
          </button>
        </div>
      )}
    </div>
  );

  return (
    <motion.div 
      className={styles.packagesPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isPageLoading && <ContentLoading isLoading={isPageLoading} text={loadingText} />}
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Các gói</h1>
          <p className={styles.subtitle}>
            {selectedStudentId && children.length > 0
              ? `Gói slot cho ${children.find(c => c.id === selectedStudentId)?.name || 'học sinh'} - Chi nhánh ${children.find(c => c.id === selectedStudentId)?.branchName || ''}`
              : 'Xem và quản lý các gói của bạn'}
          </p>
        </div>

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Available Packages */}
        {activeTab === 'available' && (
          <div className={styles.packagesSection}>
            {isLoadingAvailable ? (
              <div className={styles.inlineLoading}>
                <ContentLoading isLoading={true} text="Đang tải gói dịch vụ..." />
              </div>
            ) : availableError ? (
              <div className={styles.errorState}>
                <p className={styles.errorMessage}>{availableError}</p>
                <button className={styles.retryButton} onClick={loadAvailablePackages}>
                  Thử lại
                </button>
              </div>
            ) : availablePackages.length > 0 ? (
              <div className={styles.packagesGrid}>
                {availablePackages.map((pkg) => {
                  // Check if this package can be upgraded (price higher than current active package)
                  const canUpgrade = currentActivePackage && pkg.price > (currentActivePackage.price || 0);
                  return renderPackageCard(pkg, false, canUpgrade);
                })}
              </div>
            ) : !hasChildren ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <ChildIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                </div>
                <h3>Chưa có trẻ em</h3>
                <p>Bạn cần thêm thông tin trẻ em trước khi xem các gói dịch vụ. Các gói sẽ được hiển thị dựa trên thông tin trẻ em của bạn.</p>
                <button 
                  className={styles.browseButton}
                  onClick={() => navigate('/user/management/children/create')}
                >
                  Thêm trẻ em ngay
                </button>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <PackageIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                </div>
                <h3>Không có gói nào</h3>
                <p>Hiện tại không có gói dịch vụ nào phù hợp với con của bạn</p>
              </div>
            )}
          </div>
        )}

        {/* Purchased Packages */}
        {activeTab === 'purchased' && (
          <div className={styles.packagesSection}>
            {isLoadingPurchased ? (
              <div className={styles.inlineLoading}>
                <ContentLoading isLoading={true} text="Đang tải gói đã mua..." />
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p className={styles.errorMessage}>{error}</p>
                <button className={styles.retryButton} onClick={loadPurchasedPackages}>
                  Thử lại
                </button>
              </div>
            ) : purchasedPackages.length > 0 ? (
              <div className={styles.purchasedPackageInfo}>
                {purchasedPackages.map((pkg) => (
                  <div key={pkg.id} className={styles.packageInfoWrapper}>
                    <div className={styles.packageInfoHeader}>
                      <div className={styles.packageTitleRow}>
                        <h2 className={styles.packageTitle}>{pkg.name}</h2>
                        <span className={`${styles.statusBadge} ${styles[pkg.status]}`}>
                          {pkg.status === 'active' ? 'Đang sử dụng' : 'Đã hết hạn'}
                        </span>
                      </div>
                      <div className={styles.packagePrice}>
                        <span className={styles.priceAmount}>{formatCurrency(pkg.price)}</span>
                      </div>
                    </div>

                    <div className={styles.packageDetailsGrid}>
                      <div className={styles.detailBox}>
                        <div className={styles.detailLabel}>Thời hạn gói</div>
                        <div className={styles.detailValue}>{pkg.durationInMonths} tháng</div>
                      </div>
                      {pkg.usedSlots !== undefined && pkg.totalSlots !== undefined && (
                        <div className={styles.detailBox}>
                          <div className={styles.detailLabel}>Slot sử dụng</div>
                          <div className={styles.detailValue}>{pkg.usedSlots}/{pkg.totalSlots}</div>
                        </div>
                      )}
                      {pkg.expiryDate && (
                        <div className={styles.detailBox}>
                          <div className={styles.detailLabel}>Ngày hết hạn</div>
                          <div className={styles.detailValue}>
                            {new Date(pkg.expiryDate).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.packageActions}>
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/user/packages/detail/${pkg.id}?type=purchased`, {
                          state: { packageData: pkg, childId: selectedStudentId || childId }
                        })}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'var(--font-family)',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          background: 'var(--color-primary)',
                          color: 'white',
                          padding: '12px 32px',
                          '&:hover': {
                            background: 'var(--color-primary-dark)'
                          }
                        }}
                      >
                        Xem chi tiết gói
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleRenewClick(pkg)}
                        disabled={isRenewing}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'var(--font-family)',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          borderColor: 'var(--color-primary)',
                          color: 'var(--color-primary)',
                          padding: '12px 32px',
                          mr: 1,
                          '&:hover': {
                            borderColor: 'var(--color-primary-dark)',
                            backgroundColor: 'var(--color-primary-50)',
                            color: 'var(--color-primary-dark)'
                          }
                        }}
                      >
                        Gia hạn
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={() => handleRefundClick(pkg)}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'var(--font-family)',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          borderColor: 'var(--color-warning)',
                          color: 'var(--color-warning)',
                          padding: '12px 32px',
                          '&:hover': {
                            borderColor: 'var(--color-warning-dark)',
                            backgroundColor: 'var(--color-warning-light)',
                            color: 'var(--color-warning-dark)'
                          }
                        }}
                      >
                        Yêu cầu hoàn tiền
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <PackageIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                </div>
                <h3>Chưa mua gói nào</h3>
                <p>Bạn chưa mua gói dịch vụ nào. Hãy xem các gói có sẵn và đăng ký ngay!</p>
                <button 
                  className={styles.browseButton}
                  onClick={() => setActiveTab('available')}
                >
                  Xem các gói
                </button>
              </div>
            )}
          </div>
        )}


        {/* Buy Package Dialog */}
        <ManagementFormDialog
          open={showBuyDialog}
          onClose={() => {
            setShowBuyDialog(false);
            setSelectedPackage(null);
            setBuyForm({
              studentId: ''
            });
          }}
          mode="create"
          title="Mua gói dịch vụ"
          icon={ShoppingCartIcon}
          loading={isBuying}
          maxWidth="md"
        >
              {selectedPackage && (
            <Box sx={{ 
              mb: 3,
              p: 3,
              backgroundColor: 'rgba(0, 123, 255, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(0, 123, 255, 0.1)'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                mb: 1,
                color: 'text.primary'
              }}>
                {selectedPackage.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Giá: ${formatCurrency(selectedPackage.price)}`}
                  sx={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                />
                {selectedPackage.durationInMonths && (
                  <Chip 
                    label={`Thời hạn: ${selectedPackage.durationInMonths} tháng`}
                    variant="outlined"
                    sx={{ fontSize: '0.85rem' }}
                  />
                )}
                {selectedPackage.totalSlots && (
                  <Chip 
                    label={`${selectedPackage.totalSlots} slot`}
                    variant="outlined"
                    sx={{ fontSize: '0.85rem' }}
                  />
                )}
              </Box>
            </Box>
          )}

          {(() => {
            // Xác định con được chọn
            const selectedChildId = selectedStudentId || (children.length === 1 ? children[0].id : '');
            const selectedChild = children.find(child => child.id === selectedChildId);
            
            if (!selectedChild) {
              return (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Vui lòng chọn con từ trang trước
                </Alert>
              );
            }
            
            return (
              <>
                <Box sx={{ mb: 3, p: 2, backgroundColor: 'var(--bg-secondary)', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Mua gói cho:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedChild.name || 'Không tên'}
                  </Typography>
                  {selectedChild.branchName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Chi nhánh: {selectedChild.branchName}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowBuyDialog(false);
                      setSelectedPackage(null);
                      setBuyForm({ studentId: '' });
                    }}
                    disabled={isBuying}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleBuyPackage({ studentId: selectedChildId })}
                    disabled={isBuying}
                    sx={{
                      background: 'var(--color-secondary)',
                      color: 'var(--text-primary)',
                      '&:hover': {
                        background: 'var(--color-secondary-dark)',
                        color: 'var(--text-inverse)'
                      }
                    }}
                  >
                    {isBuying ? 'Đang xử lý...' : 'Xác nhận mua'}
                  </Button>
                </Box>
              </>
            );
          })()}
        </ManagementFormDialog>

        {/* Refund Confirm Dialog */}
        <ConfirmDialog
          open={refundDialog.open}
          onClose={() => setRefundDialog({ open: false, package: null, policy: null, loading: false })}
          onConfirm={handleConfirmRefund}
          title="Xác nhận hoàn tiền gói"
          confirmText="Hoàn tiền"
          confirmColor="warning"
          highlightText={refundDialog.package?.name}
          confirmDisabled={(() => {
            const pkg = refundDialog.package;
            const p = refundDialog.policy;
            if (!pkg || !p) return false;
            const fullMax = Number(p.fullRefundMaxSlots ?? 0);
            const partialMax = Number(p.partialRefundMaxSlots ?? 0);
            const usedSlots = Number(pkg.usedSlots ?? 0);
            const refundCategory = (fullMax === 0) ? 'FULL' : (usedSlots <= fullMax ? 'FULL' : (usedSlots <= partialMax ? 'PARTIAL' : 'NONE'));
            return refundDialog.loading || isRefunding || refundCategory === 'NONE';
          })()}
        >
          {(() => {
            if (!refundDialog.package) return null;
            const pkg = refundDialog.package;
            if (refundDialog.loading) {
              return (
                <Typography sx={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  Đang tải chính sách hoàn tiền...
                </Typography>
              );
            }

            const p = refundDialog.policy || {};
            const fullMax = Number(p.fullRefundMaxSlots ?? 0);
            const partialMax = Number(p.partialRefundMaxSlots ?? 0);
            const used = Number(pkg.usedSlots ?? 0);
            const total = Number(pkg.totalSlots ?? 0);
            const percentUsed = total > 0 ? Math.round((used / total) * 100) : 0;
            const refundCategory = (fullMax === 0) ? 'FULL' : (used <= fullMax ? 'FULL' : (used <= partialMax ? 'PARTIAL' : 'NONE'));

            return (
              <>
                <Typography sx={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  Bạn có chắc chắn muốn hoàn tiền gói "{pkg.name}"? Số tiền sẽ được hoàn lại vào ví của bạn.
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                  Chính sách hoàn tiền:
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {`- Số ngày hoàn tiền 100% : ${p.fullRefundDays ?? 'N/A'}\n- Số slot tối đa hoàn tiền 50%: ${partialMax}\n- Số slot tối đa hoàn tiền 100%: ${fullMax}`}
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                  Đã dùng: {used}/{total} slot
                </Typography>

                <Typography sx={{ mt: 0.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Loại hoàn tiền hiện tại:</span>
                  <Box component="span" sx={{ ml: 1, fontWeight: 700, color: refundCategory === 'FULL' ? 'success.main' : (refundCategory === 'PARTIAL' ? 'warning.main' : 'error.main') }}>
                    {refundCategory === 'FULL' ? 'Hoàn 100%' : (refundCategory === 'PARTIAL' ? 'Hoàn 50%' : 'Không đủ điều kiện')}
                  </Box>
                </Typography>
              </>
            );
          })()}
        </ConfirmDialog>

        {/* Renew Confirm Dialog */}
        <ConfirmDialog
          open={renewDialog.open}
          onClose={() => setRenewDialog({ open: false, package: null, policy: null, loading: false })}
          onConfirm={handleConfirmRenew}
          title="Xác nhận gia hạn gói"
          confirmText="Gia hạn"
          confirmColor="primary"
          highlightText={renewDialog.package?.name}
          confirmDisabled={(() => {
            const pkg = renewDialog.package;
            const p = renewDialog.policy;
            if (!pkg || !p) return false;
            const minPercent = Number(p.minSlotsPercentage ?? 0);
            const totalSlots = Number(pkg.totalSlots || 0);
            const usedSlots = Number(pkg.usedSlots || 0);
            const percentUsed = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;
            return percentUsed < minPercent || renewDialog.loading || isRenewing;
          })()}
        >
          {(() => {
            if (!renewDialog.package) return null;
            const pkg = renewDialog.package;
            if (renewDialog.loading) {
              return (
                <Typography sx={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  Đang tải chính sách gia hạn...
                </Typography>
              );
            }
            const p = renewDialog.policy || {};
            const minPercent = Number(p.minSlotsPercentage ?? 0);
            const totalSlots = Number(pkg.totalSlots || 0);
            const usedSlots = Number(pkg.usedSlots || 0);
            const percentUsed = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;
            const meetsRequirement = percentUsed >= minPercent;

            return (
              <>
                <Typography sx={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  Bạn có chắc chắn muốn gia hạn gói "{pkg.name}" cho học sinh không?
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                  Chính sách gia hạn:
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {`- Phần trăm slot tối thiểu: ${minPercent}%\n- Hạn gia hạn (ngày): ${p.renewalDeadlineDays ?? 'N/A'}`}
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                  Đã dùng: {usedSlots}/{totalSlots} slot ({percentUsed}%)
                </Typography>

                <Typography sx={{ mt: 0.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Yêu cầu tối thiểu: {minPercent}%</span>
                  <Box component="span" sx={{ ml: 1, fontWeight: 700, color: meetsRequirement ? 'success.main' : 'error.main' }}>
                    {meetsRequirement ? 'ĐẠT' : 'CHƯA ĐẠT'}
                  </Box>
                </Typography>
              </>
            );
          })()}
        </ConfirmDialog>



        {/* Upgrade Confirm Dialog */}
        <ConfirmDialog
          open={upgradeDialog.open}
          onClose={() => setUpgradeDialog({ open: false, package: null, studentId: null, policy: null, loading: false })}
          onConfirm={handleConfirmUpgrade}
          title="Xác nhận nâng cấp gói"
          confirmText="Nâng cấp"
          confirmColor="primary"
          highlightText={upgradeDialog.package?.name}
          confirmDisabled={upgradeDialog.loading || isUpgrading}
        >
          {(() => {
            if (!upgradeDialog.package) return null;
            const pkg = upgradeDialog.package;
            if (upgradeDialog.loading) {
              return (
                <Typography sx={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  Đang tải chính sách nâng cấp...
                </Typography>
              );
            }

            const p = upgradeDialog.policy || {};
            const deadlineDays = Number(p.upgradeSlotValueDeadlineDays ?? 0);
            const expiry = pkg.expiryDate ? new Date(pkg.expiryDate) : null;
            const now = new Date();
            const daysUntil = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;
            const meets = daysUntil !== null ? daysUntil >= deadlineDays : false;
            const valuePercent = meets ? 100 : 50;

            return (
              <>
                <Typography sx={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  Bạn có chắc chắn muốn nâng cấp gói "{pkg.name}"?
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                  Chính sách nâng cấp:
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {`- Nếu còn ít nhất ${p.upgradeSlotValueDeadlineDays ?? 'N/A'} ngày trước khi gói hết hạn: slot giữ 100% giá trị.`}
                </Typography>

                <Typography sx={{ mt: 0.5, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {`- Nếu còn ít hơn ${p.upgradeSlotValueDeadlineDays ?? 'N/A'} ngày: slot giữ 50% giá trị.`}
                </Typography>

                {daysUntil !== null && (
                  <Typography sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                    Ngày còn lại đến ngày hết hạn: {daysUntil} ngày
                  </Typography>
                )}

                <Typography sx={{ mt: 0.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Giá trị còn lại của slot:</span>
                  <Box component="span" sx={{ ml: 1, fontWeight: 700, color: valuePercent === 100 ? 'success.main' : 'warning.main' }}>
                    {valuePercent}%
                  </Box>
                </Typography>

                <Typography sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                  Lưu ý: Nâng cấp vẫn được phép; phần chênh lệch giá sẽ tính theo giá trị còn lại của slot.
                </Typography>
              </>
            );
          })()}
        </ConfirmDialog>

        {/* Buy Service Dialog */}
        <ManagementFormDialog
          open={showOrderDialog}
          onClose={() => {
            if (!isOrdering) {
              setShowOrderDialog(false);
              setSelectedService(null);
              setOrderForm({
                childId: '',
                studentSlotId: '',
                quantity: 1
              });
            }
          }}
          mode="create"
          title="Mua dịch vụ"
          icon={ShoppingCartIcon}
          loading={isOrdering}
          maxWidth="md"
        >
          {selectedService && (
            <Box sx={{ 
              mb: 3,
              p: 3,
              backgroundColor: 'rgba(0, 123, 255, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(0, 123, 255, 0.1)'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                mb: 1,
                color: 'text.primary'
              }}>
                {selectedService.name}
              </Typography>
              <Chip 
                label={`Giá: ${formatCurrency(selectedService.effectivePrice)}`}
                sx={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              />
            </Box>
          )}

          <Form
            key={`order-form-${orderForm.childId}-${studentSlots.length}`}
            schema={yup.object().shape({
              childId: yup.string().required('Vui lòng chọn trẻ em'),
              studentSlotId: yup.string().when('childId', {
                is: (val) => val && val !== '',
                then: (schema) => schema.required('Vui lòng chọn lịch giữ trẻ đã đặt'),
                otherwise: (schema) => schema.nullable()
              }),
              quantity: yup.number().min(1, 'Số lượng phải lớn hơn 0').required('Vui lòng nhập số lượng')
            })}
            defaultValues={{
              childId: orderForm.childId || '',
              studentSlotId: orderForm.studentSlotId || '',
              quantity: orderForm.quantity || 1
            }}
            onSubmit={async (data) => {
              if (!selectedService) return;

              if (!data.childId) {
                addNotification({
                  message: 'Vui lòng chọn trẻ em.',
                  severity: 'warning'
                });
                return;
              }

              if (!data.studentSlotId) {
                addNotification({
                  message: 'Vui lòng chọn lịch giữ trẻ đã đặt.',
                  severity: 'warning'
                });
                return;
              }

              setIsOrdering(true);
              try {
                const response = await orderService.createOrder({
                  studentSlotId: data.studentSlotId,
                  items: [
                    {
                      serviceId: selectedService.id,
                      quantity: data.quantity
                    }
                  ]
                });

                setOrderSuccessInfo({
                  orderId: response?.orderId || response?.id,
                  orderTotal:
                    response?.totalAmount ||
                    selectedService.effectivePrice * data.quantity,
                  childName:
                    children.find((child) => child.id === data.childId)?.name ||
                    children.find((child) => child.id === data.childId)?.userName ||
                    'Không tên'
                });
                setPaymentResult(null);
                setShowOrderDialog(false);
              } catch (err) {
                const errorMessage =
                  typeof err === 'string'
                    ? err
                    : err?.message || err?.error || 'Không thể tạo đơn dịch vụ';
                showGlobalError(errorMessage);
                addNotification({
                  message: errorMessage,
                  severity: 'error'
                });
              } finally {
                setIsOrdering(false);
              }
            }}
            submitText="Xác nhận mua"
            loading={isOrdering}
            disabled={isOrdering}
            fields={[
              {
                name: 'childId',
                label: 'Chọn trẻ em',
                type: 'select',
                required: true,
                placeholder: '-- Chọn trẻ em --',
                options: children.length > 0 ? children.map(child => ({
                  value: child.id,
                  label: child.name || child.userName || 'Không tên'
                })) : [],
                onChange: (value) => {
                  handleChildChange(value);
                }
              },
              ...(orderForm.childId && studentSlots.length > 0 ? [{
                name: 'studentSlotId',
                label: 'Lịch giữ trẻ',
                type: 'select',
                required: true,
                placeholder: '-- Chọn lịch giữ trẻ --',
                options: studentSlots.map(slot => ({
                  value: slot.id,
                  label: `${new Date(slot.date).toLocaleString('vi-VN')} · ${slot.status}`
                }))
              }] : orderForm.childId && isLoadingSlots ? [{
                name: 'studentSlotId',
                label: 'Lịch giữ trẻ',
                type: 'text',
                disabled: true,
                placeholder: 'Đang tải lịch giữ trẻ...'
              }] : orderForm.childId && slotsError ? [{
                name: 'studentSlotId',
                label: 'Lịch giữ trẻ',
                type: 'text',
                disabled: true,
                placeholder: slotsError
              }] : orderForm.childId ? [{
                name: 'studentSlotId',
                label: 'Lịch giữ trẻ',
                type: 'text',
                disabled: true,
                placeholder: 'Chưa có lịch giữ trẻ nào. Vui lòng đặt lịch trước.'
              }] : []),
              {
                name: 'quantity',
                label: 'Số lượng',
                type: 'number',
                required: true,
                min: 1
              }
            ]}
          >
            {isLoadingChildren && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <ContentLoading isLoading={true} text="Đang tải danh sách con..." />
              </Box>
            )}
            {childrenError && (
              <Box sx={{ p: 2 }}>
                <Typography color="error" variant="body2">{childrenError}</Typography>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={loadServiceChildren}
                  style={{ marginTop: '12px' }}
                >
                  Thử lại
                </button>
              </Box>
            )}
          </Form>
        </ManagementFormDialog>

        {/* Payment Dialog */}
        {orderSuccessInfo && (
          <div className={styles.dialogOverlay} onClick={() => setOrderSuccessInfo(null)}>
            <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dialogHeader}>
                <h2 className={styles.dialogTitle}>Thanh toán đơn hàng</h2>
                <button
                  className={styles.dialogClose}
                  onClick={() => setOrderSuccessInfo(null)}
                >
                  ×
                </button>
              </div>

              <div className={styles.dialogServiceInfo}>
                <h3 className={styles.dialogServiceName}>Đơn #{orderSuccessInfo.orderId}</h3>
                <p className={styles.dialogServicePrice}>
                  Tổng tiền: {formatCurrency(orderSuccessInfo.orderTotal)}
                </p>
                <p className={styles.formHint}>Học sinh: {orderSuccessInfo.childName}</p>
              </div>

              <div className={styles.orderForm}>
                <p className={styles.formLabel}>Chọn ví để thanh toán:</p>
                {paymentResult && (
                  <div className={styles.paymentResult}>
                    <p>
                      Trạng thái: <strong>{paymentResult.status}</strong>
                    </p>
                    <p>Số tiền đã trả: {formatCurrency(paymentResult.paidAmount)}</p>
                    <p>Số dư còn lại: {formatCurrency(paymentResult.remainingBalance)}</p>
                    <p>Tin nhắn: {paymentResult.message}</p>
                  </div>
                )}
                <div className={styles.walletButtons}>
                  <button
                    className={styles.walletButton}
                    onClick={async () => {
                      try {
                        const res = await orderService.payOrderWithWallet({
                          orderId: orderSuccessInfo.orderId,
                          walletType: 'Parent'
                        });
                        setPaymentResult(res);
                        addNotification({
                          message: 'Thanh toán từ ví phụ huynh thành công!',
                          severity: 'success'
                        });
                      } catch (err) {
                        const errorMessage =
                          typeof err === 'string'
                            ? err
                            : err?.message || err?.error || 'Thanh toán thất bại';
                        showGlobalError(errorMessage);
                        addNotification({
                          message: errorMessage,
                          severity: 'error'
                        });
                      }
                    }}
                  >
                    Ví phụ huynh
                  </button>
                  <button
                    className={styles.walletButton}
                    onClick={async () => {
                      try {
                        const res = await orderService.payOrderWithWallet({
                          orderId: orderSuccessInfo.orderId,
                          walletType: 'Student'
                        });
                        setPaymentResult(res);
                        addNotification({
                          message: 'Thanh toán từ ví học sinh thành công!',
                          severity: 'success'
                        });
                      } catch (err) {
                        const errorMessage =
                          typeof err === 'string'
                            ? err
                            : err?.message || err?.error || 'Thanh toán thất bại';
                        showGlobalError(errorMessage);
                        addNotification({
                          message: errorMessage,
                          severity: 'error'
                        });
                      }
                    }}
                  >
                    Ví trẻ em
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setOrderSuccessInfo(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MyPackages;
