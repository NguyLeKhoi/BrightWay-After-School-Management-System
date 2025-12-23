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
    key: 'description',
    header: 'Mô Tả',
    render: (value) => (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
        {value || 'Không có mô tả'}
      </Typography>
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
    key: 'branches',
    header: 'Số Chi Nhánh',
    align: 'center',
    render: (value, item) => {
      const count = Array.isArray(item?.branches) ? item.branches.length : (item.branchesCount ?? 0);
      return (
        <Chip
          label={count}
          color="primary"
          size="small"
          variant="outlined"
        />
      );
    }
  },
  {
    key: 'price',
    header: 'Giá',
    align: 'right',
    render: (value) => (
      <Typography variant="body2" fontWeight="medium">
        {value !== null && value !== undefined 
          ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(value)
          : 'N/A'}
      </Typography>
    )
  },
  {
    key: 'stock',
    header: 'Tồn kho',
    align: 'right',
    render: (value) => (
      <Typography variant="body2" fontWeight="medium">
        {value !== null && value !== undefined ? value : 'N/A'}
      </Typography>
    )
  },
  {
    key: 'status',
    header: 'Trạng Thái',
    render: (value) => (
      <Chip
        label={value ? 'Hoạt động' : 'Không hoạt động'}
        color={value ? 'success' : 'default'}
        size="small"
      />
    )
  }
];

