import React from 'react';
import { Box, Chip, Typography, Avatar } from '@mui/material';
import { LocalOffer as ServiceIcon } from '@mui/icons-material';

export const createServiceColumns = () => [
  {
    key: 'image',
    header: 'Hình Ảnh',
    render: (value, item) => (
      <Avatar
        src={value}
        alt={item?.name || 'Service'}
        sx={{ width: 56, height: 56 }}
        variant="rounded"
      >
        <ServiceIcon />
      </Avatar>
    )
  },
  {
    key: 'name',
    header: 'Tên Dịch Vụ',
    render: (value) => (
      <Box display="flex" alignItems="center" gap={1}>
        <ServiceIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight="medium">
          {value || 'N/A'}
        </Typography>
      </Box>
    )
  },
  {
    key: 'serviceType',
    header: 'Loại Dịch Vụ',
    render: (value) => (
      <Chip
        label={value || 'N/A'}
        color="info"
        size="small"
        variant="outlined"
      />
    )
  },
  {
    key: 'price',
    header: 'Giá',
    align: 'right',
    render: (value, item) => {
      const display = item?.priceOverride ?? item?.effectivePrice ?? value;
      return (
        <Typography variant="body2" fontWeight="medium">
          {display !== null && display !== undefined 
            ? new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(display)
            : 'N/A'}
        </Typography>
      );
    }
  },
  {
    key: 'stock',
    header: 'Tồn kho',
    align: 'right',
    render: (value, item) => (
      <Typography variant="body2" fontWeight="medium">
        {item?.stock !== null && item?.stock !== undefined ? item.stock : '—'}
      </Typography>
    )
  },
  
  {
    key: 'status',
    header: 'Trạng Thái',
    render: (value, item) => {
      const active = item?.isActive !== undefined && item?.isActive !== null
        ? Boolean(item.isActive)
        : (value !== undefined && value !== null ? Boolean(value) : false);
      return (
        <Chip
          label={active ? 'Hoạt động' : 'Không hoạt động'}
          color={active ? 'success' : 'default'}
          size="small"
        />
      );
    }
  }
];

