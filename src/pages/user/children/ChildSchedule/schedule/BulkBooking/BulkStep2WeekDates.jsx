import React, { useState, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import styles from '../Schedule.module.css';

const WEEKDAYS = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ hai' },
  { value: 2, label: 'Thứ ba' },
  { value: 3, label: 'Thứ tư' },
  { value: 4, label: 'Thứ năm' },
  { value: 5, label: 'Thứ sáu' },
  { value: 6, label: 'Thứ bảy' }
];

// Unified selected color for weekday cards (use theme token)
const WEEKDAY_SELECTED_BG = 'var(--color-primary)';
const WEEKDAY_SELECTED_BORDER = 'var(--color-primary-dark)';
const WEEKDAY_SELECTED_TEXT = 'var(--text-inverse)';

const getAvailableWeekDays = (startDate, endDate) => {
  if (!startDate || !endDate) return new Set();
  
  // Parse dates properly to avoid timezone issues
  const getLocalDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string') {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }
    return null;
  };

  const start = getLocalDate(startDate);
  const end = getLocalDate(endDate);
  
  if (!start || !end || end < start) return new Set();
  
  const availableWeekDays = new Set();
  const cursor = new Date(start);
  
  while (cursor <= end) {
    availableWeekDays.add(cursor.getDay());
    cursor.setDate(cursor.getDate() + 1);
  }
  
  return availableWeekDays;
};

const BulkStep2WeekDates = forwardRef(({ data, updateData, stepIndex, totalSteps }, ref) => {
  const [weekDates, setWeekDates] = useState(data?.weekDates || []);
  const [error, setError] = useState('');

  const availableWeekDays = useMemo(() => {
    return getAvailableWeekDays(data?.startDate, data?.endDate);
  }, [data?.startDate, data?.endDate]);

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
    // Prevent unchecking if weekday not available in range
    if (!availableWeekDays.has(value)) {
      return;
    }

    setWeekDates((prev) => {
      if (prev.includes(value)) {
        return prev.filter((d) => d !== value);
      } else {
        return [...prev, value];
      }
    });
    setError('');
  };

  const isWeekdayDisabled = (weekdayValue) => {
    return availableWeekDays.size > 0 && !availableWeekDays.has(weekdayValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScheduleIcon sx={{ color: 'var(--color-primary)' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Bước {stepIndex}/{totalSteps}: Chọn ngày trong tuần
        </Typography>
      </Box>

      <Paper sx={{ p: 3, backgroundColor: 'var(--bg-primary)', mb: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Chọn những ngày trong tuần mà bạn muốn đặt lịch. Ví dụ: nếu chọn Thứ hai và Thứ tư, hệ thống sẽ tạo slot cho tất cả các Thứ hai và Thứ tư trong khoảng ngày đã chọn.
        </Alert>

        <Grid container spacing={2}>
          {WEEKDAYS.map((day) => {
            const isDisabled = isWeekdayDisabled(day.value);
            const tooltipText = isDisabled ? `${day.label} không nằm trong khoảng ngày đã chọn` : '';

            return (
              <Grid item xs={12} sm={6} md={4} key={day.value}>
                <Tooltip title={tooltipText} arrow>
                  <div>
                    <Card
                      sx={{
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: weekDates.includes(day.value) ? WEEKDAY_SELECTED_BG : 'var(--bg-primary)',
                        border: weekDates.includes(day.value) ? '3px solid' : '2px solid',
                        borderColor: weekDates.includes(day.value) ? WEEKDAY_SELECTED_BORDER : isDisabled ? 'var(--border-medium)' : 'var(--border-light)',
                        opacity: isDisabled ? 0.5 : 1,
                        '&:hover': !isDisabled ? {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        } : {}
                      }}
                      onClick={() => !isDisabled && handleToggleWeekday(day.value)}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:last-child': { pb: 2 } }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={weekDates.includes(day.value)}
                              onChange={() => !isDisabled && handleToggleWeekday(day.value)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isDisabled}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: weekDates.includes(day.value) ? WEEKDAY_SELECTED_TEXT : isDisabled ? 'var(--text-tertiary)' : 'inherit'
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
                  </div>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>

        {weekDates.length > 0 && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'var(--color-primary-50)', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: 'var(--color-primary)', fontWeight: 600 }}>
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
