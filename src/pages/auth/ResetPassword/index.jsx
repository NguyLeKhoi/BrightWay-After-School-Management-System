import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Box, IconButton, Alert } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import AuthCard from '@components/Auth/AuthCard';
import Form from '../../../components/Common/Form';
import Loading from '../../../components/Common/Loading';
import { resetPasswordSchema } from '../../../utils/validationSchemas/authSchemas';
import { useApp } from '../../../contexts/AppContext';
import { useLoading } from '../../../hooks/useLoading';
import authService from '../../../services/auth.service';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification, showGlobalError } = useApp();
  const { isLoading, showLoading, hideLoading } = useLoading(300);
  const [tokenFromUrl, setTokenFromUrl] = useState('');
  const [emailFromUrl, setEmailFromUrl] = useState('');

  // Extract token and email from URL parameters
  useEffect(() => {
    const token = searchParams.get('token') || searchParams.get('code');
    const email = searchParams.get('email');
    
    if (token) {
      setTokenFromUrl(token);
    }
    if (email) {
      setEmailFromUrl(decodeURIComponent(email));
    }
  }, [searchParams]);

  const handleSubmit = async (data) => {
    showLoading();

    try {
      // Use token and email from URL if available, otherwise from form
      const resetData = {
        email: emailFromUrl || data.email,
        code: tokenFromUrl || data.code,
        newPassword: data.newPassword
      };

      // Call reset password API
      await authService.resetPasswordWithCode(resetData);

      // Show success notification
      addNotification({
        message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.',
        severity: 'success'
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {

      const errorMessage = err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      showGlobalError(errorMessage);
    } finally {
      hideLoading();
    }
  };

  // Determine which fields to show based on URL parameters
  const getFormFields = () => {
    const fields = [];
    
    // Show email field if not in URL
    if (!emailFromUrl) {
      fields.push({
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'Nhập email của bạn'
      });
    }
    
    // Show code field if not in URL
    if (!tokenFromUrl) {
      fields.push({
        name: 'code',
        label: 'Mã xác nhận',
        type: 'text',
        required: true,
        placeholder: 'Nhập mã xác nhận (5 ký tự)',
        helperText: 'Mã xác nhận đã được gửi đến email của bạn'
      });
    }
    
    // Always show password fields
    fields.push(
      {
        name: 'newPassword',
        label: 'Mật khẩu mới',
        type: 'password',
        required: true,
        placeholder: 'Nhập mật khẩu mới',
        helperText: 'Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số'
      },
      {
        name: 'confirmPassword',
        label: 'Xác nhận mật khẩu',
        type: 'password',
        required: true,
        placeholder: 'Nhập lại mật khẩu mới'
      }
    );
    
    return fields;
  };

  // Set default values for hidden fields
  const getDefaultValues = () => {
    const defaults = {};
    if (emailFromUrl) defaults.email = emailFromUrl;
    if (tokenFromUrl) defaults.code = tokenFromUrl;
    return defaults;
  };

  return (
    <>
      {isLoading && <Loading />}
      <div className={styles.resetPasswordPage}>
        <div className={styles.resetPasswordContainer}>
          <AuthCard
            title="Đặt lại mật khẩu"
            headerAction={
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  color: 'var(--color-primary)',
                  '&:hover': {
                    backgroundColor: 'var(--color-primary-50)'
                  }
                }}
                title="Về trang chủ"
              >
                <HomeIcon />
              </IconButton>
            }
          >
            {/* Info Box */}
            <Box sx={{ mb: 3 }}>
              {(emailFromUrl || tokenFromUrl) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {emailFromUrl && (
                    <Typography variant="body2">
                      Email: <strong>{emailFromUrl}</strong>
                    </Typography>
                  )}
                  {tokenFromUrl && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Mã xác nhận đã được xác thực
                    </Typography>
                  )}
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary">
                Vui lòng nhập mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 8 ký tự, 
                bao gồm chữ hoa, chữ thường và số.
              </Typography>
            </Box>

            {/* Reset Password Form */}
            <Form
              schema={resetPasswordSchema}
              onSubmit={handleSubmit}
              submitText="Đặt lại mật khẩu"
              fields={getFormFields()}
              defaultValues={getDefaultValues()}
            />

            {/* Back to Login Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Đã nhớ mật khẩu?{' '}
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/login');
                  }}
                  className={styles.link}
                >
                  Đăng nhập
                </a>
              </Typography>
            </Box>
          </AuthCard>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;

