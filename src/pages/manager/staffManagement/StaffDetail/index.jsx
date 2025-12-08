import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Typography,
  Button,
  Divider,
  Paper,
  Chip,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import { 
  ArrowBack,
  Person,
  Email,
  Phone,
  Business,
  CalendarToday
} from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import userService from '../../../../services/user.service';
import { useApp } from '../../../../contexts/AppContext';
import styles from './StaffDetail.module.css';

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Thiếu thông tin cần thiết');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const staffData = await userService.getUserById(id, true);
        setStaff(staffData);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin nhân viên';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, showGlobalError]);

  const handleBack = () => {
    navigate('/manager/staff');
  };

  if (loading) {
    return (
      <ContentLoading isLoading={true} text="Đang tải thông tin nhân viên..." />
    );
  }

  if (error || !staff) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Quay lại
          </Button>
          <Alert severity="error">
            {error || 'Không tìm thấy thông tin nhân viên'}
          </Alert>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.detailPage}>
      <div className={styles.container}>
        {/* Header */}
        <Paper 
          elevation={0}
          sx={{
            padding: 3,
            marginBottom: 3,
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              variant="contained"
              sx={{
                borderRadius: 'var(--radius-lg)',
                textTransform: 'none',
                fontFamily: 'var(--font-family)',
                background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                boxShadow: 'var(--shadow-sm)',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                  boxShadow: 'var(--shadow-md)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Quay lại
            </Button>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                flex: 1
              }}
            >
              Chi tiết Nhân Viên
            </Typography>
          </Box>
        </Paper>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Thông tin Nhân Viên
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Avatar and Name */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={staff.profilePictureUrl && staff.profilePictureUrl !== 'string' ? staff.profilePictureUrl : undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}
                >
                  {(staff.name || staff.fullName || 'S')?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Tên
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {staff.name || staff.fullName || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Email sx={{ color: 'var(--text-secondary)', fontSize: 24 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {staff.email || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {(staff.phoneNumber || staff.staffProfile?.phoneNumber) && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Phone sx={{ color: 'var(--text-secondary)', fontSize: 24 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Số Điện Thoại
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {staff.phoneNumber || staff.staffProfile?.phoneNumber || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                </>
              )}

              {(staff.branchName || staff.staffProfile?.branchName) && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Business sx={{ color: 'var(--text-secondary)', fontSize: 24 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Chi Nhánh
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {staff.branchName || staff.staffProfile?.branchName || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                </>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarToday sx={{ color: 'var(--text-secondary)', fontSize: 24 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Ngày Tạo
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(staff.createdAt)}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Trạng Thái
                  </Typography>
                  <Chip
                    label={staff.isActive !== false ? 'Hoạt động' : 'Không hoạt động'}
                    color={staff.isActive !== false ? 'success' : 'default'}
                    size="small"
                    sx={{ width: 'fit-content' }}
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDetail;

