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
  Grid
} from '@mui/material';
import { 
  ArrowBack,
  DashboardCustomize,
  Description,
  AttachMoney,
  CalendarToday,
  PlaylistAddCheck
} from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import packageTemplateService from '../../../../services/packageTemplate.service';
import { useApp } from '../../../../contexts/AppContext';
import styles from './TemplateDetail.module.css';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const TemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  
  const [template, setTemplate] = useState(null);
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

        const templateData = await packageTemplateService.getTemplateById(id);
        setTemplate(templateData);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin mẫu gói';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, showGlobalError]);

  const handleBack = () => {
    navigate('/admin/packages');
  };

  if (loading) {
    return (
      <ContentLoading isLoading={true} text="Đang tải thông tin mẫu gói..." />
    );
  }

  if (error || !template) {
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
            {error || 'Không tìm thấy thông tin mẫu gói'}
          </Alert>
        </div>
      </div>
    );
  }

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
              Chi tiết Mẫu Gói
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Template Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Thông tin Mẫu Gói
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <DashboardCustomize sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                          Tên Mẫu Gói
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {template.name || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Description sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                          Mô Tả
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {template.desc || 'Không có mô tả'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Pricing Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <AttachMoney sx={{ fontSize: 24, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Khoảng Giá Đề Xuất
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      Giá Thấp Nhất
                    </Typography>
                    <Typography variant="h6" fontWeight="medium" color="success.main">
                      {formatCurrency(template.minPrice)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      Giá Mặc Định
                    </Typography>
                    <Typography variant="h6" fontWeight="medium" color="primary.main">
                      {formatCurrency(template.defaultPrice)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      Giá Cao Nhất
                    </Typography>
                    <Typography variant="h6" fontWeight="medium" color="error.main">
                      {formatCurrency(template.maxPrice)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Duration Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <CalendarToday sx={{ fontSize: 24, color: 'warning.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Thời Hạn (Tháng)
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      Thời Hạn Thấp Nhất
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {template.minDurationInMonths !== undefined && template.minDurationInMonths !== null 
                        ? `${template.minDurationInMonths} tháng` 
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      Thời Hạn Mặc Định
                    </Typography>
                    <Typography variant="h6" fontWeight="medium" color="primary.main">
                      {template.defaultDurationInMonths !== undefined && template.defaultDurationInMonths !== null 
                        ? `${template.defaultDurationInMonths} tháng` 
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      Thời Hạn Cao Nhất
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {template.maxDurationInMonths !== undefined && template.maxDurationInMonths !== null 
                        ? `${template.maxDurationInMonths} tháng` 
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Slots Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <PlaylistAddCheck sx={{ fontSize: 24, color: 'info.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Giới Hạn Slot
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Slot Thấp Nhất
                      </Typography>
                      <Typography variant="h6" fontWeight="medium">
                        {template.minSlots !== undefined && template.minSlots !== null 
                          ? `${template.minSlots} slot` 
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Slot Mặc Định
                      </Typography>
                      <Typography variant="h6" fontWeight="medium" color="primary.main">
                        {template.defaultTotalSlots !== undefined && template.defaultTotalSlots !== null 
                          ? `${template.defaultTotalSlots} slot` 
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Slot Cao Nhất
                      </Typography>
                      <Typography variant="h6" fontWeight="medium">
                        {template.maxSlots !== undefined && template.maxSlots !== null 
                          ? `${template.maxSlots} slot` 
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default TemplateDetail;
