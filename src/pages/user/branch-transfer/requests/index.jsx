import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  SwapHoriz as TransferIcon,
  Schedule as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  DoNotDisturb as CancelledIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AnimatedCard from '../../../../components/Common/AnimatedCard';
import ContentLoading from '../../../../components/Common/ContentLoading';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog';
import branchTransferService from '../../../../services/branchTransfer.service';
import { useApp } from '../../../../contexts/AppContext';
import useContentLoading from '../../../../hooks/useContentLoading';
import { formatDateOnlyUTC7 } from '../../../../utils/dateHelper';

const TransferRequestsList = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();

  const [requests, setRequests] = useState([]);
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    request: null
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    showLoading();
    try {
      const response = await branchTransferService.getMyTransferRequests({
        pageIndex: 1,
        pageSize: 50 // Load all requests for parent
      });

      const requestsList = Array.isArray(response)
        ? response
        : (Array.isArray(response?.items) ? response.items : []);

      setRequests(requestsList);
    } catch (error) {
      showGlobalError('Không thể tải danh sách yêu cầu chuyển chi nhánh');
    } finally {
      hideLoading();
    }
  };

  const handleCreateRequest = () => {
    navigate('/user/branch-transfer/request');
  };

  const handleViewRequest = (requestId) => {
    navigate(`/user/branch-transfer/requests/${requestId}`);
  };

  const handleCancelRequest = (request) => {
    setCancelDialog({
      open: true,
      request
    });
  };

  const confirmCancelRequest = async () => {
    if (!cancelDialog.request) return;

    try {
      await branchTransferService.cancelTransferRequest(cancelDialog.request.id);
      toast.success('Đã hủy yêu cầu chuyển chi nhánh thành công', {
        position: 'top-right',
        autoClose: 3000
      });
      loadRequests(); // Reload the list
    } catch (error) {
      const message = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Không thể hủy yêu cầu';
      toast.error(message, { position: 'top-right', autoClose: 4000 });
    } finally {
      setCancelDialog({ open: false, request: null });
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      Pending: { label: 'Chờ duyệt', color: 'warning', icon: <PendingIcon /> },
      Approved: { label: 'Đã duyệt', color: 'success', icon: <ApprovedIcon /> },
      Rejected: { label: 'Từ chối', color: 'error', icon: <RejectedIcon /> },
      Cancelled: { label: 'Đã hủy', color: 'default', icon: <CancelledIcon /> }
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

  const canCancelRequest = (request) => {
    return request.status === 'Pending';
  };

  return (
    <>
      {isLoading && <ContentLoading isLoading={isLoading} text={loadingText} />}

      <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TransferIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Yêu cầu chuyển chi nhánh
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Quản lý các yêu cầu chuyển chi nhánh của con
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRequest}
              sx={{ minWidth: 200 }}
            >
              Tạo yêu cầu mới
            </Button>
          </Box>
        </Box>

        {/* Requests Table */}
        <AnimatedCard delay={0.2}>
          {requests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <TransferIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Chưa có yêu cầu chuyển chi nhánh nào
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Bắt đầu bằng cách tạo yêu cầu chuyển chi nhánh cho con của bạn
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateRequest}
              >
                Tạo yêu cầu đầu tiên
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Con</strong></TableCell>
                    <TableCell><strong>Từ chi nhánh</strong></TableCell>
                    <TableCell><strong>Đến chi nhánh</strong></TableCell>
                    <TableCell><strong>Thay đổi</strong></TableCell>
                    <TableCell><strong>Ngày tạo</strong></TableCell>
                    <TableCell><strong>Trạng thái</strong></TableCell>
                    <TableCell align="center"><strong>Thao tác</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {request.studentName || request.student?.name || request.student?.userName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.currentBranchName || request.currentBranch?.branchName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.targetBranchName || request.targetBranch?.branchName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {request.changeSchool && (
                            <Chip label="Trường học" size="small" color="info" variant="outlined" />
                          )}
                          {request.changeLevel && (
                            <Chip label="Cấp độ" size="small" color="secondary" variant="outlined" />
                          )}
                          {!request.changeSchool && !request.changeLevel && (
                            <Typography variant="caption" color="text.secondary">
                              Chỉ chuyển chi nhánh
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateOnlyUTC7(request.createdTime || request.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(request.status)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => handleViewRequest(request.id)}
                              color="primary"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canCancelRequest(request) && (
                            <Tooltip title="Hủy yêu cầu">
                              <IconButton
                                size="small"
                                onClick={() => handleCancelRequest(request)}
                                color="error"
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AnimatedCard>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Lưu ý:</strong> Bạn chỉ có thể hủy yêu cầu khi nó đang ở trạng thái "Chờ duyệt".
            Sau khi được duyệt, yêu cầu sẽ được xử lý tự động và không thể hủy.
          </Typography>
        </Alert>
      </Box>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, request: null })}
        onConfirm={confirmCancelRequest}
        title="Xác nhận hủy yêu cầu"
        content={
          cancelDialog.request ? (
            <Typography>
              Bạn có chắc chắn muốn hủy yêu cầu chuyển chi nhánh của{' '}
              <strong>{cancelDialog.request.studentName || cancelDialog.request.student?.name || cancelDialog.request.student?.userName}</strong>{' '}
              từ <strong>{cancelDialog.request.currentBranchName || cancelDialog.request.currentBranch?.branchName}</strong>{' '}
              sang <strong>{cancelDialog.request.targetBranchName || cancelDialog.request.targetBranch?.branchName}</strong>?
            </Typography>
          ) : (
            'Bạn có chắc chắn muốn hủy yêu cầu này?'
          )
        }
        confirmText="Hủy yêu cầu"
        cancelText="Giữ lại"
        confirmColor="error"
      />
    </>
  );
};

export default TransferRequestsList;
