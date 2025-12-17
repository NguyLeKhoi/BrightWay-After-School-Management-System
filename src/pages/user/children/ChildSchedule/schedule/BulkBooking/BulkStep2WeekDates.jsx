import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import styles from '../Schedule.module.css';

const WEEKDAYS = [
  { value: 0, label: 'Chủ nhật', color: '#ff6b6b' },
  { value: 1, label: 'Thứ hai', color: '#4ecdc4' },
  { value: 2, label: 'Thứ ba', color: '#45b7d1' },
  { value: 3, label: 'Thứ tư', color: '#96ceb4' },
  { value: 4, label: 'Thứ năm', color: '#ffeaa7' },
  { value: 5, label: 'Thứ sáu', color: '#dfe6e9' },
  { value: 6, label: 'Thứ bảy', color: '#a29bfe' }
];

const BulkStep2WeekDates = forwardRef(({ data, updateData, stepIndex, totalSteps }, ref) => {
  const [weekDates, setWeekDates] = useState(data?.weekDates || []);
  const [error, setError] = useState('');

  useImperativeHandle(ref, () => ({
    submit: async () => {
      setError('');

      if (weekDates.length === 0) {
        setError('Vui lòng chọn ít nhất một ngày trong tuần');
        return false;
      }

      // Validate that selected weekdays actually occur within the selected date range
      if (data?.startDate && data?.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (end < start) {
          setError('Ngày kết thúc phải sau ngày bắt đầu');
          return false;
        }

        let hasMatch = false;
        const cursor = new Date(start);
        const safetyLimit = 400; // hard cap to avoid long loops
        let steps = 0;
        while (cursor <= end && steps <= safetyLimit) {
          if (weekDates.includes(cursor.getDay())) {
            hasMatch = true;
            break;
          }
          cursor.setDate(cursor.getDate() + 1);
          steps += 1;
        }

        if (!hasMatch) {
          setError('Ngày trong tuần đã chọn không nằm trong khoảng ngày đã chọn');
          return false;
        }
      }

      updateData({
        weekDates: weekDates.sort((a, b) => a - b)
      });

      return true;
    }
  }));

  useEffect(() => {
    if (data?.weekDates && data.weekDates.length > 0) {
      setWeekDates(data.weekDates);
    }
  }, [data?.weekDates]);

  const handleToggleWeekday = (value) => {
    setWeekDates((prev) => {
      if (prev.includes(value)) {
        return prev.filter((d) => d !== value);
      } else {
        return [...prev, value];
      }
    });
    setError('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScheduleIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Bước {stepIndex}/{totalSteps}: Chọn ngày trong tuần
        </Typography>
      </Box>

      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5', mb: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Chọn những ngày trong tuần mà bạn muốn đặt lịch. Ví dụ: nếu chọn Thứ hai và Thứ tư, hệ thống sẽ tạo slot cho tất cả các Thứ hai và Thứ tư trong khoảng ngày đã chọn.
        </Alert>

        <Grid container spacing={2}>
          {WEEKDAYS.map((day) => (
            <Grid item xs={12} sm={6} md={4} key={day.value}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: weekDates.includes(day.value) ? day.color : '#fff',
                  border: weekDates.includes(day.value) ? '3px solid' : '2px solid',
                  borderColor: weekDates.includes(day.value) ? day.color : '#e0e0e0',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => handleToggleWeekday(day.value)}
              >
                <CardContent sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:last-child': { pb: 2 } }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={weekDates.includes(day.value)}
                        onChange={() => handleToggleWeekday(day.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: weekDates.includes(day.value) ? '#fff' : 'inherit'
                          }}
                        >
                          {day.label}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {weekDates.length > 0 && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              ✓ Đã chọn {weekDates.length} ngày: {weekDates.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(', ')}
            </Typography>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
});

BulkStep2WeekDates.displayName = 'BulkStep2WeekDates';

export default BulkStep2WeekDates;
