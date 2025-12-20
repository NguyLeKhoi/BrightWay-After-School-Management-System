import React, { useEffect, useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CheckCircle, EventAvailable } from '@mui/icons-material';
import branchSlotService from '../../../../../services/branchSlot.service';
import { parseDateFromUTC7, extractDateString } from '../../../../../utils/dateHelper';
import styles from './Schedule.module.css';

// Vietnamese locale configuration for FullCalendar
const viLocale = {
  code: 'vi',
  week: {
    dow: 1, // Monday is the first day of the week
    doy: 4  // The week that contains Jan 4th is the first week of the year
  },
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
  weekText: 'Tuần',
  weekNumbers: {
    weekNumber: 'Số tuần',
    allWeeks: 'Tất cả các tuần'
  },
  monthNames: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  monthNamesShort: [
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
    'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
  ],
  dayNames: [
    'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'
  ],
  dayNamesShort: [
    'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'
  ]
};

const Step1SelectDate = forwardRef(({ data, updateData, stepIndex, totalSteps }, ref) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [minDate, setMinDate] = useState(new Date());
  const [calendarKey, setCalendarKey] = useState(0);
  const calendarRef = React.useRef(null);
  const isUserSelectingRef = React.useRef(false);
  const [datesWithSlots, setDatesWithSlots] = useState(new Map()); // Map of date string -> slot count
  const [checkedDates, setCheckedDates] = useState(new Set()); // Set of date strings that have been checked
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);
    return d1.getTime() === d2.getTime();
  };

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!selectedDate) {
        return false;
      }
      updateData({ 
        selectedDate: selectedDate
      });
      return true;
    }
  }));

  useEffect(() => {
    if (isUserSelectingRef.current) {
      return;
    }

    if (data?.selectedDate) {
      const date = data.selectedDate instanceof Date 
        ? new Date(data.selectedDate) 
        : new Date(data.selectedDate);
      
      if (!selectedDate || !isSameDate(date, selectedDate)) {
        setSelectedDate(date);
        
        if (calendarRef.current) {
          try {
            const calendarApi = calendarRef.current.getApi();
            if (calendarApi) {
              calendarApi.gotoDate(date);
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }
    }
  }, [data?.selectedDate]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setMinDate(today);
  }, []);

  // Load available slots for the next 2 months to show which dates have slots
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const loadAvailableDates = async () => {
      if (!data?.studentId) {
        return;
      }

      setIsLoadingSlots(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const datesWithSlotsMap = new Map(); // Map<dateString, slotCount>
        const checkedDatesSet = new Set(); // Track which dates have been checked
        
        // Load slots for the next 2 months only (reduce API calls)
        // Strategy: Load current month first (fast), then load next month in background
        const monthsToLoad = 2;
        const allDatesByMonth = [];
        
        // Collect all dates to check, grouped by month
        for (let monthOffset = 0; monthOffset < monthsToLoad; monthOffset++) {
          const monthStart = new Date(today);
          monthStart.setMonth(monthStart.getMonth() + monthOffset);
          monthStart.setDate(1);
          
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0); // Last day of month
          
          const monthDates = [];
          for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            if (d >= today) {
              monthDates.push(new Date(d));
            }
          }
          allDatesByMonth.push(monthDates);
        }
        
        // Load current month first (priority), then other months
        const loadMonth = async (monthDates, isCurrentMonth = false) => {
          if (!isMounted) return;
          
          // Load in batches (one week at a time) to optimize API calls
          const batchSize = 7;
          for (let i = 0; i < monthDates.length; i += batchSize) {
            if (!isMounted) return; // Check if still mounted before each batch
            
            const batch = monthDates.slice(i, i + batchSize);
            
            // Load all dates in the batch in parallel
            const results = await Promise.all(
              batch.map(async (d) => {
                try {
                  const checkDateStr = extractDateString(d);
                  if (!checkDateStr) return null;
                  
                  // Load all pages to ensure we get all available slots for accurate count
                  const items = await branchSlotService.getAllAvailableSlotsForStudent(data.studentId, {
                    date: d,
                    pageSize: 100
                  });
                  
                  // Filter slots by date if they have specific date
                  const validSlots = items.filter(slot => {
                    if (!slot.date) {
                      // Slot without specific date - check if it matches the weekday
                      const slotWeekDay = slot.weekDate !== undefined ? slot.weekDate : null;
                      if (slotWeekDay !== null) {
                        return d.getDay() === slotWeekDay;
                      }
                      return true; // Include if no date restriction
                    }
                    
                    const slotDate = parseDateFromUTC7(slot.date);
                    if (!slotDate) return false;
                    
                    const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
                    const checkDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    
                    return slotDateOnly.getTime() === checkDateOnly.getTime();
                  });
                  
                  return {
                    dateStr: checkDateStr,
                    slotCount: validSlots.length
                  };
                } catch (err) {
                  // Ignore errors for individual date checks
                  console.debug('Error checking date:', d, err);
                  return null;
                }
              })
            );
            
            // Process results and update maps
            results.forEach(result => {
              if (!result) return;
              
              checkedDatesSet.add(result.dateStr);
              datesWithSlotsMap.set(result.dateStr, result.slotCount);
            });
            
            // Update state after each batch for current month only (to show progress)
            if (isCurrentMonth && isMounted) {
              setDatesWithSlots(new Map(datesWithSlotsMap));
              setCheckedDates(new Set(checkedDatesSet));
            }
          }
        };
        
        // Load current month first (synchronous), then other months in background
        await loadMonth(allDatesByMonth[0], true);
        
        // Load other months in background (don't await)
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
        console.error('Error loading available dates:', err);
        // Don't show error, just don't highlight dates
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadAvailableDates();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [data?.studentId]);

  useEffect(() => {
    if (selectedDate && calendarRef.current) {
      try {
        const calendarApi = calendarRef.current.getApi();
        if (calendarApi) {
          const currentDate = calendarApi.getDate();
          const selectedMonth = selectedDate.getMonth();
          const selectedYear = selectedDate.getFullYear();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          if (selectedMonth !== currentMonth || selectedYear !== currentYear) {
            calendarApi.gotoDate(selectedDate);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }
  }, [selectedDate]);

  const normalizedSelectedDate = React.useMemo(() => {
    if (!selectedDate) return null;
    const normalized = new Date(selectedDate);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, [selectedDate]);

  const dayCellClassNames = React.useCallback((info) => {
    const classes = [];
    
    const cellDate = new Date(info.date);
    cellDate.setHours(0, 0, 0, 0);
    const isPast = cellDate < minDate;

    if (isPast) {
      classes.push(styles.disabledDate);
    }

    // Check if this date has slots
    const dateStr = extractDateString(cellDate);
    const slotCount = dateStr ? datesWithSlots.get(dateStr) : undefined;
    const hasSlots = slotCount !== undefined && slotCount > 0;
    const isChecked = dateStr ? checkedDates.has(dateStr) : false;
    const hasNoSlots = isChecked && slotCount !== undefined && slotCount === 0;
    
    if (hasSlots && !isPast) {
      classes.push(styles.dateWithSlots);
    } else if (hasNoSlots && !isPast) {
      // Date has been checked and has no slots - disable it
      classes.push(styles.dateWithoutSlots);
    } else if (!isChecked && !isPast && checkedDates.size > 0) {
      // Date hasn't been checked yet but we're loading - show as loading
      classes.push(styles.dateLoading);
    }

    if (normalizedSelectedDate) {
      const cellDate = new Date(info.date);
      cellDate.setHours(0, 0, 0, 0);
      
      if (cellDate.getTime() === normalizedSelectedDate.getTime()) {
        classes.push('fc-day-selected');
      }
    }

    return classes.join(' ');
  }, [normalizedSelectedDate, minDate, datesWithSlots, checkedDates]);

  const handleDateClick = (info) => {
    const clickedDate = info.date;

    if (clickedDate < minDate) {
      return;
    }

    const dateStr = extractDateString(clickedDate);

    // Check if this date has been checked and has slots
    if (checkedDates.size > 0) {
      const isChecked = dateStr ? checkedDates.has(dateStr) : false;
      const slotCount = dateStr ? datesWithSlots.get(dateStr) : undefined;

      // If date has been checked but has no slots, don't allow selection
      if (isChecked && (slotCount === undefined || slotCount === 0)) {
        return;
      }

      // If date hasn't been checked yet, don't allow selection (still loading)
      if (!isChecked) {
        return;
      }
    } else if (datesWithSlots.size > 0) {
      // Fallback: if we have some data but date not in map, it means no slots
      const slotCount = dateStr ? datesWithSlots.get(dateStr) : 0;
      if (!dateStr || slotCount === 0) {
        return;
      }
    }

    if (selectedDate && isSameDate(clickedDate, selectedDate)) {
      return;
    }

    // Fix timezone issue: Create date from local date components to avoid timezone shift
    const year = clickedDate.getFullYear();
    const month = clickedDate.getMonth();
    const day = clickedDate.getDate();
    // Create date at noon local time to avoid DST issues
    const newSelectedDate = new Date(year, month, day, 12, 0, 0, 0);

    isUserSelectingRef.current = true;

    setSelectedDate(newSelectedDate);
    updateData({ selectedDate: newSelectedDate });

    setCalendarKey(prev => prev + 1);

    setTimeout(() => {
      isUserSelectingRef.current = false;
    }, 100);
  };

  const dayCellContent = React.useCallback((info) => {
    const cellDate = new Date(info.date);
    cellDate.setHours(0, 0, 0, 0);
    const isPast = cellDate < minDate;
    
    const dateStr = extractDateString(cellDate);
    const slotCount = dateStr ? datesWithSlots.get(dateStr) || 0 : 0;
    const hasSlots = slotCount > 0;
    
    const isSelected = normalizedSelectedDate && cellDate.getTime() === normalizedSelectedDate.getTime();
    
    if (isSelected) {
      return (
        <div className={styles.selectedDateCell}>
          <span className={styles.dateNumber}>{info.dayNumberText}</span>
          <CheckCircle className={styles.checkIcon} />
          {hasSlots && (
            <span className={styles.slotCountBadge}>{slotCount}</span>
          )}
        </div>
      );
    }
    
    if (hasSlots && !isPast) {
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
  }, [normalizedSelectedDate, minDate, datesWithSlots]);

  const formatDate = (date) => {
    if (!date) return '—';
    try {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Bước {stepIndex + 1}/{totalSteps}: Chọn ngày</h2>
        <p className={styles.stepSubtitle}>
          Chọn ngày bạn muốn đăng ký ca giữ trẻ
        </p>
      </div>

      <div className={styles.bookingForm}>
        <div className={styles.formGroup}>
          <div className={styles.calendarContainer}>
            <FullCalendar
              key={`calendar-${calendarKey}-${selectedDate ? selectedDate.getTime() : 'no-selection'}`}
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={selectedDate || minDate}
              locale={viLocale}
              headerToolbar={{
                left: 'prev,next',
                center: 'title',
                right: ''
              }}
              firstDay={1}
              buttonText={viLocale.buttonText}
              dateClick={handleDateClick}
              dayCellClassNames={dayCellClassNames}
              dayCellContent={dayCellContent}
              validRange={{
                start: minDate.toISOString().split('T')[0]
              }}
              height="auto"
              eventDisplay="none"
              selectable={false}
              editable={false}
              dayMaxEvents={false}
            />
          </div>
        </div>

        {selectedDate && (
          <div className={styles.bookingSummary} style={{ marginTop: '24px' }}>
            <h3 className={styles.summaryTitle}>Ngày đã chọn</h3>
            <div className={styles.infoGrid}>
              <div>
                <p className={styles.infoLabel}>Ngày</p>
                <p className={styles.infoValue}>{formatDate(selectedDate)}</p>
              </div>
              {datesWithSlots.size > 0 && (() => {
                const dateStr = extractDateString(selectedDate);
                const slotCount = dateStr ? datesWithSlots.get(dateStr) || 0 : 0;
                return (
                  <div>
                    <p className={styles.infoLabel}>Số lượng slot</p>
                    <p className={styles.infoValue} style={{ 
                      color: slotCount > 0 ? 'var(--color-success)' : 'var(--color-warning)',
                      fontWeight: 600
                    }}>
                      {slotCount > 0 
                        ? `✓ ${slotCount} slot khả dụng` 
                        : '⚠ Không có slot'}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        
        {isLoadingSlots && (
          <div style={{ marginTop: '16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Đang tải thông tin slot...
          </div>
        )}
      </div>
    </div>
  );
});

Step1SelectDate.displayName = 'Step1SelectDate';

export default Step1SelectDate;

