import React, { useState, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  CheckCircle,
  EventAvailable
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import branchSlotService from '../../../../../../services/branchSlot.service';
import { parseDateFromUTC7, extractDateString } from '../../../../../../utils/dateHelper';
import styles from '../Schedule.module.css';

const viLocale = {
  code: 'vi',
  week: { dow: 1, doy: 4 },
  buttonText: {
    prev: '←',
    next: '→',
    today: 'Hôm nay',
    month: 'Tháng',
    week: 'Tuần',
    day: 'Ngày',
    list: 'Danh sách'
  },
  allDayText: 'Cả ngày',
  moreLinkText: 'thêm',
  noEventsText: 'Không có sự kiện',
  weekText: 'Tuần'
};

const normalizeDate = (value) => {
  if (!value) return null;
  
  // Handle string input (YYYY-MM-DD format from date input)
  if (typeof value === 'string') {
    const parts = value.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day, 0, 0, 0, 0);
      return date;
    }
  }
  
  // Handle Date object input
  if (value instanceof Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  return null;
};

const formatInputDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const BulkStep1DateRange = forwardRef(({ data, updateData, stepIndex, totalSteps }, ref) => {
  const [startDate, setStartDate] = useState(() => normalizeDate(data?.startDate));
  const [endDate, setEndDate] = useState(() => normalizeDate(data?.endDate));
  const [error, setError] = useState('');
  const [minDate, setMinDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [maxDate, setMaxDate] = useState(() => {
    const limit = new Date();
    limit.setHours(0, 0, 0, 0);
    limit.setFullYear(limit.getFullYear() + 1);
    return limit;
  });
  const [calendarKey, setCalendarKey] = useState(0);
  const calendarRef = React.useRef(null);
  const isUserSelectingRef = React.useRef(false);
  const inputTimeoutRef = React.useRef(null);

  const [datesWithSlots, setDatesWithSlots] = useState(new Map());
  const [checkedDates, setCheckedDates] = useState(new Set());
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const normalizedStart = useMemo(() => normalizeDate(startDate), [startDate]);
  const normalizedEnd = useMemo(() => normalizeDate(endDate), [endDate]);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      setError('');

      if (!normalizedStart || !normalizedEnd) {
        setError('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (normalizedStart < today) {
        setError('Ngày bắt đầu không được trước hôm nay');
        return false;
      }

      if (normalizedEnd < normalizedStart) {
        setError('Ngày kết thúc phải sau ngày bắt đầu');
        return false;
      }

      const diffDays = (normalizedEnd - normalizedStart) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        setError('Khoảng cách giữa hai ngày không được vượt quá 12 tháng');
        return false;
      }

      const todayPlusOneYear = new Date(minDate);
      todayPlusOneYear.setFullYear(todayPlusOneYear.getFullYear() + 1);
      if (normalizedEnd > todayPlusOneYear) {
        setError('Ngày kết thúc không được vượt quá 12 tháng kể từ hôm nay');
        return false;
      }

      updateData({
        startDate: formatInputDate(normalizedStart),
        endDate: formatInputDate(normalizedEnd)
      });

      return true;
    }
  }));

  useEffect(() => {
    // Only sync from props when not user selecting and data exists
    if (!isUserSelectingRef.current) {
      if (data?.startDate) {
        const dateObj = normalizeDate(data.startDate);
        if (dateObj && (!normalizedStart || dateObj.getTime() !== normalizedStart.getTime())) {
          setStartDate(dateObj);
          setCalendarKey((prev) => prev + 1);
          try {
            const api = calendarRef.current?.getApi?.();
            if (api) api.gotoDate(dateObj);
          } catch (err) {
            // ignore
          }
        }
      }
      if (data?.endDate) {
        const dateObj = normalizeDate(data.endDate);
        if (dateObj && (!normalizedEnd || dateObj.getTime() !== normalizedEnd.getTime())) {
          setEndDate(dateObj);
        }
      }
    }
  }, [data?.startDate, data?.endDate, normalizedStart, normalizedEnd]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setMinDate(today);

    const limit = new Date(today);
    limit.setFullYear(limit.getFullYear() + 1);
    setMaxDate(limit);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAvailableDates = async () => {
      if (!data?.studentId) return;

      setIsLoadingSlots(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const datesWithSlotsMap = new Map();
        const checkedDatesSet = new Set();
        const monthsToLoad = 2;
        const allDatesByMonth = [];

        for (let monthOffset = 0; monthOffset < monthsToLoad; monthOffset++) {
          const monthStart = new Date(today);
          monthStart.setMonth(monthStart.getMonth() + monthOffset);
          monthStart.setDate(1);

          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);

          const monthDates = [];
          for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            if (d >= today) {
              monthDates.push(new Date(d));
            }
          }
          allDatesByMonth.push(monthDates);
        }

        const loadMonth = async (monthDates, isCurrentMonth = false) => {
          if (!isMounted) return;

          const batchSize = 7;
          for (let i = 0; i < monthDates.length; i += batchSize) {
            if (!isMounted) return;
            const batch = monthDates.slice(i, i + batchSize);

            const results = await Promise.all(
              batch.map(async (d) => {
                try {
                  const checkDateStr = extractDateString(d);
                  if (!checkDateStr) return null;

                  const items = await branchSlotService.getAllAvailableSlotsForStudent(data.studentId, {
                    date: d,
                    pageSize: 100
                  });

                  const validSlots = items.filter((slot) => {
                    if (!slot.date) {
                      const slotWeekDay = slot.weekDate !== undefined ? slot.weekDate : null;
                      if (slotWeekDay !== null) {
                        return d.getDay() === slotWeekDay;
                      }
                      return true;
                    }

                    const slotDate = parseDateFromUTC7(slot.date);
                    if (!slotDate) return false;

                    const slotDateOnly = new Date(
                      slotDate.getFullYear(),
                      slotDate.getMonth(),
                      slotDate.getDate()
                    );
                    const checkDateOnly = new Date(
                      d.getFullYear(),
                      d.getMonth(),
                      d.getDate()
                    );

                    return slotDateOnly.getTime() === checkDateOnly.getTime();
                  });

                  return {
                    dateStr: checkDateStr,
                    slotCount: validSlots.length
                  };
                } catch (err) {

                  return null;
                }
              })
            );

            results.forEach((result) => {
              if (!result) return;
              checkedDatesSet.add(result.dateStr);
              datesWithSlotsMap.set(result.dateStr, result.slotCount);
            });

            if (isCurrentMonth && isMounted) {
              setDatesWithSlots(new Map(datesWithSlotsMap));
              setCheckedDates(new Set(checkedDatesSet));
            }
          }
        };

        await loadMonth(allDatesByMonth[0], true);

        if (allDatesByMonth.length > 1 && isMounted) {
          loadMonth(allDatesByMonth[1], false).then(() => {
            if (isMounted) {
              setDatesWithSlots(new Map(datesWithSlotsMap));
              setCheckedDates(new Set(checkedDatesSet));
            }
          });
        } else if (isMounted) {
          setDatesWithSlots(datesWithSlotsMap);
          setCheckedDates(new Set(checkedDatesSet));
        }
      } catch (err) {

      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadAvailableDates();

    return () => {
      isMounted = false;
    };
  }, [data?.studentId]);

  const setRange = (newStart, newEnd = null) => {
    // Clear any pending sync when programmatically setting range
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    isUserSelectingRef.current = true;

    const normalizedNewStart = normalizeDate(newStart);
    const normalizedNewEnd = normalizeDate(newEnd);

    setStartDate(normalizedNewStart);
    setEndDate(normalizedNewEnd);
    updateData({
      startDate: formatInputDate(normalizedNewStart),
      endDate: formatInputDate(normalizedNewEnd)
    });
    setError('');

    // Allow props sync after a delay
    inputTimeoutRef.current = setTimeout(() => {
      isUserSelectingRef.current = false;
    }, 500);
  };

  const dayCellClassNames = React.useCallback(
    (info) => {
      const classes = [];
      const cellDate = new Date(info.date);
      cellDate.setHours(0, 0, 0, 0);

      const isPast = cellDate < minDate;
      const isAfterMax = cellDate > maxDate;
      if (isPast || isAfterMax) {
        classes.push(styles.disabledDate);
      }

      const dateStr = extractDateString(cellDate);
      const slotCount = dateStr ? datesWithSlots.get(dateStr) : undefined;
      const hasSlots = slotCount !== undefined && slotCount > 0;
      const isChecked = dateStr ? checkedDates.has(dateStr) : false;
      const hasNoSlots = isChecked && slotCount !== undefined && slotCount === 0;

      if (hasSlots && !isPast && !isAfterMax) {
        classes.push(styles.dateWithSlots);
      } else if (hasNoSlots && !isPast && !isAfterMax) {
        classes.push(styles.dateWithoutSlots);
      } else if (!isChecked && !isPast && !isAfterMax && checkedDates.size > 0) {
        classes.push(styles.dateLoading);
      }

      return classes.join(' ');
    },
    [checkedDates, datesWithSlots, minDate]
  );

  const handleDateClick = (info) => {
    // Fix timezone issue: Create date from local date components to avoid timezone shift
    const year = info.date.getFullYear();
    const month = info.date.getMonth();
    const day = info.date.getDate();
    // Create date at noon local time to avoid DST issues
    const clickedDate = new Date(year, month, day, 12, 0, 0, 0);

    if (clickedDate < minDate || clickedDate > maxDate) {
      return;
    }

    const dateStr = extractDateString(clickedDate);
    if (checkedDates.size > 0) {
      const isChecked = dateStr ? checkedDates.has(dateStr) : false;
      const slotCount = dateStr ? datesWithSlots.get(dateStr) : undefined;

      // Only block when we definitively know there are zero slots on that date
      if (isChecked && (slotCount === undefined || slotCount === 0)) {
        return;
      }
    }

    isUserSelectingRef.current = true;

    if (!normalizedStart || (normalizedStart && normalizedEnd)) {
      setRange(clickedDate, null);
    } else if (normalizedStart && !normalizedEnd) {
      if (clickedDate < normalizedStart) {
        setRange(clickedDate, null);
      } else {
        setRange(normalizedStart, clickedDate);
      }
    }

    setCalendarKey((prev) => prev + 1);

    setTimeout(() => {
      isUserSelectingRef.current = false;
    }, 100);
  };

  const dayCellContent = React.useCallback(
    (info) => {
      const cellDate = new Date(info.date);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < minDate;
      const isAfterMax = cellDate > maxDate;

      const dateStr = extractDateString(cellDate);
      const slotCount = dateStr ? datesWithSlots.get(dateStr) || 0 : 0;
      const hasSlots = slotCount > 0;

      const isStart = normalizedStart && cellDate.getTime() === normalizedStart.getTime();
      const isEnd = normalizedEnd && cellDate.getTime() === normalizedEnd.getTime();
      const isInRange =
        normalizedStart && normalizedEnd && cellDate > normalizedStart && cellDate < normalizedEnd;

      if (isStart || isEnd) {
        return (
          <div className={styles.selectedDateCell}>
            <span className={styles.dateNumber}>{info.dayNumberText}</span>
            <CheckCircle className={styles.checkIcon} />
            {hasSlots && <span className={styles.slotCountBadge}>{slotCount}</span>}
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
              {isStart ? 'Bắt đầu' : 'Kết thúc'}
            </span>
          </div>
        );
      }

      if (isInRange && !isPast && !isAfterMax) {
        return (
          <div
            className={styles.dateCellWithSlots}
            style={{
              backgroundColor: '#e0f2fe',
              borderRadius: 8,
              border: '1px solid #bfdbfe',
              width: '100%',
              height: '100%'
            }}
          >
            <span className={styles.dateNumber} style={{ color: '#0f172a' }}>
              {info.dayNumberText}
            </span>
            {hasSlots && (
              <div className={styles.slotIndicator}>
                <EventAvailable className={styles.slotIcon} />
                <span className={styles.slotCount}>{slotCount}</span>
              </div>
            )}
          </div>
        );
      }

      if (hasSlots && !isPast && !isAfterMax) {
        return (
          <div className={styles.dateCellWithSlots}>
            <span className={styles.dateNumber}>{info.dayNumberText}</span>
            <div className={styles.slotIndicator}>
              <EventAvailable className={styles.slotIcon} />
              <span className={styles.slotCount}>{slotCount}</span>
            </div>
          </div>
        );
      }

      return info.dayNumberText;
    },
    [datesWithSlots, minDate, maxDate, normalizedEnd, normalizedStart]
  );

  const handleStartInputChange = (value) => {
    // Clear any pending sync
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }

    // Mark as user selecting
    isUserSelectingRef.current = true;

    if (!value) {
      setStartDate(null);
      setEndDate(null);
      updateData({
        startDate: '',
        endDate: ''
      });
      setError('');
      isUserSelectingRef.current = false;
      return;
    }

    const newStart = normalizeDate(value);
    if (!newStart) {
      isUserSelectingRef.current = false;
      return;
    }

    // Limit to max date
    const limitedStart = newStart > maxDate ? maxDate : newStart;

    // If end date exists and is before start date, clear end date
    const newEnd = (normalizedEnd && limitedStart && normalizedEnd < limitedStart) ? null : normalizedEnd;

    setStartDate(limitedStart);
    setEndDate(newEnd);
    updateData({
      startDate: formatInputDate(limitedStart),
      endDate: newEnd ? formatInputDate(newEnd) : ''
    });
    setError('');

    // Allow props sync after a delay
    inputTimeoutRef.current = setTimeout(() => {
      isUserSelectingRef.current = false;
    }, 500);
  };

  const handleEndInputChange = (value) => {
    // Clear any pending sync
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }

    // Mark as user selecting
    isUserSelectingRef.current = true;

    if (!value) {
      setEndDate(null);
      updateData({
        endDate: ''
      });
      setError('');
      isUserSelectingRef.current = false;
      return;
    }

    const newEnd = normalizeDate(value);
    if (!newEnd) {
      isUserSelectingRef.current = false;
      return;
    }

    // Limit to max date
    const limitedEnd = newEnd > maxDate ? maxDate : newEnd;

    // If start date exists and is after end date, clear start date
    const newStart = (normalizedStart && limitedEnd && normalizedStart > limitedEnd) ? null : normalizedStart;

    setStartDate(newStart);
    setEndDate(limitedEnd);
    updateData({
      startDate: newStart ? formatInputDate(newStart) : '',
      endDate: formatInputDate(limitedEnd)
    });
    setError('');

    // Allow props sync after a delay
    inputTimeoutRef.current = setTimeout(() => {
      isUserSelectingRef.current = false;
    }, 500);
  };

  const formatDateDisplay = (date) => {
    if (!date) return '—';
    try {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return '—';
    }
  };

  const rangeLength = useMemo(() => {
    if (!normalizedStart || !normalizedEnd) return 0;
    return Math.round((normalizedEnd - normalizedStart) / (1000 * 60 * 60 * 24)) + 1;
  }, [normalizedEnd, normalizedStart]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Bước {stepIndex}/{totalSteps}: Chọn khoảng thời gian
        </Typography>
      </Box>

      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5', mb: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Chọn ngày bắt đầu và ngày kết thúc bằng cách click vào lịch. Hệ thống chỉ cho phép chọn những ngày còn slot khả dụng.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <div className={styles.calendarContainer}>
              <FullCalendar
                key={`bulk-calendar-${calendarKey}`}
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                initialDate={normalizedStart || minDate}
                locale={viLocale}
                headerToolbar={{ left: 'prev,next', center: 'title', right: '' }}
                firstDay={1}
                buttonText={viLocale.buttonText}
                dateClick={handleDateClick}
                dayCellClassNames={dayCellClassNames}
                dayCellContent={dayCellContent}
                validRange={{
                  start: minDate.toISOString().split('T')[0],
                  end: maxDate.toISOString().split('T')[0]
                }}
                height="auto"
                eventDisplay="none"
                selectable={false}
                editable={false}
                dayMaxEvents={false}
              />
            </div>
            {isLoadingSlots && (
              <Typography variant="body2" sx={{ mt: 1, color: '#6b7280' }}>
                Đang tải thông tin slot...
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                value={formatInputDate(normalizedStart)}
                onChange={(e) => handleStartInputChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: minDate.toISOString().split('T')[0],
                  max: maxDate.toISOString().split('T')[0]
                }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
              />

              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                value={formatInputDate(normalizedEnd)}
                onChange={(e) => handleEndInputChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: formatInputDate(normalizedStart) || minDate.toISOString().split('T')[0],
                  max: maxDate.toISOString().split('T')[0]
                }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
              />

              <Divider />

              <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Tóm tắt
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Ngày bắt đầu: <strong>{formatDateDisplay(normalizedStart)}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Ngày kết thúc: <strong>{formatDateDisplay(normalizedEnd)}</strong>
                </Typography>
                <Typography variant="body2">
                  Số ngày trong khoảng: <strong>{rangeLength || '—'}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Phạm vi tối đa: 12 tháng kể từ hôm nay
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
});

BulkStep1DateRange.displayName = 'BulkStep1DateRange';

export default BulkStep1DateRange;

