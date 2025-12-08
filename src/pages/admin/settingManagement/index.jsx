import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ContentLoading from '../../../components/Common/ContentLoading';
import { getErrorMessage } from '../../../utils/errorHandler';
import styles from './SettingManagement.module.css';

const SettingManagement = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    // Slot Cancellation Deadline
    deadlineHours: '',
    slotCancellationDescription: '',
    
    // Package Refund Settings
    fullRefundDays: '',
    partialRefundMaxSlots: '',
    fullRefundMaxSlots: '',
    refundDescription: '',
    
    // Package Renewal Settings
    minSlotsPercentage: '',
    renewalDeadlineDays: '',
    renewalDescription: ''
  });
  const [originalSettings, setOriginalSettings] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // const slotCancellation = await axios.get('/api/Admin/slot-cancellation-deadline');
      // const refundSettings = await axios.get('/api/Admin/package-refund-settings');
      // const renewalSettings = await axios.get('/api/Admin/package-renewal-settings');
      
      // Mock data for now
      const mockSettings = {
        deadlineHours: 168,
        slotCancellationDescription: 'Học sinh chỉ có thể hủy slot trong 7 ngày trước khi slot bắt đầu',
        fullRefundDays: 365,
        partialRefundMaxSlots: 1000,
        fullRefundMaxSlots: 1000,
        refundDescription: 'Chính sách hoàn tiền gói',
        minSlotsPercentage: 100,
        renewalDeadlineDays: 365,
        renewalDescription: 'Hạn chót gia hạn gói là 365 ngày trước khi gói hết hạn'
      };
      setSettings(mockSettings);
      setOriginalSettings(mockSettings);
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể tải cài đặt';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!settings.deadlineHours || settings.deadlineHours <= 0) {
      newErrors.deadlineHours = 'Giá trị phải lớn hơn 0';
    }

    if (!settings.fullRefundDays || settings.fullRefundDays <= 0) {
      newErrors.fullRefundDays = 'Giá trị phải lớn hơn 0';
    }

    if (!settings.partialRefundMaxSlots || settings.partialRefundMaxSlots <= 0) {
      newErrors.partialRefundMaxSlots = 'Giá trị phải lớn hơn 0';
    }

    if (!settings.fullRefundMaxSlots || settings.fullRefundMaxSlots <= 0) {
      newErrors.fullRefundMaxSlots = 'Giá trị phải lớn hơn 0';
    }

    if (!settings.minSlotsPercentage || settings.minSlotsPercentage < 0 || settings.minSlotsPercentage > 100) {
      newErrors.minSlotsPercentage = 'Giá trị phải từ 0 đến 100';
    }

    if (!settings.renewalDeadlineDays || settings.renewalDeadlineDays <= 0) {
      newErrors.renewalDeadlineDays = 'Giá trị phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Replace with actual API calls
      // await axios.put('/api/Admin/slot-cancellation-deadline', { deadlineHours, description });
      // await axios.put('/api/Admin/package-refund-settings', { fullRefundDays, partialRefundMaxSlots, fullRefundMaxSlots, description });
      // await axios.put('/api/Admin/package-renewal-settings', { minSlotsPercentage, renewalDeadlineDays, description });
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOriginalSettings(settings);
      toast.success('Cập nhật cài đặt thành công');
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể cập nhật cài đặt';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setErrors({});
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return (
    <div className={styles.container}>
      {loading && <ContentLoading isLoading={loading} text="Đang tải cài đặt..." />}

      <ManagementPageHeader title="Quản lý Cài Đặt Hệ Thống" />

      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Section 1: Slot Cancellation Deadline */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'var(--color-primary)' }}>
              1. Thời Hạn Hủy Slot
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="Hạn chót hủy slot (giờ)"
                type="number"
                value={settings.deadlineHours}
                onChange={(e) => handleInputChange('deadlineHours', e.target.value)}
                error={!!errors.deadlineHours}
                helperText={errors.deadlineHours}
                disabled={submitting}
                inputProps={{ min: 1 }}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Mô tả"
              value={settings.slotCancellationDescription}
              onChange={(e) => handleInputChange('slotCancellationDescription', e.target.value)}
              disabled={submitting}
              sx={{ mb: 2 }}
            />
            <Divider sx={{ my: 3 }} />
          </Box>

          {/* Section 2: Package Refund Settings */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'var(--color-primary)' }}>
              2. Cài Đặt Hoàn Tiền Gói
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="Số ngày hoàn tiền toàn bộ"
                type="number"
                value={settings.fullRefundDays}
                onChange={(e) => handleInputChange('fullRefundDays', e.target.value)}
                error={!!errors.fullRefundDays}
                helperText={errors.fullRefundDays}
                disabled={submitting}
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Tối đa slot hoàn tiền một phần"
                type="number"
                value={settings.partialRefundMaxSlots}
                onChange={(e) => handleInputChange('partialRefundMaxSlots', e.target.value)}
                error={!!errors.partialRefundMaxSlots}
                helperText={errors.partialRefundMaxSlots}
                disabled={submitting}
                inputProps={{ min: 1 }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="Tối đa slot hoàn tiền toàn bộ"
                type="number"
                value={settings.fullRefundMaxSlots}
                onChange={(e) => handleInputChange('fullRefundMaxSlots', e.target.value)}
                error={!!errors.fullRefundMaxSlots}
                helperText={errors.fullRefundMaxSlots}
                disabled={submitting}
                inputProps={{ min: 1 }}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Mô tả"
              value={settings.refundDescription}
              onChange={(e) => handleInputChange('refundDescription', e.target.value)}
              disabled={submitting}
              sx={{ mb: 2 }}
            />
            <Divider sx={{ my: 3 }} />
          </Box>

          {/* Section 3: Package Renewal Settings */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'var(--color-primary)' }}>
              3. Cài Đặt Gia Hạn Gói
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="Phần trăm slot tối thiểu (%)"
                type="number"
                value={settings.minSlotsPercentage}
                onChange={(e) => handleInputChange('minSlotsPercentage', e.target.value)}
                error={!!errors.minSlotsPercentage}
                helperText={errors.minSlotsPercentage}
                disabled={submitting}
                inputProps={{ min: 0, max: 100 }}
              />
              <TextField
                label="Hạn gia hạn gói (ngày)"
                type="number"
                value={settings.renewalDeadlineDays}
                onChange={(e) => handleInputChange('renewalDeadlineDays', e.target.value)}
                error={!!errors.renewalDeadlineDays}
                helperText={errors.renewalDeadlineDays}
                disabled={submitting}
                inputProps={{ min: 1 }}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Mô tả"
              value={settings.renewalDescription}
              onChange={(e) => handleInputChange('renewalDescription', e.target.value)}
              disabled={submitting}
              sx={{ mb: 2 }}
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={!hasChanges || submitting}
            >
              Đặt Lại
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges || submitting}
              sx={{
                background: 'var(--color-secondary)',
                '&:hover': {
                  background: 'var(--color-secondary-dark)'
                }
              }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Lưu'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingManagement;
