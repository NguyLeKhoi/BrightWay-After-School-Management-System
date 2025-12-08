import React from 'react';
import { Avatar, Box, Chip, Typography, Tooltip } from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Description as DocumentIcon
} from '@mui/icons-material';

export const createManagerStudentColumns = () => [
  {
    key: 'name',
    header: 'Tên Học Sinh',
    render: (value, item) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar 
          src={item.image && item.image !== 'string' ? item.image : undefined}
          sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
        >
          {value?.charAt(0)?.toUpperCase() || 'H'}
        </Avatar>
        <Typography variant="subtitle2" fontWeight="medium">
          {value || 'N/A'}
        </Typography>
      </Box>
    )
  },
  {
    key: 'userName',
    header: 'Phụ Huynh',
    render: (value) => (
      <Box display="flex" alignItems="center" gap={1}>
        <PersonIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          {value || 'N/A'}
        </Typography>
      </Box>
    )
  },
  {
    key: 'schoolName',
    header: 'Trường Học',
    render: (value) => (
      <Box display="flex" alignItems="center" gap={1}>
        <SchoolIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          {value || 'N/A'}
        </Typography>
      </Box>
    )
  },
  {
    key: 'studentLevelName',
    header: 'Cấp Độ',
    render: (value) => (
      <Chip label={value || 'N/A'} color="primary" size="small" variant="outlined" />
    )
  },
  {
    key: 'status',
    header: 'Trạng Thái',
    render: (value) => (
      <Chip
        label={value ? 'Hoạt Động' : 'Không Hoạt Động'}
        color={value ? 'success' : 'default'}
        size="small"
      />
    )
  },
  {
    key: 'unverifiedDocuments',
    header: 'Tài Liệu Chưa Duyệt',
    align: 'center',
    render: (value, item) => {
      // Count unverified documents (handle both camelCase and PascalCase)
      const documents = item?.documents || item?.Documents || [];
      const unverifiedCount = documents.filter(doc => {
        const verified = doc.verified ?? doc.Verified ?? false;
        return !verified;
      }).length;
      
      if (unverifiedCount === 0) {
        return (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        );
      }
      
      return (
        <Tooltip title={`Có ${unverifiedCount} tài liệu chưa được phê duyệt`}>
          <Chip
            icon={<DocumentIcon />}
            label={`${unverifiedCount} chưa duyệt`}
            color="warning"
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 500,
              borderWidth: 1.5,
              '&:hover': {
                backgroundColor: 'warning.50'
              }
            }}
          />
        </Tooltip>
      );
    }
  }
];


