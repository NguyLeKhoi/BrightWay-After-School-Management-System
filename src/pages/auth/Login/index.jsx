import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, IconButton } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import AuthCard from '@components/Auth/AuthCard';
import Form from '../../../components/Common/Form';
import Loading from '../../../components/Common/Loading';
import { loginSchema } from '../../../utils/validationSchemas/authSchemas';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import { useLoading } from '../../../hooks/useLoading';
import styles from './Login.module.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addNotification, showGlobalError, showSessionEndedDialog } = useApp();
  const { isLoading, showLoading, hideLoading } = useLoading(300);

  // Check for session ended message when login page loads
  useEffect(() => {
    const sessionEndedMessage = sessionStorage.getItem('sessionEndedMessage');
    if (sessionEndedMessage) {
      sessionStorage.removeItem('sessionEndedMessage');
      setTimeout(() => {
        if (window.__showSessionEndedDialog) {
          window.__showSessionEndedDialog(sessionEndedMessage);
        } else {
          showSessionEndedDialog(sessionEndedMessage);
        }
      }, 100);
    }
  }, [showSessionEndedDialog]);

  // Warm-up backend removed - backend doesn't support OPTIONS method for /Auth/login
  // This was causing 405 (Method Not Allowed) errors in console

  const handleSubmit = async (data) => {
    showLoading();

    try {
      const result = await login({
        email: data.email,
        password: data.password
      });

      // Get user info to check role
      const user = result.user;
      
      // Show success notification
      addNotification({
        message: 'Đăng nhập thành công!',
        severity: 'success'
      });
      
      // Redirect based on role (handle both string and number roles)
      const role = user.role;
      
      if (role === 'Admin' || role === 0) {
        navigate('/admin/dashboard');
      } else if (role === 'Manager' || role === 1) {
        navigate('/manager/dashboard');
      } else if (role === 'Staff' || role === 2) {
        navigate('/staff');
      } else if (role === 'User' || role === 4) {
        navigate('/user/dashboard');
      } else {
        navigate('/parent/profile');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
      showGlobalError(errorMessage);
    } finally {
      hideLoading();
    }
  };


  return (
    <>
      {isLoading && <Loading />}
      <div className={styles.loginPage}>
        <div className={styles.loginContainer}>
          <AuthCard
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
            {/* Portal Title inside AuthCard */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 'bold', 
                color: 'var(--color-primary)',
                mb: 1,
                fontFamily: 'var(--font-family-heading)'
              }}>
                BRIGHTWAY
              </Typography>
              <Typography variant="h6" component="h2" sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 'normal',
                fontFamily: 'var(--font-family)'
              }}>
                After School Management Portal
              </Typography>
            </Box>
            <Form
              schema={loginSchema}
              onSubmit={handleSubmit}
              submitText="Đăng nhập"
              fields={[
                { name: 'email', label: 'Email', type: 'email', required: true },
                { name: 'password', label: 'Mật khẩu', type: 'password', required: true }
              ]}
            />
          </AuthCard>
        </div>
      </div>
    </>
  );
};

export default Login;