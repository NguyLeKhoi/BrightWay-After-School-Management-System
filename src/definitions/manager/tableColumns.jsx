import React from 'react';
import { Box, Chip, Typography, Avatar } from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  AssignmentInd as RoleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

const formatRoleLabel = (roleString) => {
  switch (roleString) {
    case 'Admin':
      return 'Quản trị viên';
    case 'Staff':
      return 'Nhân viên';
    case 'Manager':
      return 'Quản lý';
    case 'User':
      return 'Người dùng';
    default:
      return roleString || 'Chưa xác định';
  }
};

const getRoleColor = (roleString) => {
  switch (roleString) {
    case 'Admin':
      return 'error';
    case 'Manager':
      return 'warning';
    case 'Staff':
      return 'info';
    case 'User':
      return 'primary';
    default:
      return 'default';
  }
};

export const createManagerColumns = () => [
  {
    key: 'name',
    header: 'Họ và Tên',
    render: (value, item) => (
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar
          src={item.profilePictureUrl && item.profilePictureUrl !== 'string' ? item.profilePictureUrl : undefined}
          sx={{ width: 40, height: 40, bgcolor: 'warning.main' }}
        >
          {value?.charAt(0)?.toUpperCase() || 'M'}
        </Avatar>
        <Typography variant="subtitle2" fontWeight="medium">
          {value}
        </Typography>
      </Box>
    )
  },
  {
    key: 'email',
    header: 'Email',
    render: (value) => (
      <Box display="flex" alignItems="center" gap={1}>
        <EmailIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          {value}
        </Typography>
      </Box>
    )
  },
  {
    key: 'branchName',
    header: 'Chi Nhánh',
    render: (value, item) => (
      <Box display="flex" alignItems="center" gap={1}>
        <BusinessIcon fontSize="small" color={value ? 'primary' : 'disabled'} />
        <Typography variant="body2" color={value ? 'text.primary' : 'text.secondary'}>
          {value || item.branchName || 'Chưa có chi nhánh'}
        </Typography>
      </Box>
    )
  },
  {
    key: 'roles',
    header: 'Vai Trò',
    render: (value, item) => {
      let roleNames = [];

      if (item.roleName) {
        roleNames = [item.roleName];
      } else if (Array.isArray(item.roles) && item.roles.length > 0) {
        roleNames = item.roles;
      } else if (Array.isArray(value) && value.length > 0) {
        roleNames = value;
      } else if (value) {
        roleNames = [value];
      } else {
        roleNames = ['Unknown'];
      }

      return (
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {roleNames.map((role, index) => (
            <Chip
              key={`${role}-${index}`}
              label={formatRoleLabel(role)}
              color={getRoleColor(role)}
              size="small"
              variant="outlined"
              icon={<RoleIcon fontSize="small" />}
            />
          ))}
        </Box>
      );
    }
  },
  {
    key: 'createdAt',
    header: 'Ngày Tạo',
    render: (value) => (
      <Typography variant="body2" color="text.secondary">
        {value ? new Date(value).toLocaleDateString('vi-VN') : 'N/A'}
      </Typography>
    )
  },
  {
    key: 'isActive',
    header: 'Trạng Thái',
    align: 'center',
    render: (value, item) => {
      const isActive = item.isActive !== undefined ? item.isActive : value !== undefined ? value : true;
      return (
        <Chip
          label={isActive ? 'Hoạt động' : 'Không hoạt động'}
          color={isActive ? 'success' : 'default'}
          size="small"
          variant={isActive ? 'filled' : 'outlined'}
        />
      );
    }
  }
];


