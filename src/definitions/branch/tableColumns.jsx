import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Typography, Menu, MenuItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import {
  Business as BusinessIcon,
  Assignment as AssignIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';

export const createBranchColumns = ({
  onAssignBenefits,
  onAssignSchools,
  onAssignStudentLevels,
  onViewBranch,
  onEditBranch,
  onDeleteBranch,
  benefitsCountByBranchId = {}
}) => [
  {
    key: 'branchName',
    header: 'Tên Chi Nhánh',
    render: (value, item) => (
      <Box display="flex" alignItems="center" gap={1}>
        <BusinessIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight="medium">
          {value}
        </Typography>
      </Box>
    )
  },
  {
    key: 'address',
    header: 'Địa Chỉ',
    render: (value, item) => {
      const fullAddress = [item.address, item.districtName, item.provinceName]
        .filter(Boolean)
        .join(', ');

      return (
        <Typography variant="body2" color="text.secondary">
          {fullAddress || value}
        </Typography>
      );
    }
  },
  {
    key: 'phone',
    header: 'Số Điện Thoại',
    render: (value) => (
      <Typography variant="body2">
        {value}
      </Typography>
    )
  },
  {
    key: 'schoolsCount',
    header: 'Trường',
    align: 'center',
    render: (_, item) => {
      const count = Array.isArray(item.schools)
        ? item.schools.length
        : (item.schoolCount ?? item.schoolsCount ?? item.SchoolsCount ?? 0);
      return (
        <Chip label={count} color="info" size="small" />
      );
    }
  },
  {
    key: 'studentLevelsCount',
    header: 'Cấp Độ HS',
    align: 'center',
    render: (_, item) => {
      const count = Array.isArray(item.studentLevels)
        ? item.studentLevels.length
        : (item.studentLevelsCount ?? item.levelCount ?? item.LevelsCount ?? 0);
      return (
        <Chip label={count} color="warning" size="small" />
      );
    }
  },
  {
    key: 'benefitsCount',
    header: 'Lợi Ích',
    align: 'center',
    render: (_, item) => {
      const countFromMap = benefitsCountByBranchId?.[item.id];
      const count = typeof countFromMap === 'number'
        ? countFromMap
        : (Array.isArray(item.benefits) ? item.benefits.length : undefined);
      return (
        <Chip
          icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
          label={typeof count === 'number' ? count : '...'}
          color="success"
          size="small"
        />
      );
    }
  },
  {
    key: 'status',
    header: 'Trạng Thái',
    align: 'center',
    render: (_, item) => {
      // Map numeric status to string enum (same as room)
      const statusMap = {
        0: 'Active',
        1: 'Active',
        2: 'Inactive',
        3: 'UnderMaintenance',
        4: 'Closed',
        '0': 'Active',
        '1': 'Active',
        '2': 'Inactive',
        '3': 'UnderMaintenance',
        '4': 'Closed',
        'Active': 'Active',
        'Inactive': 'Inactive',
        'UnderMaintenance': 'UnderMaintenance',
        'Closed': 'Closed',
        // Map Vietnamese status strings from API
        'Hoạt động': 'Active',
        'Không hoạt động': 'Inactive',
        'Ngừng hoạt động': 'Inactive',
        'Đang bảo trì': 'UnderMaintenance',
        'Đã đóng': 'Closed'
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
      
      // Convert numeric status or Vietnamese string to string enum
      const rawStatus = item.status;
      let status = rawStatus;
      
      // If status exists in map, convert to enum
      if (rawStatus !== null && rawStatus !== undefined && statusMap[rawStatus] !== undefined) {
        status = statusMap[rawStatus];
      } else if (typeof rawStatus === 'string') {
        // Try to find Vietnamese status match (case-insensitive)
        const statusLower = rawStatus.trim().toLowerCase();
        for (const [key, value] of Object.entries(statusMap)) {
          if (typeof key === 'string' && key.toLowerCase() === statusLower) {
            status = value;
            break;
          }
        }
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
  },
  {
    key: 'actions',
    header: 'Thao tác',
    align: 'center',
    render: (_, item) => {
      // Create a component for action menu
      const ActionMenu = ({ item }) => {
        const [anchorEl, setAnchorEl] = useState(null);
        const open = Boolean(anchorEl);

        const handleClick = (event) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        };

        const handleClose = () => {
          setAnchorEl(null);
        };

        const handleMenuAction = (action) => {
          handleClose();
          action();
        };

        return (
          <>
            <Tooltip title="Thao tác">
              <IconButton
                size="small"
                onClick={handleClick}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={(e) => e.stopPropagation()}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {onViewBranch && (
                <MenuItem onClick={() => handleMenuAction(() => onViewBranch(item))}>
                  <ListItemIcon>
                    <VisibilityIcon fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={() => handleMenuAction(() => onAssignBenefits(item))}>
                <ListItemIcon>
                  <AssignIcon fontSize="small" color="info" />
                </ListItemIcon>
                <ListItemText>Gán lợi ích</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleMenuAction(() => onAssignSchools(item))}>
                <ListItemIcon>
                  <SchoolIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText>Gán trường</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleMenuAction(() => onAssignStudentLevels(item))}>
                <ListItemIcon>
                  <ClassIcon fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText>Gán cấp độ học sinh</ListItemText>
              </MenuItem>
              {onEditBranch && (
                <MenuItem onClick={() => handleMenuAction(() => onEditBranch(item))}>
                  <ListItemIcon>
                    <EditIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText>Sửa</ListItemText>
                </MenuItem>
              )}
              {onDeleteBranch && (
                <MenuItem 
                  onClick={() => handleMenuAction(() => onDeleteBranch(item))}
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'error.dark'
                    }
                  }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Xóa</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </>
        );
      };

      return (
        <Box display="flex" justifyContent="center">
          <ActionMenu item={item} />
        </Box>
      );
    }
  }
];


