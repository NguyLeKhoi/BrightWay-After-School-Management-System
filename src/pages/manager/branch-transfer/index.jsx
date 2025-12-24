import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Alert,
  Button
} from '@mui/material';
import {
  Visibility as ViewIcon,
  SwapHoriz as TransferIcon,
  Schedule as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Business as BranchIcon,
  Warning as ConflictIcon
} from '@mui/icons-material';
import AnimatedCard from '../../../components/Common/AnimatedCard';
import ContentLoading from '../../../components/Common/ContentLoading';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import DataTable from '../../../components/Common/DataTable';
import branchTransferService from '../../../services/branchTransfer.service';
import { useApp } from '../../../contexts/AppContext';
import useContentLoading from '../../../hooks/useContentLoading';
import { toast } from 'react-toastify';
import { formatDateOnlyUTC7 } from '../../../utils/dateHelper';
import userService from '../../../services/user.service';

const ManagerTransferRequests = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [requests, setRequests] = useState([]);
  const [managerBranchId, setManagerBranchId] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Từ chi nhánh (old branch), 2: Đến chi nhánh (new branch)
  const [stats, setStats] = useState({
    all: 0,
    incoming: 0,
    pending: 0
  });


  useEffect(() => {
    loadManagerBranch();
    loadRequests();
  }, []);

  const loadManagerBranch = async () => {
    try {
      const currentUser = await userService.getCurrentUser();
      const branchId = currentUser?.managerProfile?.branchId || currentUser?.branchId;
      setManagerBranchId(branchId);
    } catch (error) {
      showGlobalError('Không thể xác định chi nhánh của quản lý');
    }
  };

  const loadRequests = async () => {
    showLoading();
    try {
      const response = await branchTransferService.getAllTransferRequests({
        pageIndex: 1,
        pageSize: 100 // Load more for manager view
      });

      const requestsList = Array.isArray(response)
        ? response
        : (Array.isArray(response?.items) ? response.items : []);

      setRequests(requestsList);

      // Calculate stats - filter by manager's branch
      const stats = {
        all: requestsList.length,
        // Chi nhánh cũ duyệt: where manager's branch is the current/from branch AND status !== 'ReadyToTransfer'
        incoming: requestsList.filter(r => r.currentBranchId === managerBranchId && r.status !== 'ReadyToTransfer').length,
        // Chi nhánh mới duyệt: where manager's branch is the target/to branch AND status === 'ReadyToTransfer'
        pending: requestsList.filter(r => r.targetBranchId === managerBranchId && r.status === 'ReadyToTransfer').length
      };
      setStats(stats);
    } catch (error) {
      showGlobalError('Không thể tải danh sách yêu cầu chuyển chi nhánh');
    } finally {
      hideLoading();
    }
  };

  const handleViewRequest = (requestId) => {
    navigate(`/manager/branch-transfer/${requestId}`);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };



  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      Pending: { label: 'Chờ duyệt (CN cũ)', color: 'warning', icon: <PendingIcon /> },
      ReadyToTransfer: { label: 'Sẵn sàng chuyển', color: 'info', icon: <PendingIcon /> },
      Approved: { label: 'Đã duyệt', color: 'success', icon: <ApprovedIcon /> },
      Rejected: { label: 'Từ chối', color: 'error', icon: <RejectedIcon /> },
      Cancelled: { label: 'Đã hủy', color: 'default' }
    };

    const config = statusConfig[status] || statusConfig.Pending;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="outlined"
      />
    );
  };

  const getFilteredRequests = () => {
    switch (tabValue) {
      case 1: // Chi nhánh cũ duyệt - manager manages the from branch AND status is NOT 'ReadyToTransfer'
        return requests.filter(r => r.currentBranchId === managerBranchId && r.status !== 'ReadyToTransfer');
      case 2: // Chi nhánh mới duyệt - manager manages the to branch AND status === 'ReadyToTransfer'
        return requests.filter(r => r.targetBranchId === managerBranchId && r.status === 'ReadyToTransfer');
      default: // Tất cả
        return requests;
    }
  };

  const filteredRequests = useMemo(() => getFilteredRequests(), [requests, tabValue, managerBranchId]);

  const hasConflicts = (request) => {
    return (request.activeSubscriptionsCount > 0 ||
            request.futureSlotsCount > 0 ||
            request.pendingOrdersCount > 0);
  };

  return (
    <>
      {isLoading && <ContentLoading isLoading={isLoading} text={loadingText} />}

      <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <TransferIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                Quản lý chuyển chi nhánh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Xem xét và duyệt các yêu cầu chuyển chi nhánh học sinh
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards removed per request */}

        {/* Tabs */}
        <AnimatedCard delay={0.1}>
          <Paper sx={{ mb: 3, borderRadius: 3, boxShadow: 1, px: 1 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              TabIndicatorProps={{ style: { height: 3, borderRadius: 3 } }}
            >
              <Tab
                sx={{ textTransform: 'none', minHeight: 64, py: 1, fontWeight: tabValue === 0 ? 700 : 500, color: tabValue === 0 ? 'primary.main' : 'text.secondary' }}
                label={<Typography variant="body1" sx={{ pr: 2 }}>Tất cả yêu cầu</Typography>}
              />
              <Tab
                sx={{ textTransform: 'none', minHeight: 64, py: 1, fontWeight: tabValue === 1 ? 700 : 500, color: tabValue === 1 ? 'primary.main' : 'text.secondary' }}
                label={<Typography variant="body1" sx={{ pr: 2 }}>Chi nhánh cũ duyệt</Typography>}
              />
              <Tab
                sx={{ textTransform: 'none', minHeight: 64, py: 1, fontWeight: tabValue === 2 ? 700 : 500, color: tabValue === 2 ? 'primary.main' : 'text.secondary' }}
                label={<Typography variant="body1" sx={{ pr: 2 }}>Chi nhánh mới duyệt</Typography>}
              />
            </Tabs>
          </Paper>
        </AnimatedCard>

        {/* Requests Table (DataTable) */}
        <AnimatedCard delay={0.2}>
          <DataTable
            data={filteredRequests}
            columns={[
              {
                key: 'studentName',
                header: 'Học sinh',
                render: (_, item) => (
                  <Typography variant="body2">{item.studentName || item.student?.name || item.student?.userName || 'N/A'}</Typography>
                )
              },
              {
                key: 'parentName',
                header: 'Phụ huynh',
                render: (_, item) => (
                  <Typography variant="body2">{item.requestedByName || item.parent?.name || item.parent?.userName || 'N/A'}</Typography>
                )
              },
              {
                key: 'fromBranch',
                header: 'Từ chi nhánh',
                render: (_, item) => (
                  <Typography variant="body2">{item.currentBranchName || item.currentBranch?.branchName || 'N/A'}</Typography>
                )
              },
              {
                key: 'toBranch',
                header: 'Đến chi nhánh',
                render: (_, item) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BranchIcon fontSize="small" color="success" />
                    <Typography variant="body2">{item.targetBranchName || item.targetBranch?.branchName || 'N/A'}</Typography>
                    {item.canApprove && (
                      <Chip label="Có thể duyệt" size="small" color="success" variant="outlined" />
                    )}
                  </Box>
                )
              },
              {
                key: 'changes',
                header: 'Thay đổi',
                render: (_, item) => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {item.changeSchool && (
                      <Chip label="Trường học" size="small" color="info" variant="outlined" />
                    )}
                    {item.changeLevel && (
                      <Chip label="Cấp độ" size="small" color="secondary" variant="outlined" />
                    )}
                    {!item.changeSchool && !item.changeLevel && (
                      <Typography variant="caption" color="text.secondary">Chỉ chuyển chi nhánh</Typography>
                    )}
                  </Box>
                )
              },
              {
                key: 'createdTime',
                header: 'Ngày tạo',
                render: (_, item) => (
                  <Typography variant="body2">{formatDateOnlyUTC7(item.createdTime || item.createdAt)}</Typography>
                )
              },
              {
                key: 'status',
                header: 'Trạng thái',
                render: (_, item) => getStatusChip(item.status)
              },
              {
                key: 'conflict',
                header: 'Conflict',
                render: (_, item) => (
                  hasConflicts(item) ? (
                    <Tooltip title={`Có ${item.activeSubscriptionsCount + item.futureSlotsCount + item.pendingOrdersCount} conflict`}>
                      <ConflictIcon color="warning" />
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="success.main">Không có</Typography>
                  )
                )
              }
            ]}
            loading={isLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={filteredRequests.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onView={(item) => handleViewRequest(item.id)}
            emptyMessage={
              tabValue === 1 ? 'Không có yêu cầu nào cần chi nhánh cũ duyệt' :
              tabValue === 2 ? 'Không có yêu cầu nào cần chi nhánh mới duyệt' :
              'Không có yêu cầu chuyển chi nhánh nào'
            }
            showActions={true}
          />
        </AnimatedCard>

      </Box>

    </>
  );
};

export default ManagerTransferRequests;
