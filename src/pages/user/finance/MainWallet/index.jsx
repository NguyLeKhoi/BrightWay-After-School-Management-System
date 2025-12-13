import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Button,
  TextField,
  Box,
  Typography,
  InputAdornment,
  Paper,
  CircularProgress,
  Pagination,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Refresh,
  AttachMoney as MoneyIcon,
  History,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Pending,
  Cancel,
  Wallet,
  Send,
  School,
  Business,
  ShoppingCart,
  SwapHoriz,
  Inventory,
  Restaurant,
  SportsEsports,
  LocalOffer,
  Receipt,
  Description
  , CalendarToday
} from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import { useApp } from '../../../../contexts/AppContext';
import useContentLoading from '../../../../hooks/useContentLoading';
import depositService from '../../../../services/deposit.service';
import walletService from '../../../../services/wallet.service';
import studentService from '../../../../services/student.service';
import transactionService from '../../../../services/transaction.service';
import styles from '../Finance.module.css';

const DEFAULT_WALLET_DATA = {
  mainWallet: {
    balance: 0,
    currency: 'VND',
    type: 'Parent',
    walletId: '',
    createdTime: '',
    userEmail: ''
  }
};

const MainWallet = () => {
  const location = useLocation();
  const isInitialMount = useRef(true);
  const [activeTab, setActiveTab] = useState(0);
  const [mainWalletSubTab, setMainWalletSubTab] = useState(0); // 0: Lịch sử nạp tiền, 1: Lịch sử giao dịch
  const [walletError, setWalletError] = useState(null);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const checkoutMonitorRef = useRef(null);
  const shouldAutoSyncRef = useRef(false);
  
  // Children wallet states
  const [childWalletError, setChildWalletError] = useState(null);
  const [isChildWalletLoading, setIsChildWalletLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [childWallets, setChildWallets] = useState([]);
  const [transferForm, setTransferForm] = useState({
    toStudentId: '',
    amount: '',
    note: ''
  });
  const [walletData, setWalletData] = useState(DEFAULT_WALLET_DATA);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 20,
    totalPages: 1,
    totalCount: 0
  });
  
  // All transactions history state (for transaction history tab)
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoadingAllTransactions, setIsLoadingAllTransactions] = useState(false);
  const [allTransactionError, setAllTransactionError] = useState(null);
  const [allTransactionPagination, setAllTransactionPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0
  });
  // Detail dialog
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { showGlobalError, addNotification } = useApp();
  const { isLoading: isPageLoading, loadingText, showLoading, hideLoading } = useContentLoading();


  const loadWalletData = async ({ showSpinner = false } = {}) => {
    setWalletError(null);
    if (showSpinner) {
      setIsWalletLoading(true);
    }

    try {
      const walletResponse = await walletService.getCurrentWallet();

      setWalletData((prev) => ({
        ...prev,
        mainWallet: {
          ...prev.mainWallet,
          balance: walletResponse.balance ?? 0,
          currency: 'VND',
          type: walletResponse.type || prev.mainWallet.type,
          walletId: walletResponse.id || prev.mainWallet.walletId,
          createdTime: walletResponse.createdTime || prev.mainWallet.createdTime,
          userEmail: walletResponse.userEmail || prev.mainWallet.userEmail
        }
      }));

      return walletResponse;
    } catch (error) {
      const errorMessage = typeof error === 'string'
        ? error
        : error?.message || error?.error || 'Không thể tải thông tin ví';

      setWalletError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      if (showSpinner) {
        setIsWalletLoading(false);
      }
    }
  };

  useEffect(() => {
    loadWalletData({ showSpinner: true });
    loadTransactions(1);
    loadChildWallets();
    loadAllTransactions(1);
  }, []);
  
  // Load data when sub-tab changes
  useEffect(() => {
    if (activeTab === 0 && mainWalletSubTab === 1) {
      // Load all transactions when switching to transaction history tab
      loadAllTransactions(1);
    }
  }, [mainWalletSubTab]);

  useEffect(() => {
    if (location.pathname === '/user/finance/wallet') {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      loadWalletData({ showSpinner: false });
      loadChildWallets();
    }
  }, [location.pathname]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };
  
  const TRANSACTION_TYPES = {
    OrderPayment: { label: 'Thanh toán dịch vụ bổ sung', icon: ShoppingCart, color: 'primary' },
    Deposit: { label: 'Nạp tiền', icon: TrendingUp, color: 'success' },
    TransferIn: { label: 'Nhận tiền từ ví chính', icon: SwapHoriz, color: 'success' },
    TransferOut: { label: 'Chuyển tiền ra', icon: TrendingDown, color: 'warning' },
    PackagePayment: { label: 'Mua gói học', icon: Inventory, color: 'primary' },
    Refund: { label: 'Hoàn tiền gói học', icon: TrendingUp, color: 'success' },
    PackageUpgrade: { label: 'Nâng cấp gói', icon: Inventory, color: 'primary' },
    Tuition: { label: 'Thanh toán học phí', icon: School, color: 'primary' },
    Canteen: { label: 'Mua đồ ăn', icon: Restaurant, color: 'info' },
    Game: { label: 'Thanh toán game', icon: SportsEsports, color: 'secondary' },
    ServicePurchase: { label: 'Mua dịch vụ bổ sung', icon: LocalOffer, color: 'primary' }
  };
  
  const getTransactionTypeInfo = (type) => {
    return TRANSACTION_TYPES[type] || { 
      label: type || 'Giao dịch khác', 
      icon: Receipt, 
      color: 'default' 
    };
  };
  
  const formatTransactionDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Ensure timestamp is treated as UTC if no timezone present
      let ts = dateString;
      if (typeof ts === 'string' && ts.includes('T') && !ts.endsWith('Z') && !ts.match(/[+-]\d{2}:\d{2}$/)) {
        ts = ts.replace(/\.\d+$/, '') + 'Z';
      }
      const date = new Date(ts);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return 'N/A';
    }
  };

  // Load child wallets
  const loadChildWallets = async () => {
    setChildWalletError(null);
    setIsChildWalletLoading(true);

    try {
      const response = await studentService.getMyChildren();
      const students = Array.isArray(response) ? response : (Array.isArray(response?.items) ? response.items : []);

      const wallets = await Promise.all(
        students.map(async (student) => {
          try {
            const wallet = await walletService.getStudentWallet(student.id);
            return {
              studentId: student.id,
              studentName: student.name || student.userName || 'Học viên',
              balance: wallet?.balance ?? 0,
              currency: wallet?.currency || 'VND',
              walletId: wallet?.id || '',
              createdTime: wallet?.createdTime || '',
              branchName: student.branchName || student.branch?.branchName || '',
              schoolName: student.schoolName || student.school?.schoolName || '',
              levelName: student.studentLevelName || student.studentLevel?.levelName || ''
            };
          } catch (error) {
            return null;
          }
        })
      );

      setChildWallets(wallets.filter(Boolean));
    } catch (error) {
      const errorMessage = typeof error === 'string'
        ? error
        : error?.message || error?.error || 'Không thể tải ví tiêu vặt của con';
      setChildWalletError(errorMessage);
    } finally {
      setIsChildWalletLoading(false);
    }
  };

  // Handle transfer to child wallet
  const handleTransfer = async (event) => {
    event.preventDefault();

    if (!transferForm.toStudentId) {
      addNotification({
        message: 'Vui lòng chọn con để chuyển tiền',
        severity: 'warning'
      });
      return;
    }

    const amount = Number(transferForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      addNotification({
        message: 'Số tiền chuyển phải lớn hơn 0',
        severity: 'warning'
      });
      return;
    }

    try {
      setIsTransferring(true);
      showLoading();

      await walletService.transferToStudent({
        toStudentId: transferForm.toStudentId,
        amount,
        note: transferForm.note
      });

      addNotification({
        message: 'Chuyển tiền thành công!',
        severity: 'success'
      });

      setTransferForm({
        toStudentId: '',
        amount: '',
        note: ''
      });

      await Promise.all([
        loadWalletData({ showSpinner: false }),
        loadChildWallets()
      ]);
    } catch (error) {
      const errorMessage = typeof error === 'string'
        ? error
        : error?.message || error?.error || 'Không thể chuyển tiền';

      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsTransferring(false);
      hideLoading();
    }
  };

  // Load transaction history (deposits)
  const loadTransactions = async (pageIndex = 1, pageSize = 20) => {
    setIsLoadingTransactions(true);
    setTransactionError(null);

    try {
      const response = await depositService.getMyDeposits({
        pageIndex,
        pageSize
      });

      // API response có structure: { items: [...], totalPages, totalCount, ... }
      const deposits = response.items || [];
      
      // Map deposits từ API sang format của component
      const mappedTransactions = deposits.map((deposit) => {
        // Ensure timestamp is treated as UTC
        let timestamp = deposit.timestamp || new Date().toISOString();
        // If timestamp doesn't have timezone indicator (Z or +HH:MM), add Z to indicate UTC
        if (timestamp && typeof timestamp === 'string') {
          // Check if it's ISO format without timezone
          if (timestamp.includes('T') && !timestamp.endsWith('Z') && !timestamp.match(/[+-]\d{2}:\d{2}$/)) {
            // Remove fractional seconds if present and add Z
            timestamp = timestamp.replace(/\.\d+$/, '') + 'Z';
          }
        }
        
        // Lấy checkoutUrl từ localStorage nếu có
        let checkoutUrl = deposit.checkoutUrl || null;
        if (!checkoutUrl && deposit.id) {
          try {
            checkoutUrl = localStorage.getItem(`deposit_checkout_${deposit.id}`) || null;
          } catch (e) {
            // Silent fail - localStorage access denied
          }
        }

        return {
          id: deposit.id,
          type: 'topup', // Tất cả deposits đều là topup
          amount: deposit.amount || 0,
          description: `Nạp tiền - Order #${deposit.payOSOrderCode || 'N/A'}`,
          date: timestamp,
          status: deposit.status?.toLowerCase() || 'pending',
          wallet: 'main',
          payOSOrderCode: deposit.payOSOrderCode,
          payOSTransactionId: deposit.payOSTransactionId,
          checkoutUrl: checkoutUrl // Lưu checkoutUrl vào transaction
        };
      });

      setTransactions(mappedTransactions);
      
      // Update pagination info
      setPagination(prev => ({
        ...prev,
        pageIndex,
        pageSize,
        totalPages: response.totalPages || 1,
        totalCount: response.totalCount || 0
      }));
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể tải lịch sử giao dịch';
      
      setTransactionError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const getTransactionIcon = (type) => {
    const iconStyle = { fontSize: 24 };
    switch (type) {
      case 'topup':
      case 'refill':
        return <TrendingUp sx={iconStyle} />;
      default:
        return <AccountBalanceWallet sx={iconStyle} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'topup':
      case 'refill':
        return 'var(--color-success)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    const iconStyle = { fontSize: 16, marginRight: 4 };
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle sx={{ ...iconStyle, color: 'var(--color-success)' }} />;
      case 'pending':
        return <Pending sx={{ ...iconStyle, color: 'var(--color-warning)' }} />;
      case 'failed':
      case 'cancelled':
        return <Cancel sx={{ ...iconStyle, color: 'var(--color-error)' }} />;
      default:
        return null;
    }
  };

  const handlePageChange = (newPage) => {
    loadTransactions(newPage, pagination.pageSize);
  };
  
  // Load all transactions (for transaction history tab)
  const loadAllTransactions = async (pageIndex = 1, pageSize = 10) => {
    setIsLoadingAllTransactions(true);
    setAllTransactionError(null);

    try {
      const response = await transactionService.getMyTransactions({
        pageIndex,
        pageSize
      });

      const items = response.items || [];
      // Normalize API items to a common shape used in UI
      const normalized = items.map((t) => ({
        id: t.id,
        amount: t.amount || 0,
        transactionType: t.type || t.transactionType || 'Unknown',
        transactionDate: t.timestamp || t.transactionDate || null,
        description: t.description || '',
        walletType: t.walletType || '',
        orderId: t.orderId || null,
        orderReference: t.orderReference || null,
        orderStatus: t.orderStatus || null
      }));
      setAllTransactions(normalized);
      
      setAllTransactionPagination({
        pageIndex,
        pageSize,
        totalPages: response.totalPages || 1,
        totalCount: response.totalCount || 0
      });
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể tải lịch sử giao dịch';
      
      setAllTransactionError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingAllTransactions(false);
    }
  };

  const handleAllTransactionPageChange = (newPage) => {
    loadAllTransactions(newPage, allTransactionPagination.pageSize);
  };

  const handleTopUpClick = () => {
    setShowTopUpForm(!showTopUpForm);
    if (showTopUpForm) {
      setTopUpAmount('');
      setTopUpError('');
    }
  };

  const handleTopUpCancel = () => {
    setShowTopUpForm(false);
    setTopUpAmount('');
    setTopUpError('');
  };

  const handleTopUpAmountChange = (e) => {
    const value = e.target.value;
    setTopUpAmount(value);
    setTopUpError('');

    if (value && (isNaN(value) || Number(value) <= 0)) {
      setTopUpError('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
    } else if (value && Number(value) < 10000) {
      setTopUpError('Số tiền tối thiểu là 10.000 VND');
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || topUpAmount.trim() === '') {
      setTopUpError('Vui lòng nhập số tiền');
      return;
    }

    const amount = Number(topUpAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      setTopUpError('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }

    if (amount < 10000) {
      setTopUpError('Số tiền tối thiểu là 10.000 VND');
      return;
    }

    let checkoutWindow = null;

    try {
      checkoutWindow = window.open('about:blank', '_blank');
      showLoading();
      setShowTopUpForm(false);
      setTopUpAmount('');
      setTopUpError('');

      const depositResponse = await depositService.createDeposit(amount);
      const checkoutUrl = depositResponse?.checkoutUrl;
      const depositId = depositResponse?.depositId;

      if (depositId && checkoutUrl) {
        try {
          localStorage.setItem(`deposit_checkout_${depositId}`, checkoutUrl);
        } catch (e) {
          // Silent fail - localStorage access denied
        }
      }

      if (checkoutUrl) {
        if (checkoutWindow) {
          checkoutWindow.location.href = checkoutUrl;
          checkoutWindow.focus();
        } else {
          window.location.href = checkoutUrl;
        }

        shouldAutoSyncRef.current = true;

        if (checkoutMonitorRef.current) {
          clearInterval(checkoutMonitorRef.current);
        }
        checkoutMonitorRef.current = setInterval(() => {
          if (!checkoutWindow || checkoutWindow.closed) {
            clearInterval(checkoutMonitorRef.current);
            checkoutMonitorRef.current = null;
            handleSyncWallet({ silent: true });
          }
        }, 2000);
      } else if (checkoutWindow) {
        checkoutWindow.close();
      }

      addNotification({
        message: 'Đang chuyển tới PayOS để hoàn tất nạp tiền.',
        severity: 'success'
      });
    } catch (error) {
      if (checkoutWindow) {
        checkoutWindow.close();
      }
      const errorMessage = typeof error === 'string'
        ? error
        : error?.message || error?.error || 'Có lỗi xảy ra khi nạp tiền';

      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      hideLoading();
    }
  };

  const handleSyncWallet = async ({ silent = false } = {}) => {
    if (isSyncing || !shouldAutoSyncRef.current) return;

    try {
      setIsSyncing(true);
      if (!silent) {
        showLoading();
      }

      const previousBalance = walletData.mainWallet.balance;

      await depositService.triggerPayosWebhook();
      const latestWallet = await loadWalletData();

      const newBalance = latestWallet?.balance ?? previousBalance;
      const hasBalanceChanged = newBalance !== previousBalance;

      if (hasBalanceChanged) {
        shouldAutoSyncRef.current = false;
        addNotification({
          message: 'Số dư ví đã được cập nhật từ PayOS',
          severity: 'success'
        });
      } else {
        shouldAutoSyncRef.current = silent;
        if (!silent) {
          addNotification({
            message: 'Chưa nhận được giao dịch mới từ PayOS. Vui lòng kiểm tra lại sau.',
            severity: 'info'
          });
        }
      }
    } catch (error) {
      shouldAutoSyncRef.current = true;

      const errorMessage = typeof error === 'string'
        ? error
        : error?.message || error?.error || 'Không thể đồng bộ ví từ PayOS';

      if (!silent) {
        showGlobalError(errorMessage);
        addNotification({
          message: errorMessage,
          severity: 'error'
        });
      }
    } finally {
      setIsSyncing(false);
      if (!silent) {
        hideLoading();
      }
    }
  };

  useEffect(() => {
    const handleWindowFocus = () => {
      if (shouldAutoSyncRef.current) {
        handleSyncWallet({ silent: true });
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      if (checkoutMonitorRef.current) {
        clearInterval(checkoutMonitorRef.current);
      }
    };
  }, []);

  const mainWalletInfo = [
    { label: 'Loại ví', value: walletData.mainWallet.type === 'Parent' ? 'Ví phụ huynh' : walletData.mainWallet.type || '—' },
    { label: 'Email liên kết', value: walletData.mainWallet.userEmail || '—' },
    walletData.mainWallet.createdTime && {
      label: 'Ngày tạo',
      value: new Date(walletData.mainWallet.createdTime).toLocaleString('vi-VN')
    },
    { label: 'Mục đích', value: 'Thanh toán học phí, phí thành viên và các khoản phí chính' }
  ].filter(Boolean);

  if (isWalletLoading) {
    return <ContentLoading isLoading={isWalletLoading} text={loadingText || 'Đang tải thông tin ví...'} />;
  }

  return (
    <motion.div 
      className={styles.financePage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.container}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)'
            }}
          >
            Quản lý ví
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            marginBottom: 3,
            backgroundColor: 'var(--bg-primary)',
            border: '2px solid var(--color-primary-50)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              minHeight: 72,
              '& .MuiTabs-flexContainer': {
                height: '100%'
              },
              '& .MuiTab-root': {
                fontFamily: 'var(--font-family)',
                fontWeight: 'var(--font-weight-semibold)',
                textTransform: 'none',
                fontSize: '1.05rem',
                minHeight: 72,
                padding: '16px 24px',
                gap: 1.5,
                color: 'var(--text-secondary)',
                transition: 'all var(--transition-base)',
                '&:hover': {
                  backgroundColor: 'var(--color-primary-5)',
                  color: 'var(--color-primary-dark)'
                },
                '&.Mui-selected': {
                  color: 'var(--color-primary)',
                  fontWeight: 'var(--font-weight-bold)',
                  backgroundColor: 'var(--color-primary-10)'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 26
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'var(--color-primary)',
                height: 4,
                borderRadius: '4px 4px 0 0'
              }
            }}
          >
            <Tab 
              icon={<AccountBalanceWallet />} 
              iconPosition="start" 
              label="Ví chính" 
            />
            <Tab 
              icon={<Wallet />} 
              iconPosition="start" 
              label="Ví con" 
            />
          </Tabs>
        </Paper>

        {/* Tab Panel 0: Main Wallet */}
        {activeTab === 0 && (
          <>
            {walletError && (
              <div className={styles.errorState}>
                <p className={styles.errorMessage}>{walletError}</p>
                <button className={styles.retryButton} onClick={() => loadWalletData({ showSpinner: true })}>
                  <Refresh sx={{ fontSize: 16, mr: 0.5 }} />
                  Thử lại
                </button>
              </div>
            )}
            
            {/* Main Wallet Overview - 2 Column Layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: 3,
            marginBottom: 3
          }}
        >
          {/* Left: Balance & Info */}
          <Paper
            elevation={0}
            sx={{
              padding: 4,
              backgroundColor: 'var(--bg-primary)',
              border: '2px solid var(--color-primary-50)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 3 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <AccountBalanceWallet sx={{ fontSize: 32, color: 'var(--color-primary)' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    marginBottom: 0.5
                  }}
                >
                  Ví chính
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-family)'
                  }}
                >
                  {walletData.mainWallet.type === 'Parent' ? 'Ví phụ huynh' : walletData.mainWallet.type || '—'}
                </Typography>
              </Box>
            </Box>

            {/* Balance Display */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: 3,
                marginBottom: 3,
                textAlign: 'center',
                border: '1px solid var(--color-primary-100)'
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontFamily: 'var(--font-family)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  display: 'block',
                  marginBottom: 1
                }}
              >
                Số dư
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-extrabold)',
                  color: 'var(--color-primary-dark)',
                  lineHeight: 1.2,
                  marginBottom: 0.5,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                {formatCurrency(walletData.mainWallet.balance)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'var(--font-family)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)'
                }}
              >
                VND
              </Typography>
            </Box>

            {/* Wallet Info Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2
              }}
            >
              {mainWalletInfo.map((info, index) => (
                <Box
                  key={index}
                  sx={{
                    padding: 2,
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'var(--font-family)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 0.5
                    }}
                  >
                    {info.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'var(--font-family)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {info.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Right: Quick Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper
              elevation={0}
              sx={{
                padding: 3,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 2
                }}
              >
                Thao tác nhanh
              </Typography>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Add />}
                onClick={handleTopUpClick}
                sx={{
                  background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-family)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textTransform: 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 24px',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: 2,
                  '&:hover': {
                    background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                    boxShadow: 'var(--shadow-lg)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {showTopUpForm ? 'Hủy nạp tiền' : 'Nạp tiền'}
              </Button>
            </Paper>

            {/* Top Up Form - Inline */}
            {showTopUpForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    padding: 3,
                    backgroundColor: 'var(--bg-primary)',
                    border: '2px solid var(--color-primary-50)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, marginBottom: 2 }}>
                    <MoneyIcon sx={{ color: 'var(--color-primary)', fontSize: 24 }} />
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Nạp tiền vào ví
                    </Typography>
                  </Box>
                  <Box component="form" onSubmit={(e) => { e.preventDefault(); handleTopUp(); }}>
                    <TextField
                      fullWidth
                      autoFocus
                      type="number"
                      label="Số tiền (VND)"
                      value={topUpAmount}
                      onChange={handleTopUpAmountChange}
                      error={!!topUpError}
                      helperText={topUpError || 'Số tiền tối thiểu: 10.000 VND'}
                      inputProps={{
                        min: 10000,
                        step: 1000
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon sx={{ color: 'var(--text-secondary)' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                              VND
                            </Typography>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        marginBottom: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 'var(--radius-lg)',
                          fontFamily: 'var(--font-family)',
                          '&:hover fieldset': {
                            borderColor: 'var(--color-primary)'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'var(--color-primary)',
                            borderWidth: '2px'
                          }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: 'var(--color-primary)'
                        }
                      }}
                    />
                    {topUpAmount && !topUpError && (
                      <Box
                        sx={{
                          padding: 2,
                          backgroundColor: 'var(--color-primary-50)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--color-primary-100)',
                          marginBottom: 2
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-family)',
                            marginBottom: 0.5
                          }}
                        >
                          Số tiền sẽ nạp:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'var(--color-primary-dark)',
                            fontFamily: 'var(--font-family)',
                            fontWeight: 'var(--font-weight-bold)'
                          }}
                        >
                          {formatCurrency(Number(topUpAmount))}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleTopUpCancel}
                        sx={{
                          borderColor: 'var(--border-light)',
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-family)',
                          fontWeight: 'var(--font-weight-semibold)',
                          textTransform: 'none',
                          borderRadius: 'var(--radius-lg)',
                          padding: '12px 24px',
                          '&:hover': {
                            borderColor: 'var(--color-primary)',
                            backgroundColor: 'var(--color-primary-50)'
                          }
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={!topUpAmount || !!topUpError}
                        sx={{
                          background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-family)',
                          fontWeight: 'var(--font-weight-semibold)',
                          textTransform: 'none',
                          borderRadius: 'var(--radius-lg)',
                          padding: '12px 24px',
                          boxShadow: 'var(--shadow-md)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                            boxShadow: 'var(--shadow-lg)',
                            transform: 'translateY(-2px)'
                          },
                          '&:disabled': {
                            opacity: 0.6
                          }
                        }}
                      >
                        <Add sx={{ fontSize: 18, mr: 0.5 }} />
                        Nạp tiền
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            )}
          </Box>
        </Box>

        {/* Sub-tabs for Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Paper
            elevation={0}
            sx={{
              padding: 4,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <History sx={{ color: 'var(--color-primary)', fontSize: 28 }} />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Lịch sử giao dịch
                </Typography>
              </Box>
            </Box>
            
            {/* Sub-tabs */}
            <Tabs
              value={mainWalletSubTab}
              onChange={(e, newValue) => setMainWalletSubTab(newValue)}
              sx={{
                marginBottom: 3,
                borderBottom: '2px solid var(--border-light)',
                '& .MuiTab-root': {
                  fontFamily: 'var(--font-family)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  minHeight: 48,
                  padding: '12px 24px',
                  color: 'var(--text-secondary)',
                  transition: 'all var(--transition-base)',
                  '&:hover': {
                    color: 'var(--color-primary-dark)',
                    backgroundColor: 'var(--color-primary-5)'
                  },
                  '&.Mui-selected': {
                    color: 'var(--color-primary)',
                    fontWeight: 'var(--font-weight-bold)'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'var(--color-primary)',
                  height: 3
                }
              }}
            >
              <Tab label="Lịch sử nạp tiền" />
              <Tab label="Lịch sử giao dịch" />
            </Tabs>
            
            {/* Sub-tab 0: Deposit History */}
            {mainWalletSubTab === 0 && (
            <>
            {isLoadingTransactions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 4 }}>
                <CircularProgress />
              </Box>
            ) : transactionError ? (
              <Paper
                elevation={0}
                sx={{
                  padding: 3,
                  backgroundColor: 'var(--color-error-50)',
                  border: '1px solid var(--color-error-100)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center'
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: 'var(--color-error-dark)',
                    marginBottom: 2,
                    fontFamily: 'var(--font-family)'
                  }}
                >
                  {transactionError}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => loadTransactions(pagination.pageIndex)}
                  startIcon={<Refresh />}
                  sx={{
                    background: 'var(--color-error)',
                    '&:hover': {
                      background: 'var(--color-error-dark)'
                    }
                  }}
                >
                  Thử lại
                </Button>
              </Paper>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <Paper
                        key={transaction.id}
                        elevation={0}
                        component={motion.div}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={async () => {
                          // Nếu là giao dịch pending, mở link thanh toán
                          if (transaction.status === 'pending') {
                            let checkoutUrl = transaction.checkoutUrl;
                            
                            // Nếu chưa có checkoutUrl, thử lấy từ localStorage hoặc fetch từ API
                            if (!checkoutUrl) {
                            // Thử lấy từ localStorage
                            try {
                              checkoutUrl = localStorage.getItem(`deposit_checkout_${transaction.id}`) || null;
                            } catch (e) {
                              // Silent fail - localStorage access denied
                            }
                            
                            // Nếu vẫn chưa có, fetch từ API
                            if (!checkoutUrl && transaction.id) {
                              try {
                                const depositDetail = await depositService.getDepositById(transaction.id);
                                checkoutUrl = depositDetail?.checkoutUrl || null;
                                
                                // Lưu vào localStorage để lần sau không cần fetch
                                if (checkoutUrl) {
                                  try {
                                    localStorage.setItem(`deposit_checkout_${transaction.id}`, checkoutUrl);
                                  } catch (e) {
                                    // Silent fail - localStorage access denied
                                  }
                                }
                              } catch (error) {
                                addNotification({
                                  message: 'Không thể lấy thông tin thanh toán. Vui lòng thử lại sau.',
                                  severity: 'error'
                                });
                                return;
                              }
                            }
                            }
                            
                            if (checkoutUrl) {
                              window.open(checkoutUrl, '_blank');
                            } else {
                              addNotification({
                                message: 'Không tìm thấy link thanh toán cho giao dịch này.',
                                severity: 'warning'
                              });
                            }
                          }
                        }}
                        sx={{
                          padding: 2.5,
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2.5,
                          transition: 'all var(--transition-base)',
                          cursor: transaction.status === 'pending' ? 'pointer' : 'default',
                          '&:hover': {
                            boxShadow: 'var(--shadow-md)',
                            transform: transaction.status === 'pending' ? 'translateY(-2px)' : 'none',
                            borderColor: transaction.status === 'pending' ? 'var(--color-primary-50)' : 'var(--border-light)',
                            backgroundColor: transaction.status === 'pending' ? 'var(--color-primary-5)' : 'var(--bg-primary)'
                          }
                        }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 'var(--radius-lg)',
                            backgroundColor: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: getTransactionColor(transaction.type),
                            flexShrink: 0
                          }}
                        >
                          {getTransactionIcon(transaction.type)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: 'var(--font-family)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-primary)',
                              marginBottom: 0.5
                            }}
                          >
                            {transaction.description}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'var(--font-family)',
                              color: 'var(--text-secondary)',
                              marginBottom: 0.5
                            }}
                          >
                            {(() => {
                              // Parse timestamp from API (UTC) and convert to VN time
                              const date = new Date(transaction.date);
                              // Browser will automatically convert UTC to local time (VN timezone)
                              return date.toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              });
                            })()}
                          </Typography>
                          {transaction.status && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, marginTop: 0.5 }}>
                              {getStatusIcon(transaction.status)}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'var(--font-family)',
                                  color: transaction.status === 'completed' 
                                    ? 'var(--color-success)' 
                                    : transaction.status === 'pending'
                                    ? 'var(--color-warning)'
                                    : 'var(--color-error)',
                                  fontWeight: 'var(--font-weight-medium)'
                                }}
                              >
                                {transaction.status === 'pending' ? 'Đang chờ' : 
                                 transaction.status === 'completed' ? 'Hoàn thành' : 
                                 transaction.status}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: 'var(--font-family-heading)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: getTransactionColor(transaction.type),
                            textAlign: 'right',
                            flexShrink: 0,
                            minWidth: 120
                          }}
                        >
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </Typography>
                      </Paper>
                    ))
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        padding: 4,
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px dashed var(--border-light)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      <History sx={{ fontSize: 64, color: 'var(--text-tertiary)', marginBottom: 2, opacity: 0.5 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-family)',
                          fontWeight: 'var(--font-weight-medium)',
                          marginBottom: 1
                        }}
                      >
                        Chưa có giao dịch nào
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-family)'
                        }}
                      >
                        Các giao dịch nạp tiền sẽ hiển thị ở đây
                      </Typography>
                    </Paper>
                  )}
                </Box>
                
                {/* Pagination Controls */}
                {pagination.totalCount > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      marginTop: 3,
                      paddingTop: 3,
                      borderTop: '1px solid var(--border-light)'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                      }}
                    >
                      <Pagination
                        count={pagination.totalPages}
                        page={pagination.pageIndex}
                        onChange={(event, value) => handlePageChange(value)}
                        disabled={isLoadingTransactions}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                        sx={{
                          '& .MuiPaginationItem-root': {
                            fontFamily: 'var(--font-family)',
                            fontWeight: 'var(--font-weight-medium)',
                            '&.Mui-selected': {
                              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                              color: 'white',
                              fontWeight: 'var(--font-weight-bold)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)'
                              }
                            },
                            '&:hover': {
                              backgroundColor: 'var(--color-primary-50)'
                            }
                          }
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)',
                        textAlign: 'center'
                      }}
                    >
                      Hiển thị {((pagination.pageIndex - 1) * pagination.pageSize + 1)} - {Math.min(pagination.pageIndex * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} giao dịch
                    </Typography>
                  </Box>
                )}
              </>
            )}
            </>
            )}
            
            {/* Sub-tab 1: All Transactions */}
            {mainWalletSubTab === 1 && (
            <>
            {isLoadingAllTransactions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 4 }}>
                <CircularProgress />
              </Box>
            ) : allTransactionError ? (
              <Paper
                elevation={0}
                sx={{
                  padding: 3,
                  backgroundColor: 'var(--color-error-50)',
                  border: '1px solid var(--color-error-100)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center'
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: 'var(--color-error-dark)',
                    marginBottom: 2,
                    fontFamily: 'var(--font-family)'
                  }}
                >
                  {allTransactionError}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => loadAllTransactions(allTransactionPagination.pageIndex)}
                  startIcon={<Refresh />}
                  sx={{
                    background: 'var(--color-error)',
                    '&:hover': {
                      background: 'var(--color-error-dark)'
                    }
                  }}
                >
                  Thử lại
                </Button>
              </Paper>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {allTransactions.length > 0 ? (
                    allTransactions.map((transaction) => {
                      const typeInfo = getTransactionTypeInfo(transaction.transactionType);
                      const IconComponent = typeInfo.icon;
                      const isPositive = transaction.amount > 0;
                      
                      return (
                        <Paper
                          key={transaction.id}
                          elevation={0}
                          component={motion.div}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => { setSelectedTransaction(transaction); setDetailDialogOpen(true); }}
                          sx={{
                            padding: 2.5,
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2.5,
                            transition: 'all var(--transition-base)',
                            cursor: 'pointer',
                            '&:hover': {
                              boxShadow: 'var(--shadow-md)',
                              transform: 'translateY(-2px)',
                              borderColor: 'var(--color-primary-50)'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 'var(--radius-lg)',
                              backgroundColor: 'var(--bg-tertiary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isPositive ? 'var(--color-success)' : 'var(--color-error)',
                              flexShrink: 0
                            }}
                          >
                            <IconComponent sx={{ fontSize: 24 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontFamily: 'var(--font-family)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--text-primary)',
                                marginBottom: 0.5
                              }}
                            >
                              {typeInfo.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'var(--font-family)',
                                color: 'var(--text-secondary)',
                                marginBottom: 0.5
                              }}
                            >
                              {formatTransactionDate(transaction.transactionDate)}
                            </Typography>
                            {transaction.description && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'var(--font-family)',
                                  color: 'var(--text-tertiary)',
                                  display: 'block'
                                }}
                              >
                                {transaction.description}
                              </Typography>
                            )}
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: 'var(--font-family-heading)',
                              fontWeight: 'var(--font-weight-bold)',
                              color: isPositive ? 'var(--color-success)' : 'var(--color-error)',
                              textAlign: 'right',
                              flexShrink: 0,
                              minWidth: 120
                            }}
                          >
                            {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
                          </Typography>
                        </Paper>
                      );
                    })
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        padding: 4,
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px dashed var(--border-light)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      <History sx={{ fontSize: 64, color: 'var(--text-tertiary)', marginBottom: 2, opacity: 0.5 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-family)',
                          fontWeight: 'var(--font-weight-medium)',
                          marginBottom: 1
                        }}
                      >
                        Chưa có giao dịch nào
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-family)'
                        }}
                      >
                        Tất cả giao dịch của bạn sẽ hiển thị ở đây
                      </Typography>
                    </Paper>
                  )}
                </Box>
                
                {/* Pagination Controls */}
                {allTransactionPagination.totalCount > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      marginTop: 3,
                      paddingTop: 3,
                      borderTop: '1px solid var(--border-light)'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                      }}
                    >
                      <Pagination
                        count={allTransactionPagination.totalPages}
                        page={allTransactionPagination.pageIndex}
                        onChange={(event, value) => handleAllTransactionPageChange(value)}
                        disabled={isLoadingAllTransactions}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                        sx={{
                          '& .MuiPaginationItem-root': {
                            fontFamily: 'var(--font-family)',
                            fontWeight: 'var(--font-weight-medium)',
                            '&.Mui-selected': {
                              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                              color: 'white',
                              fontWeight: 'var(--font-weight-bold)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)'
                              }
                            },
                            '&:hover': {
                              backgroundColor: 'var(--color-primary-50)'
                            }
                          }
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)',
                        textAlign: 'center'
                      }}
                    >
                      Hiển thị {((allTransactionPagination.pageIndex - 1) * allTransactionPagination.pageSize + 1)} - {Math.min(allTransactionPagination.pageIndex * allTransactionPagination.pageSize, allTransactionPagination.totalCount)} trong tổng số {allTransactionPagination.totalCount} giao dịch
                    </Typography>
                  </Box>
                )}
              </>
            )}
            </>
            )}
          </Paper>
        </motion.div>
        {/* Transaction Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontFamily: 'var(--font-family-heading)', fontWeight: 'var(--font-weight-bold)' }}>
            Chi tiết giao dịch
          </DialogTitle>
          <DialogContent dividers>
            {selectedTransaction ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(() => {
                  const typeInfo = getTransactionTypeInfo(selectedTransaction.transactionType);
                  const IconComponent = typeInfo.icon;
                  const isPositive = selectedTransaction.amount > 0;
                  const walletBadge = selectedTransaction.walletType === 'Student' ? 'Ví con' : 'Ví chính';
                  const flowBadge = isPositive ? 'Tiền vào' : 'Tiền ra';
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComponent sx={{ fontSize: 24, color: isPositive ? 'var(--color-success)' : 'var(--color-error)' }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontFamily: 'var(--font-family-heading)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                            {typeInfo.label}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip size="small" label={walletBadge} sx={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }} />
                            <Chip size="small" label={flowBadge} sx={{ backgroundColor: isPositive ? 'var(--color-success-10)' : 'var(--color-error-10)', color: isPositive ? 'var(--color-success)' : 'var(--color-error)' }} />
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="h5" sx={{ fontFamily: 'var(--font-family-heading)', fontWeight: 'var(--font-weight-bold)', color: isPositive ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {isPositive ? '+' : ''}{formatCurrency(selectedTransaction.amount)}
                      </Typography>
                    </Box>
                  );
                })()}

                <Divider sx={{ my: 1 }} />

                {/* Info rows */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: 'var(--text-secondary)' }} />
                    <Typography variant="body2" sx={{ fontFamily: 'var(--font-family)', color: 'var(--text-secondary)', minWidth: 100 }}>
                      Thời gian
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'var(--font-family)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {formatTransactionDate(selectedTransaction.transactionDate)}
                    </Typography>
                  </Box>

                  {selectedTransaction.description && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description sx={{ fontSize: 18, color: 'var(--text-secondary)' }} />
                      <Typography variant="body2" sx={{ fontFamily: 'var(--font-family)', color: 'var(--text-secondary)', minWidth: 100 }}>
                        Mô tả
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'var(--font-family)' }}>
                        {selectedTransaction.description}
                      </Typography>
                    </Box>
                  )}

                  {selectedTransaction.id && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Receipt sx={{ fontSize: 18, color: 'var(--text-secondary)' }} />
                      <Typography variant="body2" sx={{ fontFamily: 'var(--font-family)', color: 'var(--text-secondary)', minWidth: 100 }}>
                        Mã giao dịch
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'var(--font-family)' }}>
                        {selectedTransaction.id}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)} variant="contained">Đóng</Button>
          </DialogActions>
        </Dialog>
          </>
        )}

        {/* Tab Panel 1: Children Wallet */}
        {activeTab === 1 && (
          <>
            {childWalletError && (
              <div className={styles.errorState}>
                <p className={styles.errorMessage}>{childWalletError}</p>
                <button className={styles.retryButton} onClick={loadChildWallets}>
                  <Refresh sx={{ fontSize: 16, mr: 0.5 }} />
                  Thử lại
                </button>
              </div>
            )}

            {isChildWalletLoading ? (
              <ContentLoading isLoading={isChildWalletLoading} text="Đang tải thông tin ví con..." />
            ) : childWallets.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' },
                    gap: 3
                  }}
                >
                  {/* Left: Child Wallets Grid */}
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--text-primary)',
                        marginBottom: 2
                      }}
                    >
                      Ví tiêu vặt của con
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(2, 1fr)' },
                        gap: 2.5
                      }}
                    >
                      {childWallets.map((childWallet) => (
                        <Paper
                          key={childWallet.walletId || childWallet.studentId}
                          elevation={0}
                          sx={{
                            padding: 2.5,
                            backgroundColor: 'var(--bg-primary)',
                            border: '2px solid var(--color-primary-50)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all var(--transition-base)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '3px',
                              background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
                            },
                            '&:hover': {
                              boxShadow: 'var(--shadow-lg)',
                              transform: 'translateY(-4px)',
                              borderColor: 'var(--color-primary)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 2 }}>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 'var(--radius-lg)',
                                background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'var(--shadow-sm)',
                                flexShrink: 0
                              }}
                            >
                              <Wallet sx={{ fontSize: 28, color: 'var(--color-primary)' }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontFamily: 'var(--font-family-heading)',
                                  fontWeight: 'var(--font-weight-bold)',
                                  color: 'var(--text-primary)',
                                  marginBottom: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {childWallet.studentName}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: 'var(--color-primary-50)',
                                  gap: 0.5
                                }}
                              >
                                <MoneyIcon sx={{ fontSize: 14, color: 'var(--color-primary-dark)' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'var(--color-primary-dark)',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 'var(--font-weight-bold)'
                                  }}
                                >
                                  {formatCurrency(childWallet.balance)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                              padding: 1.5,
                              backgroundColor: 'var(--bg-secondary)',
                              borderRadius: 'var(--radius-lg)',
                              border: '1px solid var(--border-light)'
                            }}
                          >
                            {[
                              childWallet.levelName ? { label: 'Cấp độ', value: childWallet.levelName, icon: <School sx={{ fontSize: 16 }} /> } : null,
                              childWallet.schoolName ? { label: 'Trường', value: childWallet.schoolName, icon: <Business sx={{ fontSize: 16 }} /> } : null,
                              childWallet.branchName ? { label: 'Chi nhánh', value: childWallet.branchName, icon: <Business sx={{ fontSize: 16 }} /> } : null
                            ].filter(Boolean).map((info, index) => (
                              <Box
                                key={index}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  paddingBottom: index < 2 ? 1 : 0,
                                  borderBottom: index < 2 ? '1px solid var(--border-light)' : 'none'
                                }}
                              >
                                <Box sx={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', minWidth: 20 }}>
                                  {info.icon}
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'var(--text-secondary)',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    marginRight: 1
                                  }}
                                >
                                  {info.label}:
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1
                                  }}
                                >
                                  {info.value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>

                  {/* Right: Transfer Form Sidebar */}
                  <Paper
                    elevation={0}
                    sx={{
                      padding: 3,
                      backgroundColor: 'var(--bg-primary)',
                      border: '2px solid var(--color-primary-50)',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-md)',
                      position: 'sticky',
                      top: 24,
                      height: 'fit-content',
                      maxHeight: 'calc(100vh - 48px)',
                      overflowY: 'auto'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, marginBottom: 2.5 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 'var(--radius-lg)',
                          background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Send sx={{ color: 'var(--color-primary)', fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: 'var(--font-family-heading)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--text-primary)',
                            marginBottom: 0.5
                          }}
                        >
                          Chuyển tiền
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-family)'
                          }}
                        >
                          Từ ví chính sang ví con
                        </Typography>
                      </Box>
                    </Box>

                    <Box component="form" onSubmit={handleTransfer} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="student-select-label">Chọn con</InputLabel>
                        <Select
                          labelId="student-select-label"
                          id="student-select"
                          value={transferForm.toStudentId}
                          label="Chọn con"
                          onChange={(e) => setTransferForm((prev) => ({
                            ...prev,
                            toStudentId: e.target.value
                          }))}
                          disabled={isTransferring || childWallets.length === 0}
                          sx={{
                            borderRadius: 'var(--radius-lg)',
                            fontFamily: 'var(--font-family)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'var(--border-light)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'var(--color-primary)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'var(--color-primary)',
                              borderWidth: '2px'
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>-- Chọn con --</em>
                          </MenuItem>
                          {childWallets.map((child) => (
                            <MenuItem key={child.studentId} value={child.studentId}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <Typography variant="body2" sx={{ fontFamily: 'var(--font-family)' }}>
                                  {child.studentName}
                                </Typography>
                                <Chip
                                  label={formatCurrency(child.balance)}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'var(--color-primary-50)',
                                    color: 'var(--color-primary-dark)',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    fontSize: '0.7rem',
                                    height: 20
                                  }}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth required>
                        <TextField
                          label="Số tiền (VND)"
                          type="number"
                          value={transferForm.amount}
                          onChange={(e) => setTransferForm((prev) => ({
                            ...prev,
                            amount: e.target.value
                          }))}
                          disabled={isTransferring}
                          placeholder="Ví dụ: 500000"
                          inputProps={{
                            min: 1000,
                            step: 1000
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon sx={{ color: 'var(--text-secondary)', fontSize: 18 }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                  VND
                                </Typography>
                              </InputAdornment>
                            )
                          }}
                          helperText="Tối thiểu: 1.000 VND"
                          sx={{
                            fontFamily: 'var(--font-family)',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 'var(--radius-lg)',
                              '&:hover fieldset': {
                                borderColor: 'var(--color-primary)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'var(--color-primary)',
                                borderWidth: '2px'
                              }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: 'var(--color-primary)'
                            }
                          }}
                        />
                      </FormControl>

                      <FormControl fullWidth>
                        <TextField
                          label="Ghi chú (tùy chọn)"
                          multiline
                          rows={2}
                          value={transferForm.note}
                          onChange={(e) => setTransferForm((prev) => ({
                            ...prev,
                            note: e.target.value
                          }))}
                          disabled={isTransferring}
                          placeholder="Ví dụ: Tiền ăn vặt tuần này"
                          sx={{
                            fontFamily: 'var(--font-family)',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 'var(--radius-lg)',
                              '&:hover fieldset': {
                                borderColor: 'var(--color-primary)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'var(--color-primary)',
                                borderWidth: '2px'
                              }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: 'var(--color-primary)'
                            }
                          }}
                        />
                      </FormControl>

                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isTransferring || childWallets.length === 0 || !transferForm.toStudentId || !transferForm.amount}
                        startIcon={isTransferring ? <CircularProgress size={18} /> : <Send />}
                        sx={{
                          background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-family)',
                          fontWeight: 'var(--font-weight-semibold)',
                          textTransform: 'none',
                          borderRadius: 'var(--radius-lg)',
                          padding: '14px 24px',
                          boxShadow: 'var(--shadow-md)',
                          marginTop: 1,
                          '&:hover': {
                            background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                            boxShadow: 'var(--shadow-lg)',
                            transform: 'translateY(-2px)'
                          },
                          '&:disabled': {
                            opacity: 0.6,
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        {isTransferring ? 'Đang chuyển...' : 'Chuyển tiền'}
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              </Box>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  padding: 4,
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px dashed var(--border-light)',
                  borderRadius: 'var(--radius-xl)'
                }}
              >
                <Wallet sx={{ fontSize: 64, color: 'var(--text-tertiary)', marginBottom: 2, opacity: 0.5 }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-family)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 1
                  }}
                >
                  Chưa có ví tiêu vặt nào
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-family)'
                  }}
                >
                  Thêm con và tạo ví để quản lý chi tiêu.
                </Typography>
              </Paper>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MainWallet;

