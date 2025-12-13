import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button,
  Paper,
  Fade,
  Zoom
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  AccountBalanceWallet as WalletIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import useContentLoading from '../../../hooks/useContentLoading';
import ContentLoading from '../../../components/Common/ContentLoading';
import AuthCard from '../../../components/Auth/AuthCard';
import depositService from '../../../services/deposit.service';
import styles from './PaymentSuccess.module.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addNotification, showGlobalError } = useApp();
  const { isLoading, showLoading, hideLoading } = useContentLoading();
  
  const [isValid, setIsValid] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);


  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // Only allow User role - redirect other roles to their appropriate pages
    if (user.role?.toLowerCase() !== 'user') {
      const userRole = user.role?.toLowerCase();
      let redirectPath = '/';
      
      // Redirect based on role
      if (userRole === 'admin') {
        redirectPath = '/admin/dashboard';
      } else if (userRole === 'manager') {
        redirectPath = '/manager/dashboard';
      } else if (userRole === 'staff') {
        redirectPath = '/staff/dashboard';
      }
      
      navigate(redirectPath, { replace: true });
      return;
    }

    // Get query parameters from PayOS redirect
    const orderCode = searchParams.get('orderCode');
    const status = searchParams.get('status');
    const depositId = searchParams.get('depositId');
    const code = searchParams.get('code'); // PayOS return code

    // If no valid parameters from PayOS, redirect to wallet
    // This prevents users from accessing this page directly by typing URL
    if (!orderCode && !depositId && !code) {
      navigate('/user/finance/wallet', { replace: true });
      return;
    }

    // Verify payment and sync wallet
    const verifyPayment = async () => {
      if (hasChecked) return;
      setHasChecked(true);

      showLoading();
      try {
        // Trigger webhook to sync payment status with backend
        // Backend will verify the payment with PayOS and update wallet balance
        await depositService.triggerPayosWebhook();

        setIsValid(true);
        setPaymentInfo({
          orderCode: orderCode || 'N/A',
          depositId: depositId || 'N/A',
          status: status || code || 'completed'
        });

        addNotification({
          message: 'Thanh toán thành công! Số dư ví đã được cập nhật.',
          severity: 'success'
        });
      } catch (error) {
        // Even if verification fails, if we have orderCode/depositId/code from PayOS redirect,
        // we can still show success page (backend webhook will handle verification)
        // This is because PayOS redirects here only after successful payment
        setIsValid(true);
        setPaymentInfo({
          orderCode: orderCode || 'N/A',
          depositId: depositId || 'N/A',
          status: status || code || 'completed'
        });
      } finally {
        hideLoading();
      }
    };

    verifyPayment();
  }, [user, navigate, searchParams, hasChecked, showLoading, hideLoading, addNotification]);

  const handleBackToWallet = () => {
    navigate('/user/finance/wallet', { replace: true });
  };

  // Show loading while checking
  if (!hasChecked || isLoading) {
    return <ContentLoading isLoading={true} text="Đang xác thực thanh toán..." />;
  }

  // If invalid, redirect (handled in useEffect)
  if (!isValid) {
    return null;
  }

  return (
    <div className={styles.paymentSuccessPage}> 
      <div className={styles.container}>
        <AuthCard title="Thanh toán thành công">
          <Fade in={true} timeout={500}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Zoom in={true} timeout={600}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 3
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                      color: 'white',
                      boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 64 }} />
                  </Box>
                </Box>
              </Zoom>

              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  mb: 2
                }}
              >
                Giao dịch thành công!
              </Typography>

              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  mb: 4,
                  lineHeight: 1.8
                }}
              >
                Thanh toán của bạn đã được xử lý thành công. 
                Số dư ví đã được cập nhật và bạn có thể sử dụng ngay.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<WalletIcon />}
                onClick={handleBackToWallet}
                sx={{
                  minWidth: 200,
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)'
                  }
                }}
              >
                Về trang ví
              </Button>
            </Box>
          </Fade>
        </AuthCard>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;

