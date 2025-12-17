import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  Button
} from '@mui/material';
import { CheckCircle as ConfirmIcon } from '@mui/icons-material';

const WEEKDAY_LABELS = {
  0: 'Chủ nhật',
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy'
};

const BulkStep4Confirm = forwardRef(({ data, updateData, stepIndex, totalSteps }, ref) => {
  const [parentNote, setParentNote] = useState(data?.parentNote || '');
  const [estimatedSlots, setEstimatedSlots] = useState(0);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      updateData({
        parentNote: parentNote
      });
      return true;
    }
  }));

  useEffect(() => {
    if (data?.startDate && data?.endDate && data?.weekDates) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      let count = 0;
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        if (data.weekDates.includes(currentDate.getDay())) {
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setEstimatedSlots(count);
    }
  }, [data?.startDate, data?.endDate, data?.weekDates]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ConfirmIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Bước {stepIndex}/{totalSteps}: Xác nhận đặt lịch
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Kiểm tra lại thông tin trước khi xác nhận. Hệ thống sẽ tạo tất cả các slot theo khoảng thời gian đã chọn.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Khoảng thời gian
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {data?.startDate} → {data?.endDate}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card sx={{ backgroundColor: '#f3e5f5' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ngày trong tuần đã chọn
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {data?.weekDates?.map(d => WEEKDAY_LABELS[d]).join(', ') || 'Chưa chọn'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card sx={{ backgroundColor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Khung giờ
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {data?.slot?.startTime} - {data?.slot?.endTime}
              </Typography>
              <Typography variant="caption">
                {data?.slot?.branchName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card sx={{ backgroundColor: '#fff3e0' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Số slot ước tính
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {estimatedSlots} slots
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Ghi chú cho tất cả các slots (tùy chọn)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Nhập ghi chú... (tối đa 1000 ký tự)"
          value={parentNote}
          onChange={(e) => {
            const value = e.target.value.substring(0, 1000);
            setParentNote(value);
          }}
          helperText={`${parentNote.length}/1000 ký tự`}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#fff'
            }
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
          Ghi chú này sẽ được thêm vào tất cả {estimatedSlots} slots được tạo
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          ✓ Thông tin xác nhận:
        </Typography>
        <Box sx={{ ml: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Tên con: <strong>{data?.studentName || 'Chưa chọn'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Loại slot: <strong>{data?.slot?.slotTypeName || 'Chưa chọn'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Gói đã sử dụng: <strong>{data?.subscriptionName || 'Tự động tải'}</strong>
          </Typography>
          <Typography variant="body2">
            • Phòng: <strong>{data?.roomId ? 'Đã chọn' : 'Tự động phân bổ'}</strong>
          </Typography>
        </Box>
      </Box>

      <Alert severity="warning" sx={{ mt: 3 }}>
        ⚠️ Sau khi xác nhận, tất cả {estimatedSlots} slots sẽ được tạo. Bạn có thể hủy từng slot riêng lẻ sau đó nếu cần.
      </Alert>
    </Box>
  );
});

BulkStep4Confirm.displayName = 'BulkStep4Confirm';

export default BulkStep4Confirm;
