import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Typography,
  Button,
  Divider,
  Paper,
  Card,
  CardContent,
  Chip,
  Grid
} from '@mui/material';
import { 
  ArrowBack,
  AccessTime,
  Description,
  Inventory as PackageIcon,
  School as StudentLevelIcon
} from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import slotTypeService from '../../../../services/slotType.service';
import { useApp } from '../../../../contexts/AppContext';
import styles from './SlotTypeDetail.module.css';

const SlotTypeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  
  const [slotType, setSlotType] = useState(null);
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

        const slotTypeData = await slotTypeService.getSlotTypeById(id);
        setSlotType(slotTypeData);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin loại ca';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, showGlobalError]);

  const handleBack = () => {
    navigate('/manager/slot-types');
  };

  if (loading) {
    return (
      <ContentLoading isLoading={true} text="Đang tải thông tin loại ca..." />
    );
  }

  if (error || !slotType) {
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
            {error || 'Không tìm thấy thông tin loại ca'}
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
              Chi tiết Loại Ca Giữ Trẻ
            </Typography>
          </Box>
        </Paper>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Thông tin Loại Ca
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Name */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <AccessTime sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Tên Loại Ca
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {slotType.name || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Description */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Description sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Mô Tả
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ whiteSpace: 'pre-wrap' }}>
                    {slotType.description || 'Chưa có mô tả'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Assigned Packages */}
        {slotType.assignedPackages && slotType.assignedPackages.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <PackageIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Các Gói Đã Gán ({slotType.assignedPackages.length})
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {slotType.assignedPackages.map((pkg, index) => (
                  <Grid item xs={12} md={6} key={pkg.id || index}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        borderRadius: 2,
                        '&:hover': {
                          boxShadow: 1,
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {pkg.name || 'N/A'}
                        </Typography>
                        
                        {pkg.desc && (
                          <Typography variant="body2" color="text.secondary">
                            {pkg.desc}
                          </Typography>
                        )}
                        
                        {pkg.studentLevel && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StudentLevelIcon fontSize="small" color="primary" />
                            <Chip 
                              label={pkg.studentLevel.name || 'N/A'} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SlotTypeDetail;
