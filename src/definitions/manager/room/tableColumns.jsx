import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { MeetingRoom as RoomIcon } from '@mui/icons-material';

export const createManagerRoomColumns = (styles) => [
  {
    key: 'roomName',
    header: 'Tên Phòng',
    render: (_, item) => (
      <Typography variant="body2" fontWeight="medium">
        {item.roomName || 'N/A'}
      </Typography>
    )
  },
  {
    key: 'facilityName',
    header: 'Cơ Sở Vật Chất',
    render: (_, item) => (
      <div className={styles?.facilityCell}>
        <RoomIcon className={styles?.facilityIcon} fontSize="small" />
        <span className={styles?.facilityName}>
          {item.facilityName || 'N/A'}
        </span>
      </div>
    )
  },
  {
    key: 'capacity',
    header: 'Sức Chứa',
    render: (value) => (
      <span className={styles?.capacityText}>
        {value} người
      </span>
    )
  },
  {
    key: 'status',
    header: 'Trạng Thái',
    align: 'center',
    render: (_, item) => {
      // Backend returns Vietnamese/English mixed strings: "Active", "Inactive", "Đang bảo trì", "Đã đóng"
      // Or numeric enum: 1=Active, 2=Inactive, 3=UnderMaintenance, 4=Closed
      const statusMap = {
        1: 'Active',
        2: 'Inactive',
        3: 'UnderMaintenance',
        4: 'Closed',
        '1': 'Active',
        '2': 'Inactive',
        '3': 'UnderMaintenance',
        '4': 'Closed',
        'Active': 'Active',
        'Inactive': 'Inactive',
        'UnderMaintenance': 'UnderMaintenance',
          'Đang bảo trì': 'UnderMaintenance',
          'Đã đóng': 'Closed',
        'Closed': 'Closed'
      };
      
      const statusLabels = {
        'Active': 'Hoạt động',
        'Inactive': 'Không hoạt động',
        'UnderMaintenance': 'Đang bảo trì',
        'Closed': 'Đã đóng'
      };
      const statusColors = {
        'Active': 'success',
        'Inactive': 'default',
        'UnderMaintenance': 'warning',
        'Closed': 'error'
      };
      
      // Convert numeric status to string enum
      const rawStatus = item.status;
      let status = rawStatus;
      
      // If status exists in map, convert to enum
      if (rawStatus !== null && rawStatus !== undefined && statusMap[rawStatus] !== undefined) {
        status = statusMap[rawStatus];
      }
      
      // Default to Active if status is not valid
      if (!status || !statusLabels[status]) {
        status = 'Active';
      }
      
      const isDeleted = item.isDeleted !== undefined ? item.isDeleted : item.IsDeleted !== undefined ? item.IsDeleted : false;
      const displayStatus = isDeleted ? 'Đã xóa' : (statusLabels[status] || 'Hoạt động');
      const displayColor = isDeleted ? 'error' : (statusColors[status] || 'success');
      
      return (
        <Chip
          label={displayStatus}
          color={displayColor}
          size="small"
          variant={isDeleted ? 'outlined' : 'filled'}
        />
      );
    }
  }
];


