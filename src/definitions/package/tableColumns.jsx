import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import {
  ShoppingCart as PackageIcon,
  DashboardCustomize as TemplateTabIcon
} from '@mui/icons-material';

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0 VNĐ';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '0 VNĐ';
  return `${numericValue.toLocaleString('vi-VN')} VNĐ`;
};

export const createTemplateColumns = (styles) => [
  {
    key: 'templateInfo',
    header: <Typography className={styles?.noWrap}>Thông tin mẫu</Typography>,
    render: (_, item) => (
      <Box display="flex" alignItems="flex-start" gap={2}>
        <TemplateTabIcon fontSize="small" color="primary" />
        <Box>
          <Typography variant="subtitle2" fontWeight="medium" className={styles?.primaryText}>
            {item?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item?.desc || 'Không có mô tả'}
          </Typography>
        </Box>
      </Box>
    )
  },
  {
    key: 'templatePrice',
    header: <Typography className={styles?.noWrap}>Giá bán</Typography>,
    render: (_, item) => (
      <Box className={styles?.compactCell}>
        <Typography variant="body2">
          <strong>Khoảng:</strong> {formatCurrency(item?.minPrice)} - {formatCurrency(item?.maxPrice)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Mặc định:</strong> {formatCurrency(item?.defaultPrice)}
        </Typography>
      </Box>
    )
  },
  {
    key: 'templateDuration',
    header: <Typography className={styles?.noWrap}>Thời hạn</Typography>,
    render: (_, item) => (
      <Box className={styles?.compactCell}>
        <Typography variant="body2">
          <strong>Khoảng:</strong> {item?.minDurationInMonths || 0} - {item?.maxDurationInMonths || 0} tháng
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Mặc định:</strong> {item?.defaultDurationInMonths || 0} tháng
        </Typography>
      </Box>
    )
  },
  {
    key: 'templateSlots',
    header: <Typography className={styles?.noWrap}>Số slot</Typography>,
    render: (_, item) => (
      <Box className={styles?.compactCell}>
        <Typography variant="body2">
          <strong>Khoảng:</strong> {item?.minSlots || 0} - {item?.maxSlots || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Mặc định:</strong> {item?.defaultTotalSlots || 0}
        </Typography>
      </Box>
    )
  },
  // Templates do not have an active/inactive status, so no status column here
];

export const createPackageColumns = (styles) => [
  {
    key: 'packageInfo',
    header: <Typography className={styles?.noWrap}>Thông tin gói</Typography>,
    render: (_, item) => (
      <Box display="flex" alignItems="flex-start" gap={2}>
        <PackageIcon fontSize="small" color="primary" />
        <Box>
          <Typography variant="subtitle2" fontWeight="medium" className={styles?.primaryText}>
            {item?.name}
          </Typography>
        </Box>
      </Box>
    )
  },
  {
    key: 'packagePrice',
    header: <Typography className={styles?.noWrap}>Giá & Thời hạn</Typography>,
    render: (_, item) => (
      <Box className={styles?.compactCell}>
        <Typography variant="body2">
          <strong>Giá:</strong> {formatCurrency(item?.price)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Thời hạn:</strong> {item?.durationInMonths || 0} tháng
        </Typography>
      </Box>
    )
  },
  {
    key: 'packageStatus',
    header: <Typography className={styles?.noWrap}>Trạng thái</Typography>,
    render: (_, item) => (
      <Chip
        label={item?.isActive ? 'Hoạt động' : 'Không hoạt động'}
        color={item?.isActive ? 'success' : 'default'}
        size="small"
        variant={item?.isActive ? 'filled' : 'outlined'}
      />
    )
  },
  {
    key: 'packageSlots',
    header: <Typography className={styles?.noWrap}>Số lượng</Typography>,
    render: (_, item) => (
      <Box className={styles?.compactCell}>
        <Typography variant="body2">
          <strong>Slots:</strong> {item?.totalSlots || 0}
        </Typography>
      </Box>
    )
  },
  {
    key: 'studentLevel',
    header: <Typography className={styles?.noWrap}>Cấp độ học sinh</Typography>,
    render: (_, item) => (
      <Box className={styles?.compactCell}>
        <Typography variant="body2">
          {item?.studentLevel?.name || item?.studentLevelName || 'N/A'}
        </Typography>
      </Box>
    )
  },
  {
    key: 'packageContext',
    header: <Typography className={styles?.noWrap}>Phạm vi áp dụng</Typography>,
    render: (_, item) => (
      <Box className={styles?.compactCell}>
        <Typography variant="body2">
          {item?.branch?.branchName || 'N/A'}
        </Typography>
      </Box>
    )
  }
];

// Manager-specific columns: only show Thông tin, Giá, Số lượng slot, Thời hạn, Trạng thái
export const createManagerPackageColumns = (styles) => [
  {
    key: 'packageInfo',
    header: <Typography className={styles?.noWrap}>Thông tin</Typography>,
    render: (_, item) => (
      <Box display="flex" alignItems="flex-start" gap={2}>
        <PackageIcon fontSize="small" color="primary" />
        <Box>
          <Typography variant="subtitle2" fontWeight="medium" className={styles?.primaryText}>
            {item?.name}
          </Typography>
        </Box>
      </Box>
    )
  },
  {
    key: 'packagePrice',
    header: <Typography className={styles?.noWrap}>Giá</Typography>,
    render: (_, item) => (
      <Typography variant="body2" fontWeight="medium">
        {formatCurrency(item?.price)}
      </Typography>
    )
  },
  {
    key: 'packageSlots',
    header: <Typography className={styles?.noWrap}>Số lượng slot</Typography>,
    render: (_, item) => (
      <Typography variant="body2" fontWeight="medium">
        {item?.totalSlots || 0}
      </Typography>
    )
  },
  {
    key: 'packageDuration',
    header: <Typography className={styles?.noWrap}>Thời hạn</Typography>,
    render: (_, item) => (
      <Typography variant="body2" fontWeight="medium">
        {item?.durationInMonths || 0} tháng
      </Typography>
    )
  },
  {
    key: 'studentLevel',
    header: <Typography className={styles?.noWrap}>Cấp độ học sinh</Typography>,
    render: (_, item) => (
      <Typography variant="body2" fontWeight="medium">
        {item?.studentLevel?.name || item?.studentLevelName || 'N/A'}
      </Typography>
    )
  },
  {
    key: 'packageStatus',
    header: <Typography className={styles?.noWrap}>Trạng thái</Typography>,
    render: (_, item) => (
      <Chip
        label={item?.isActive ? 'Hoạt động' : 'Không hoạt động'}
        color={item?.isActive ? 'success' : 'default'}
        size="small"
        variant={item?.isActive ? 'filled' : 'outlined'}
      />
    )
  }
];


