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
import adminService from '../../../services/admin.service';
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
    ,
    // Package Upgrade Settings (fields match API)
    upgradeSlotValueDeadlineDays: '',
    upgradeDescription: ''
  });
  const [originalSettings, setOriginalSettings] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Try to fetch real settings from API via adminService
      const [slotRes, refundRes, renewalRes, upgradeRes] = await Promise.allSettled([
        adminService.getSlotCancellation(),
        adminService.getPackageRefundSettings(),
        adminService.getPackageRenewalSettings(),
        adminService.getPackageUpgradeSettings()
      ]);

      const slotData = slotRes.status === 'fulfilled' ? slotRes.value : null;
      const refundData = refundRes.status === 'fulfilled' ? refundRes.value : null;
      const renewalData = renewalRes.status === 'fulfilled' ? renewalRes.value : null;
      const upgradeData = upgradeRes.status === 'fulfilled' ? upgradeRes.value : null;

      const loaded = {
        deadlineHours: slotData?.deadlineHours ?? settings.deadlineHours,
        slotCancellationDescription: slotData?.description ?? settings.slotCancellationDescription,

        fullRefundDays: refundData?.fullRefundDays ?? settings.fullRefundDays,
        partialRefundMaxSlots: refundData?.partialRefundMaxSlots ?? settings.partialRefundMaxSlots,
        fullRefundMaxSlots: refundData?.fullRefundMaxSlots ?? settings.fullRefundMaxSlots,
        refundDescription: refundData?.description ?? settings.refundDescription,

        minSlotsPercentage: renewalData?.minSlotsPercentage ?? settings.minSlotsPercentage,
        renewalDeadlineDays: renewalData?.renewalDeadlineDays ?? settings.renewalDeadlineDays,
        renewalDescription: renewalData?.description ?? settings.renewalDescription
        ,
        // API returns `upgradeSlotValueDeadlineDays` (days) and `description`
        upgradeSlotValueDeadlineDays: upgradeData?.upgradeSlotValueDeadlineDays ?? settings.upgradeSlotValueDeadlineDays,
        upgradeDescription: upgradeData?.description ?? settings.upgradeDescription
      };

      setSettings(loaded);
      setOriginalSettings(loaded);
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

    // `fullRefundMaxSlots` can be 0 (meaning allow zero max slots for full refund)
    if (settings.fullRefundMaxSlots === '' || Number(settings.fullRefundMaxSlots) < 0) {
      newErrors.fullRefundMaxSlots = 'Giá trị phải lớn hơn hoặc bằng 0';
    }

    if (!settings.minSlotsPercentage || settings.minSlotsPercentage < 0 || settings.minSlotsPercentage > 100) {
      newErrors.minSlotsPercentage = 'Giá trị phải từ 0 đến 100';
    }

    if (!settings.renewalDeadlineDays || settings.renewalDeadlineDays <= 0) {
      newErrors.renewalDeadlineDays = 'Giá trị phải lớn hơn 0';
    }

    if (settings.upgradeSlotValueDeadlineDays !== '' && Number(settings.upgradeSlotValueDeadlineDays) < 0) {
      newErrors.upgradeSlotValueDeadlineDays = 'Giá trị phải lớn hơn hoặc bằng 0';
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
      // Prepare payloads (ensure numbers)
      const slotPayload = {
        deadlineHours: Number(settings.deadlineHours),
        description: settings.slotCancellationDescription || ''
      };

      const refundPayload = {
        fullRefundDays: Number(settings.fullRefundDays),
        partialRefundMaxSlots: Number(settings.partialRefundMaxSlots),
        fullRefundMaxSlots: Number(settings.fullRefundMaxSlots),
        description: settings.refundDescription || ''
      };

      const renewalPayload = {
        minSlotsPercentage: Number(settings.minSlotsPercentage),
        renewalDeadlineDays: Number(settings.renewalDeadlineDays),
        description: settings.renewalDescription || ''
      };

      const upgradePayload = {
        upgradeSlotValueDeadlineDays: Number(settings.upgradeSlotValueDeadlineDays || 0),
        description: settings.upgradeDescription || ''
      };

      // Send requests in parallel via adminService
      await Promise.all([
        adminService.updateSlotCancellation(slotPayload),
        adminService.updatePackageRefundSettings(refundPayload),
        adminService.updatePackageRenewalSettings(renewalPayload),
        adminService.updatePackageUpgradeSettings(upgradePayload)
      ]);

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
                label="Số ngày hoàn tiền"
                type="number"
                value={settings.fullRefundDays}
                onChange={(e) => handleInputChange('fullRefundDays', e.target.value)}
                error={!!errors.fullRefundDays}
                helperText={errors.fullRefundDays}
                disabled={submitting}
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Tối đa slot hoàn tiền 50%"
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
                label="Tối đa slot hoàn tiền 100%"
                type="number"
                value={settings.fullRefundMaxSlots}
                onChange={(e) => handleInputChange('fullRefundMaxSlots', e.target.value)}
                error={!!errors.fullRefundMaxSlots}
                helperText={errors.fullRefundMaxSlots}
                disabled={submitting}
                inputProps={{ min: 0 }}
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
            <Divider sx={{ my: 3 }} />

            {/* Section 4: Package Upgrade Settings */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'var(--color-primary)' }}>
                4. Cài Đặt Nâng Cấp Gói
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <TextField
                  label="Số ngày trước khi hết hạn để cho phép nâng cấp (ngày)"
                  type="number"
                  value={settings.upgradeSlotValueDeadlineDays}
                  onChange={(e) => handleInputChange('upgradeSlotValueDeadlineDays', e.target.value)}
                  error={!!errors.upgradeSlotValueDeadlineDays}
                  helperText={errors.upgradeSlotValueDeadlineDays}
                  disabled={submitting}
                  inputProps={{ min: 0 }}
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Mô tả"
                value={settings.upgradeDescription}
                onChange={(e) => handleInputChange('upgradeDescription', e.target.value)}
                disabled={submitting}
                sx={{ mb: 2 }}
              />
            </Box>
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
