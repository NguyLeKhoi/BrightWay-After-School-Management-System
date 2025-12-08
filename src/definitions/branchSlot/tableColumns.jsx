import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { AccessTime as TimeframeIcon, Category as SlotTypeIcon, MeetingRoom as RoomIcon, Person as StaffIcon, School as StudentLevelIcon } from '@mui/icons-material';
import { formatDateOnlyUTC7 } from '../../utils/dateHelper';

/**
 * Week Date Mapping:
 * 0 = Chủ nhật (Sunday)
 * 1 = Thứ 2 (Monday)
 * 2 = Thứ 3 (Tuesday)
 * 3 = Thứ 4 (Wednesday)
 * 4 = Thứ 5 (Thursday)
 * 5 = Thứ 6 (Friday)
 * 6 = Thứ 7 (Saturday)
 */
const WEEK_DAYS = {
  0: 'Chủ nhật',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7'
};

const STATUS_COLORS = {
  Available: 'success',
  Occupied: 'warning',
  Cancelled: 'error',
  Maintenance: 'default'
};

const STATUS_LABELS = {
  Available: 'Có sẵn',
  Occupied: 'Đã đầy',
  Cancelled: 'Đã hủy',
  Maintenance: 'Bảo trì'
};

export const createBranchSlotColumns = (styles) => [
  {
    key: 'scheduleInfo',
    header: <Typography className={styles?.noWrap}>Thông tin lịch</Typography>,
    render: (_, item) => (
      <Box display="flex" alignItems="center" gap={1}>
        <TimeframeIcon fontSize="small" color="primary" sx={{ flexShrink: 0 }} />
        <Box display="flex" flexDirection="column" gap={0.25}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
            {item?.timeframe?.name || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {item?.timeframe?.startTime && item?.timeframe?.endTime 
              ? `${item.timeframe.startTime} - ${item.timeframe.endTime}`
              : 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            <strong>{WEEK_DAYS[item?.weekDate] || `Ngày ${item?.weekDate || 'N/A'}`}</strong>
            {item?.date && (
              <>, {formatDateOnlyUTC7(item.date)}</>
            )}
          </Typography>
        </Box>
      </Box>
    )
  },
  {
    key: 'studentLevels',
    header: <Typography className={styles?.noWrap}>Cấp độ học sinh</Typography>,
    render: (_, item) => {
      // Prefer explicit allowedStudentLevels if present
      const explicitLevels = Array.isArray(item?.allowedStudentLevels)
        ? item.allowedStudentLevels
            .map(l => l?.name || l?.levelName || l)
            .filter(Boolean)
        : [];

      // Fallback: derive from slotType.assignedPackages[].studentLevel
      const packageLevels = Array.isArray(item?.slotType?.assignedPackages)
        ? item.slotType.assignedPackages
            .map(p => p?.studentLevel?.name || p?.studentLevel?.levelName)
            .filter(Boolean)
        : [];

      const levelNames = Array.from(new Set([...(explicitLevels || []), ...(packageLevels || [])]));

      return (
        <Box display="flex" alignItems="flex-start" gap={1}>
          <StudentLevelIcon fontSize="small" color="primary" />
          {levelNames.length > 0 ? (
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {levelNames.map((name, idx) => (
                <Chip key={`${name}-${idx}`} label={name} size="small" variant="outlined" />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">N/A</Typography>
          )}
        </Box>
      );
    }
  },
  {
    key: 'slotType',
    header: <Typography className={styles?.noWrap}>Loại ca giữ trẻ</Typography>,
    render: (_, item) => (
      <Box display="flex" alignItems="center" gap={1}>
        <SlotTypeIcon fontSize="small" color="primary" />
        <Box>
          <Typography variant="subtitle2" fontWeight="medium">
            {item?.slotType?.name || 'N/A'}
          </Typography>
          {item?.slotType?.description && (
            <Typography variant="body2" color="text.secondary">
              {item.slotType.description}
            </Typography>
          )}
        </Box>
      </Box>
    )
  },
  {
    key: 'resources',
    header: <Typography className={styles?.noWrap}>Phòng & Nhân viên</Typography>,
    render: (_, item) => {
      const roomCount = item?.roomSlots?.length || item?.rooms?.length || 0;
      // Sử dụng amountStaff từ API response, fallback về đếm mảng nếu không có
      const staffCount = item?.amountStaff ?? (item?.staffSlots?.length || item?.staffs?.length || item?.staff?.length || 0);
      
      return (
        <Box display="flex" flexDirection="column" gap={0.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <RoomIcon fontSize="small" color="primary" />
            <Typography variant="body2">
              <strong>{roomCount}</strong> phòng
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <StaffIcon fontSize="small" color="primary" />
            <Typography variant="body2">
              <strong>{staffCount}</strong> nhân viên
            </Typography>
          </Box>
        </Box>
      );
    }
  },
  {
    key: 'status',
    header: <Typography className={styles?.noWrap}>Trạng thái</Typography>,
    render: (_, item) => (
      <Chip
        label={STATUS_LABELS[item?.status] || item?.status || 'N/A'}
        color={STATUS_COLORS[item?.status] || 'default'}
        size="small"
        variant="filled"
      />
    )
  }
];

