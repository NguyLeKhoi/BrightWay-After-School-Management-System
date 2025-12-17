import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Autocomplete,
  Paper,
  IconButton,
  Divider
} from '@mui/material';
import { AccessTime as BranchSlotIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import branchSlotService from '../../../services/branchSlot.service';

const WEEK_DAYS = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'Chủ nhật' }
];

const BulkCreateBranchSlotDialog = ({
  open,
  onClose,
  onSuccess,
  timeframeOptions = [],
  slotTypeOptions = [],
  roomOptions = [],
  staffOptions = [],
  loading: externalLoading = false
}) => {
  const [formData, setFormData] = useState({
    timeframeId: '',
    slotTypeId: '',
    startDate: '',
    endDate: '',
    selectedWeekDays: [],
    status: 'Available',
    roomAssignments: [] // { roomId, staffIds: [] }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleWeekDayToggle = useCallback((weekDay) => {
    setFormData(prev => {
      const isSelected = prev.selectedWeekDays.includes(weekDay);
      return {
        ...prev,
        selectedWeekDays: isSelected
          ? prev.selectedWeekDays.filter(d => d !== weekDay)
          : [...prev.selectedWeekDays, weekDay]
      };
    });
    setErrors(prev => ({ ...prev, selectedWeekDays: '' }));
  }, []);

  const handleAddRoomAssignment = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      roomAssignments: [...prev.roomAssignments, { roomId: '', staffIds: [] }]
    }));
  }, []);

  const handleRemoveRoomAssignment = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      roomAssignments: prev.roomAssignments.filter((_, i) => i !== index)
    }));
  }, []);

  const handleRoomAssignmentChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newAssignments = [...prev.roomAssignments];
      newAssignments[index] = { ...newAssignments[index], [field]: value };
      return { ...prev, roomAssignments: newAssignments };
    });
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.timeframeId) {
      newErrors.timeframeId = 'Vui lòng chọn khung giờ';
    }
    if (!formData.slotTypeId) {
      newErrors.slotTypeId = 'Vui lòng chọn loại ca';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (formData.selectedWeekDays.length === 0) {
      newErrors.selectedWeekDays = 'Vui lòng chọn ít nhất một ngày trong tuần';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const generateDates = useCallback(() => {
    const dates = [];
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    // Loop through each day in the range
    const current = new Date(start);
    while (current <= end) {
      const weekDay = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check if this weekday is selected
      if (formData.selectedWeekDays.includes(weekDay)) {
        dates.push(new Date(current));
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [formData]);

  const estimatedSlots = useMemo(() => {
    if (!formData.startDate || !formData.endDate || formData.selectedWeekDays.length === 0) {
      return 0;
    }
    try {
      return generateDates().length;
    } catch {
      return 0;
    }
  }, [formData.startDate, formData.endDate, formData.selectedWeekDays, generateDates]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const dates = generateDates();
      
      if (dates.length === 0) {
        toast.error('Không có ngày nào phù hợp với lựa chọn của bạn');
        return;
      }

      const formatLocalDateToUTC7Noon = (dateValue) => {
        if (!dateValue) return null;
        let dateObj;
        if (dateValue instanceof Date) {
          dateObj = dateValue;
        } else if (typeof dateValue === 'string') {
          const dateStr = dateValue.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          dateObj = new Date(year, month - 1, day);
        } else {
          dateObj = new Date(dateValue);
        }
        if (isNaN(dateObj.getTime())) return null;
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T12:00:00.000+07:00`;
      };

      const weekDates = (formData.selectedWeekDays || []).map((d) => Number(d));
      const startDate = formatLocalDateToUTC7Noon(formData.startDate);
      const endDate = formatLocalDateToUTC7Noon(formData.endDate);

      // Call bulk create API
      await branchSlotService.bulkCreateBranchSlots({
        dto: {
          branchId: formData.branchId || null,
          timeframeId: formData.timeframeId,
          slotTypeId: formData.slotTypeId,
          startDate,
          endDate,
          status: formData.status || 'Available',
          roomAssignments: formData.roomAssignments.filter(ra => ra.roomId)
        },
        weekDates
      });

      toast.success(`Đã tạo thành công ${dates.length} ca giữ trẻ!`, {
        position: 'top-right',
        autoClose: 3000
      });

      // Reset form
      setFormData({
        timeframeId: '',
        slotTypeId: '',
        startDate: '',
        endDate: '',
        selectedWeekDays: [],
        status: 'Available',
        roomAssignments: []
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
        error?.message || 
        'Có lỗi xảy ra khi tạo ca giữ trẻ hàng loạt';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, generateDates, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setFormData({
        timeframeId: '',
        slotTypeId: '',
        startDate: '',
        endDate: '',
        selectedWeekDays: [],
        status: 'Available',
        roomAssignments: []
      });
      setErrors({});
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          <BranchSlotIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Tạo Ca Giữ Trẻ Hàng Loạt
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Tạo nhiều ca giữ trẻ cùng lúc cho các ngày trong tuần đã chọn
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Timeframe Selection */}
          <FormControl fullWidth error={!!errors.timeframeId} disabled={externalLoading || loading}>
            <InputLabel>Khung giờ *</InputLabel>
            <Select
              value={formData.timeframeId}
              onChange={(e) => handleChange('timeframeId', e.target.value)}
              label="Khung giờ *"
            >
              {timeframeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.timeframeId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.timeframeId}
              </Typography>
            )}
          </FormControl>

          {/* Slot Type Selection */}
          <FormControl fullWidth error={!!errors.slotTypeId} disabled={externalLoading || loading}>
            <InputLabel>Loại ca *</InputLabel>
            <Select
              value={formData.slotTypeId}
              onChange={(e) => handleChange('slotTypeId', e.target.value)}
              label="Loại ca *"
            >
              {slotTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.slotTypeId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.slotTypeId}
              </Typography>
            )}
          </FormControl>

          <Divider />

          {/* Date Range */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Khoảng thời gian
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
              <TextField
                type="date"
                label="Ngày bắt đầu *"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
                helperText={errors.startDate}
                fullWidth
                disabled={externalLoading || loading}
              />
              <TextField
                type="date"
                label="Ngày kết thúc *"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.endDate}
                helperText={errors.endDate}
                fullWidth
                disabled={externalLoading || loading}
              />
            </Box>
          </Box>

          {/* Week Days Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Chọn các ngày trong tuần *
            </Typography>
            <FormGroup sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {WEEK_DAYS.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={formData.selectedWeekDays.includes(day.value)}
                        onChange={() => handleWeekDayToggle(day.value)}
                        disabled={externalLoading || loading}
                      />
                    }
                    label={day.label}
                  />
                ))}
              </Box>
            </FormGroup>
            {errors.selectedWeekDays && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.selectedWeekDays}
              </Typography>
            )}
          </Box>

          {/* Status Selection */}
          <FormControl fullWidth disabled={externalLoading || loading}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              label="Trạng thái"
            >
              <MenuItem value="Available">Có sẵn</MenuItem>
              <MenuItem value="Full">Đầy</MenuItem>
              <MenuItem value="Cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>

          {/* Room and Staff Assignments */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" fontWeight={600}>
                Gán Phòng & Nhân Viên (Tùy chọn)
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddRoomAssignment}
                disabled={externalLoading || loading}
              >
                Thêm Phòng
              </Button>
            </Box>
            
            {formData.roomAssignments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Chưa gán phòng nào. Click "Thêm Phòng" để bắt đầu.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {formData.roomAssignments.map((assignment, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Autocomplete
                          fullWidth
                          options={roomOptions}
                          value={roomOptions.find(r => r.value === assignment.roomId) || null}
                          onChange={(e, newValue) => handleRoomAssignmentChange(index, 'roomId', newValue?.value || '')}
                          getOptionLabel={(option) => option.label}
                          disabled={externalLoading || loading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Phòng *"
                              placeholder="Chọn phòng"
                            />
                          )}
                        />
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveRoomAssignment(index)}
                          disabled={externalLoading || loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      <Autocomplete
                        multiple
                        fullWidth
                        options={staffOptions}
                        value={staffOptions.filter(s => assignment.staffIds.includes(s.value))}
                        onChange={(e, newValue) => handleRoomAssignmentChange(index, 'staffIds', newValue.map(v => v.value))}
                        getOptionLabel={(option) => option.label}
                        disabled={externalLoading || loading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Nhân viên"
                            placeholder="Chọn nhân viên"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={option.label}
                              size="small"
                              {...getTagProps({ index })}
                            />
                          ))
                        }
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>

          {/* Preview */}
          {estimatedSlots > 0 && (
            <Alert severity="info" icon={<AddIcon />}>
              <Typography variant="body2">
                Sẽ tạo <strong>{estimatedSlots}</strong> ca giữ trẻ dựa trên lựa chọn của bạn
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || externalLoading || estimatedSlots === 0}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {loading ? 'Đang tạo...' : `Tạo ${estimatedSlots} ca`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkCreateBranchSlotDialog;
