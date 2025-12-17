import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Skeleton,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { EventAvailable as SlotIcon } from '@mui/icons-material';
import branchSlotService from '../../../../../../services/branchSlot.service';
import { parseDateFromUTC7 } from '../../../../../../utils/dateHelper';
import styles from '../Schedule.module.css';

const WEEKDAY_LABELS = {
  0: 'Chủ nhật',
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy'
};

const BulkStep3SelectSlot = forwardRef(({ data, updateData, stepIndex, totalSteps }, ref) => {
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(data?.slotId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!selectedSlotId) {
        return false;
      }
      const selectedSlot = slots.find(s => s.id === selectedSlotId);
      updateData({
        slotId: selectedSlotId,
        slot: selectedSlot
      });
      return true;
    }
  }));

  useEffect(() => {
    if (data?.studentId && data?.startDate && data?.weekDates && data.weekDates.length > 0) {
      loadAvailableSlots(data.studentId, data.startDate, data.endDate, data.weekDates);
    }
  }, [data?.studentId, data?.startDate, data?.endDate, data?.weekDates]);

  useEffect(() => {
    if (data?.slotId) {
      setSelectedSlotId(data.slotId);
    }
  }, [data?.slotId]);

  const loadAvailableSlots = async (studentId, startDate, endDate, weekDates) => {
    if (!studentId || !startDate || !endDate || !weekDates || weekDates.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items = await branchSlotService.getAllAvailableSlotsForStudent(studentId, {
        startDate: startDate,
        endDate: endDate,
        weekDate: weekDates.length === 1 ? weekDates[0] : null,
        pageSize: 100
      });

      if (items.length === 0) {
        setSlots([]);
        setError('Không tìm thấy slot nào phù hợp cho khoảng thời gian này');
        return;
      }

      let filteredItems = items;
      if (weekDates.length > 1) {
        filteredItems = items.filter(slot => weekDates.includes(slot.weekDate));
      }

      const slotMap = new Map();
      filteredItems.forEach(slot => {
        if (slot.status?.toLowerCase() !== 'available') return;

        const key = `${slot.branchId || 'unknown'}_${slot.timeframeId || 'unknown'}`;
        if (!slotMap.has(key)) {
          slotMap.set(key, {
            id: slot.id,
            branchName: slot.branch?.branchName || slot.branchName || 'Chi nhánh không tên',
            timeframeName: slot.timeframe?.name || slot.timeframeName || 'Khung giờ không tên',
            startTime: slot.timeframe?.startTime || slot.startTime || '--:--',
            endTime: slot.timeframe?.endTime || slot.endTime || '--:--',
            slotTypeName: slot.slotType?.name || slot.slotTypeName || '',
            slotTypeDescription: slot.slotType?.description || slot.slotTypeDescription || '',
            weekDaysAvailable: [slot.weekDate],
            branchId: slot.branchId,
            timeframeId: slot.timeframeId
          });
        } else {
          const existing = slotMap.get(key);
          if (!existing.weekDaysAvailable.includes(slot.weekDate)) {
            existing.weekDaysAvailable.push(slot.weekDate);
          }
        }
      });

      const uniqueSlots = Array.from(slotMap.values()).sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });

      setSlots(uniqueSlots);
    } catch (err) {
      console.error('Error loading available slots:', err);
      setError('Lỗi khi tải slots. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SlotIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Bước {stepIndex}/{totalSteps}: Chọn khung giờ
        </Typography>
      </Box>

      {isLoading && (
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={40} />
        </Paper>
      )}

      {!isLoading && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!isLoading && slots.length === 0 && !error && (
        <Alert severity="warning">
          Không tìm thấy slot nào phù hợp. Vui lòng thay đổi khoảng thời gian hoặc ngày trong tuần.
        </Alert>
      )}

      {!isLoading && slots.length > 0 && (
        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Chọn khung giờ mà bạn muốn đặt lịch cho tất cả các ngày đã chọn.
          </Alert>

          <RadioGroup
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
          >
            <Grid container spacing={2}>
              {slots.map((slot) => (
                <Grid item xs={12} key={slot.id}>
                  <FormControlLabel
                    value={slot.id}
                    control={<Radio />}
                    label={
                      <Card
                        sx={{
                          width: '100%',
                          backgroundColor: selectedSlotId === slot.id ? '#e3f2fd' : '#fff',
                          border: selectedSlotId === slot.id ? '2px solid' : '1px solid',
                          borderColor: selectedSlotId === slot.id ? '#1976d2' : '#e0e0e0',
                          flex: 1,
                          ml: 1
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {slot.branchName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                              ✓ Có sẵn
                            </Typography>
                          </Box>

                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Khung giờ:</strong> {slot.startTime} - {slot.endTime}
                          </Typography>

                          {slot.slotTypeName && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Loại:</strong> {slot.slotTypeName}
                              {slot.slotTypeDescription && ` - ${slot.slotTypeDescription}`}
                            </Typography>
                          )}

                          <Typography variant="caption" sx={{ color: 'primary.main' }}>
                            📅 {slot.weekDaysAvailable.length} ngày: {slot.weekDaysAvailable.map(d => WEEKDAY_LABELS[d]).join(', ')}
                          </Typography>
                        </CardContent>
                      </Card>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </Paper>
      )}
    </Box>
  );
});

BulkStep3SelectSlot.displayName = 'BulkStep3SelectSlot';

export default BulkStep3SelectSlot;
