import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Box, IconButton, Alert } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import AuthCard from '@components/Auth/AuthCard';
import Form from '../../../components/Common/Form';
import Loading from '../../../components/Common/Loading';
import { setPasswordSchema } from '../../../utils/validationSchemas/authSchemas';
import { useApp } from '../../../contexts/AppContext';
import { useLoading } from '../../../hooks/useLoading';
import authService from '../../../services/auth.service';
import styles from './SetPassword.module.css';

const SetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification, showGlobalError } = useApp();
  const { isLoading, showLoading, hideLoading } = useLoading(300);
  const [email, setEmail] = useState('');

  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');

  // Extract token and userId from URL parameters
  useEffect(() => {
    // Lấy token và userId từ URL
    // Dùng cả searchParams và window.location để đảm bảo lấy đúng
    const tokenParam = searchParams.get('token') || new URLSearchParams(window.location.search).get('token');
    const userIdParam = searchParams.get('userId') || new URLSearchParams(window.location.search).get('userId');
    
    console.log('🔍 [SetPassword] URL Params Debug:', {
      'window.location.search': window.location.search,
      'tokenParam (raw)': tokenParam,
      'tokenParam length': tokenParam?.length,
      'tokenParam first 50 chars': tokenParam?.substring(0, 50),
      'tokenParam last 50 chars': tokenParam?.substring(tokenParam?.length - 50),
      'userIdParam': userIdParam
    });
    
    if (tokenParam) {
      // searchParams.get() tự động decode URL-encoded values
      // Token từ URL: "CfDJ8...%2bF6H..." -> "CfDJ8...+F6H..."
      setToken(tokenParam);
    }
    
    if (userIdParam) {
      setUserId(userIdParam);
    }
  }, [searchParams]);

  const handleSubmit = async (data) => {
    if (!token || !userId) {
      showGlobalError('Link không hợp lệ. Vui lòng kiểm tra lại email của bạn.');
      return;
    }

    if (!data.password) {
      showGlobalError('Vui lòng nhập mật khẩu.');
      return;
    }

    showLoading();

    try {
      console.log('🔍 [SetPassword] Before API call:', {
        'userId': userId,
        'token length': token?.length,
        'token first 50 chars': token?.substring(0, 50),
        'token last 50 chars': token?.substring(token?.length - 50),
        'password length': data.password?.length,
        'password (masked)': '*'.repeat(data.password?.length || 0)
      });
      
      // Call set password API với userId và token từ URL
      await authService.setPassword({
        userId: userId,
        token: token,
        password: data.password
      });

      // Show success notification
      addNotification({
        message: 'Đặt mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.',
        severity: 'success'
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Set password error:', err);
      const errorMessage = err.message || 'Đặt mật khẩu thất bại. Vui lòng thử lại hoặc liên hệ quản trị viên.';
      showGlobalError(errorMessage);
    } finally {
      hideLoading();
    }
  };

  return (
    <>
      {isLoading && <Loading />}
      <div className={styles.setPasswordPage}>
        <div className={styles.setPasswordContainer}>
          <AuthCard>
            {/* Title */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 'bold', 
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-family-heading)'
              }}>
                Đặt mật khẩu
              </Typography>
            </Box>
            {/* Instructions */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Vui lòng đặt mật khẩu để hoàn tất quá trình kích hoạt tài khoản.
              </Typography>
              
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                backgroundColor: 'rgba(26, 188, 156, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(26, 188, 156, 0.2)'
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold',
                  color: 'var(--color-gray-900)',
                  mb: 1
                }}>
                  Yêu cầu mật khẩu:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ 
                  pl: 2.5, 
                  m: 0,
                  color: 'var(--color-gray-700)',
                  '& li': {
                    mb: 0.5
                  }
                }}>
                  <li>Tối thiểu <strong>8 ký tự</strong></li>
                  <li>Ít nhất <strong>1 chữ hoa (A-Z)</strong></li>
                  <li>Ít nhất <strong>1 chữ thường (a-z)</strong></li>
                  <li>Ít nhất <strong>1 chữ số (0-9)</strong></li>
                  <li>Chỉ chứa: chữ cái, số và ký tự đặc biệt <strong>(@$!%*?&)</strong></li>
                </Typography>
              </Box>
            </Box>

            {/* Set Password Form */}
            <Form
              schema={setPasswordSchema}
              onSubmit={handleSubmit}
              submitText="Xác nhận"
              fields={[
                {
                  name: 'password',
                  label: 'Mật khẩu',
                  type: 'password',
                  required: true,
                  placeholder: 'Nhập mật khẩu của bạn',
                  autoComplete: 'new-password',
                  helperText: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'
                }
              ]}
            />


          </AuthCard>
        </div>
      </div>
    </>
  );
};

export default SetPassword;
