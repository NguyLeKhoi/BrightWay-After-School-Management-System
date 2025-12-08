import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem
} from '@mui/material';
import {
  CreditCard as CardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DataTable from '../../../components/Common/DataTable';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ContentLoading from '../../../components/Common/ContentLoading';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import nfcCardService from '../../../services/nfcCard.service';
import { getErrorMessage } from '../../../utils/errorHandler';
import useAvailableStudentsForNfc from '../../../hooks/useAvailableStudentsForNfc';
import styles from './NfcCardManagement.module.css';

const NfcCardManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { students: studentOptions, refetch: refetchStudents } = useAvailableStudentsForNfc();

  // Dialog states
  const [createDialog, setCreateDialog] = useState({
    open: false,
    studentId: '',
    cardUid: ''
  });
  const [editDialog, setEditDialog] = useState({
    open: false,
    card: null,
    newStatus: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: null
  });

  useEffect(() => {
    loadData();
    refetchStudents();
  }, [refetchStudents]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await nfcCardService.getChildrenWithNfc();
      const childrenArray = Array.isArray(response) ? response : [];
      
      // Flatten data: mỗi trẻ có thể có nhiều thẻ NFC
      const flattenedData = [];
      childrenArray.forEach(child => {
        if (child.nfcCards && child.nfcCards.length > 0) {
          child.nfcCards.forEach(card => {
            flattenedData.push({
              ...card,
              studentId: child.studentId,
              studentName: child.studentName,
              image: child.image,
              branchId: child.branchId,
              branchName: child.branchName,
              parentId: child.parentId,
              parentName: child.parentName,
              studentLevelId: child.studentLevelId,
              studentLevelName: child.studentLevelName
            });
          });
        }
      });
      
      setData(flattenedData);
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể tải danh sách thẻ NFC';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      refetchStudents();
    }
  };

  const handleKeywordChange = (value) => {
    setKeyword(value);
  };

  const handleKeywordSearch = () => {
    // Client-side search
  };

  const handleClearSearch = () => {
    setKeyword('');
  };

  const handleCreateCard = () => {
    setCreateDialog({
      open: true,
      studentId: '',
      cardUid: ''
    });
  };

  const handleCreateSubmit = async () => {
    if (!createDialog.studentId || !createDialog.cardUid) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setActionLoading(true);
      await nfcCardService.createCard({
        cardUid: createDialog.cardUid,
        studentId: createDialog.studentId
      });
      toast.success('Tạo thẻ NFC thành công');
      setCreateDialog({ open: false, studentId: '', cardUid: '' });
      loadData();
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể tạo thẻ NFC';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStatus = (card) => {
    setEditDialog({
      open: true,
      card: card,
      newStatus: card.status || ''
    });
  };

  const handleEditSubmit = async () => {
    if (!editDialog.card || !editDialog.newStatus) {
      toast.error('Vui lòng chọn trạng thái');
      return;
    }

    try {
      setActionLoading(true);
      await nfcCardService.updateCard(editDialog.card.id, editDialog.newStatus);
      toast.success('Cập nhật trạng thái thành công');
      setEditDialog({ open: false, card: null, newStatus: '' });
      loadData();
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể cập nhật trạng thái';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (card) => {
    setConfirmDialog({
      open: true,
      title: 'Xóa thẻ NFC',
      description: `Bạn có chắc chắn muốn xóa thẻ NFC "${card.cardUid}" của "${card.studentName}"?`,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await nfcCardService.deleteCard(card.id);
          toast.success('Xóa thẻ NFC thành công');
          setConfirmDialog({ open: false, title: '', description: '', onConfirm: null });
          loadData();
        } catch (err) {
          const errorMessage = getErrorMessage(err) || 'Không thể xóa thẻ NFC';
          toast.error(errorMessage);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const columns = useMemo(() => [
    {
      key: 'studentName',
      header: 'Học sinh',
      align: 'left',
      render: (value, item) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar
            src={item.image && item.image !== 'string' ? item.image : undefined}
            sx={{ width: 40, height: 40 }}
          >
            {value?.[0]?.toUpperCase() || 'S'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              {value || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.studentLevelName || ''}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      key: 'cardUid',
      header: 'Mã thẻ (UID)',
      align: 'left',
      render: (value) => (
        <Box display="flex" alignItems="center" gap={1}>
          <CardIcon fontSize="small" color="primary" />
          <Typography variant="body2" fontFamily="monospace">
            {value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      align: 'center',
      render: (value) => {
        const isActive = value?.toLowerCase() === 'active' || value === 'Hoạt động';
        return (
          <Chip
            icon={isActive ? <ActiveIcon /> : <InactiveIcon />}
            label={isActive ? 'Hoạt động' : 'Không hoạt động'}
            color={isActive ? 'success' : 'default'}
            size="small"
            variant={isActive ? 'filled' : 'outlined'}
          />
        );
      }
    },
    {
      key: 'issuedDate',
      header: 'Ngày cấp',
      align: 'left',
      render: (value) => {
        if (!value) return <Typography variant="body2" color="text.secondary">—</Typography>;
        const date = new Date(value);
        return (
          <Typography variant="body2" color="text.secondary">
            {date.toLocaleDateString('vi-VN')}
          </Typography>
        );
      }
    }
  ], []);

  const filteredData = useMemo(() => {
    if (!keyword) return data;
    const lowerKeyword = keyword.toLowerCase();
    return data.filter(item =>
      item.studentName?.toLowerCase().includes(lowerKeyword) ||
      item.cardUid?.toLowerCase().includes(lowerKeyword) ||
      item.status?.toLowerCase().includes(lowerKeyword)
    );
  }, [data, keyword]);

  if (loading) {
    return <ContentLoading isLoading={true} text="Đang tải danh sách thẻ NFC..." />;
  }

  return (
    <div className={styles.managementPage}>
      <div className={styles.container}>
        <ManagementPageHeader
          title="Quản lý Thẻ NFC"
          createButtonText="Tạo Thẻ NFC"
          onCreateClick={handleCreateCard}
        />

        <ManagementSearchSection
          keyword={keyword}
          onKeywordChange={handleKeywordChange}
          onSearch={handleKeywordSearch}
          onClear={handleClearSearch}
          placeholder="Tìm kiếm theo tên học sinh, mã thẻ..."
          showFilters={false}
        />

        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          onView={(item) => navigate(`/manager/nfc-cards/detail/${item.studentId}`)}
          onEdit={handleEditStatus}
          onDelete={handleDelete}
          emptyMessage="Không có thẻ NFC nào."
          viewTooltip="Xem chi tiết"
          editTooltip="Cập nhật trạng thái"
          deleteTooltip="Xóa thẻ NFC"
        />
      </div>

      {/* Create Dialog */}
      <Dialog
        open={createDialog.open}
        onClose={() => !actionLoading && setCreateDialog({ open: false, studentId: '', cardUid: '' })}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-2xl)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            color: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            fontFamily: 'var(--font-family)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-xl)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CardIcon sx={{ fontSize: '24px' }} />
            <span>Tạo thẻ NFC mới</span>
          </Box>
          <Button
            onClick={() => setCreateDialog({ open: false, studentId: '', cardUid: '' })}
            disabled={actionLoading}
            sx={{
              color: 'var(--bg-primary)',
              minWidth: 'auto',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              transition: 'var(--transition-all)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'scale(1.1)'
              },
              '&:disabled': {
                opacity: 0.5
              }
            }}
          >
            ✕
          </Button>
        </DialogTitle>
        <DialogContent sx={{ 
          padding: '28px !important',
          backgroundColor: 'var(--bg-primary)',
          fontFamily: 'var(--font-family)'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Chọn Học sinh"
              value={createDialog.studentId}
              onChange={(e) => setCreateDialog(prev => ({ ...prev, studentId: e.target.value }))}
              fullWidth
              disabled={actionLoading}
              SelectProps={{
                native: false
              }}
            >
              <MenuItem value="">-- Chọn học sinh --</MenuItem>
              {studentOptions.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.name} {student.studentLevelName ? `(${student.studentLevelName})` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Mã thẻ (UID)"
              value={createDialog.cardUid}
              onChange={(e) => setCreateDialog(prev => ({ ...prev, cardUid: e.target.value }))}
              placeholder="Ví dụ: 04:5A:3F:2A:1B:6C:80"
              fullWidth
              disabled={actionLoading}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={() => setCreateDialog({ open: false, studentId: '', cardUid: '' })}
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 20px'
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 20px',
              background: 'var(--color-secondary)',
              fontWeight: 600,
              '&:hover': {
                background: 'var(--color-secondary-dark)'
              }
            }}
          >
            {actionLoading ? 'Đang tạo...' : 'Tạo thẻ NFC'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => !actionLoading && setEditDialog({ open: false, card: null, newStatus: '' })}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-2xl)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            color: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            fontFamily: 'var(--font-family)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-xl)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EditIcon sx={{ fontSize: '24px' }} />
            <span>Cập nhật trạng thái thẻ NFC</span>
          </Box>
          <Button
            onClick={() => setEditDialog({ open: false, card: null, newStatus: '' })}
            disabled={actionLoading}
            sx={{
              color: 'var(--bg-primary)',
              minWidth: 'auto',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              transition: 'var(--transition-all)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'scale(1.1)'
              },
              '&:disabled': {
                opacity: 0.5
              }
            }}
          >
            ✕
          </Button>
        </DialogTitle>
        <DialogContent sx={{ 
          padding: '28px !important',
          backgroundColor: 'var(--bg-primary)',
          fontFamily: 'var(--font-family)'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Học sinh"
              value={editDialog.card?.studentName || ''}
              disabled
              fullWidth
            />
            <TextField
              label="Mã thẻ"
              value={editDialog.card?.cardUid || ''}
              disabled
              fullWidth
            />
            <TextField
              select
              label="Trạng thái"
              value={editDialog.newStatus}
              onChange={(e) => setEditDialog(prev => ({ ...prev, newStatus: e.target.value }))}
              fullWidth
              disabled={actionLoading}
              SelectProps={{
                native: true
              }}
            >
              <option value="">Chọn trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={() => setEditDialog({ open: false, card: null, newStatus: '' })}
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 20px'
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 20px',
              background: 'var(--color-secondary)',
              fontWeight: 600,
              '&:hover': {
                background: 'var(--color-secondary-dark)'
              }
            }}
          >
            {actionLoading ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmColor="error"
      />
    </div>
  );
};

export default NfcCardManagement;
