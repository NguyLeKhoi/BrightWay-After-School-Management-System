import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  Avatar
} from '@mui/material';
import {
  ChildCare as ChildIcon,
  CalendarToday as ScheduleIcon,
  ArrowForward
} from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import studentService from '../../../../services/student.service';
import { useApp } from '../../../../contexts/AppContext';
import useContentLoading from '../../../../hooks/useContentLoading';
import styles from '../Management.module.css';

const ScheduleSelect = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  const { isLoading, showLoading, hideLoading } = useContentLoading();
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);


  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      showLoading();
      setError(null);
      const response = await studentService.getMyChildren();
      const childrenArray = Array.isArray(response) ? response : (Array.isArray(response?.items) ? response.items : []);
      // Chỉ hiển thị những đứa trẻ đã được duyệt
      const approvedChildren = childrenArray.filter(child => child.status === true || child.status === 'active');
      setChildren(approvedChildren);
      
      if (approvedChildren.length === 0) {
        setError('Bạn chưa có con nào được duyệt. Vui lòng đợi quản trị viên duyệt hồ sơ.');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách con';
      setError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      hideLoading();
    }
  };

  const handleSelectChild = (childId) => {
    navigate(`/user/management/schedule/${childId}`);
  };

  if (isLoading) {
    return <ContentLoading isLoading={true} text="Đang tải danh sách con..." />;
  }

  return (
    <motion.div
      className={styles.managementPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.container}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ScheduleIcon sx={{ color: 'var(--color-primary)', fontSize: 32 }} />
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
              Chọn con để xem lịch giữ trẻ
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-family)'
              }}
            >
              Vui lòng chọn một trong các con của bạn để xem lịch giữ trẻ
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ marginBottom: 3 }}>
            {error}
          </Alert>
        )}

        {children.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: children.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
                lg: children.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' 
              },
              gap: 4,
              maxWidth: children.length <= 4 ? '800px' : '100%',
              margin: children.length <= 4 ? '0 auto' : 0
            }}
          >
            {children.map((child) => (
              <Card
                key={child.id}
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                elevation={0}
                sx={{
                  border: '2px solid var(--border-light)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  transition: 'all var(--transition-base)',
                  minHeight: children.length <= 4 ? '280px' : 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    borderColor: 'var(--color-primary)',
                    boxShadow: 'var(--shadow-md)',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleSelectChild(child.id)}
                  sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    '& .MuiCardActionArea-focusHighlight': {
                      background: 'transparent'
                    }
                  }}
                >
                  <CardContent sx={{ padding: 4, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
                    <Avatar
                      src={child.image && child.image !== 'string' ? child.image : undefined}
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: 'var(--color-primary-100)',
                        color: 'var(--color-primary)',
                        fontSize: 40,
                        fontWeight: 'var(--font-weight-bold)',
                        border: '3px solid var(--color-primary-50)'
                      }}
                    >
                      {child.name?.[0]?.toUpperCase() || child.userName?.[0]?.toUpperCase() || 'C'}
                    </Avatar>
                    <Box sx={{ textAlign: 'center', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: 'var(--font-family-heading)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--text-primary)',
                          marginBottom: 1
                        }}
                      >
                        {child.name || child.userName || 'Chưa có tên'}
                      </Typography>
                      {child.branchName && (
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-family)',
                            fontSize: '0.95rem'
                          }}
                        >
                          {child.branchName}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'var(--color-primary)',
                        marginTop: 'auto',
                        pt: 2
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'var(--font-family)',
                          fontWeight: 'var(--font-weight-semibold)',
                          fontSize: '1rem'
                        }}
                      >
                        Xem lịch giữ trẻ
                      </Typography>
                      <ArrowForward sx={{ fontSize: 20 }} />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </div>
    </motion.div>
  );
};

export default ScheduleSelect;

