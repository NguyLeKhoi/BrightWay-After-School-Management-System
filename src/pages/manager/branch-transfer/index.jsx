import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
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
import branchTransferService from '../../../services/branchTransfer.service';
import { useApp } from '../../../contexts/AppContext';
import useContentLoading from '../../../hooks/useContentLoading';
import { toast } from 'react-toastify';
import { formatDateOnlyUTC7 } from '../../../utils/dateHelper';

const ManagerTransferRequests = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();

  const [requests, setRequests] = useState([]);
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Incoming (target branch), 2: Outgoing (current branch)
  const [stats, setStats] = useState({
    all: 0,
    incoming: 0,
    outgoing: 0,
    pending: 0
  });


  useEffect(() => {
    loadRequests();
  }, []);

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

      // Calculate stats
      const stats = {
        all: requestsList.length,
        incoming: requestsList.filter(r => r.canApprove && r.status === 'Pending').length, // Chi nhánh cũ duyệt
        pending: requestsList.filter(r => r.canApprove && r.status === 'ReadyToTransfer').length, // Chi nhánh mới duyệt
        outgoing: requestsList.filter(r => !r.canApprove).length // Yêu cầu đã gửi
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
      case 1: // Chi nhánh cũ duyệt (clear data)
        return requests.filter(r => r.canApprove && r.status === 'Pending');
      case 2: // Chi nhánh mới duyệt (add student)
        return requests.filter(r => r.canApprove && r.status === 'ReadyToTransfer');
      case 3: // Yêu cầu đã gửi
        return requests.filter(r => !r.canApprove);
      default: // Tất cả
        return requests;
    }
  };

  const filteredRequests = useMemo(() => getFilteredRequests(), [requests, tabValue]);

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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TransferIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Quản lý chuyển chi nhánh
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Xem xét và duyệt các yêu cầu chuyển chi nhánh học sinh
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="h6" color="primary">{stats.all}</Typography>
            <Typography variant="body2" color="text.secondary">Tất cả</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="h6" color="warning.main">{stats.pending}</Typography>
            <Typography variant="body2" color="text.secondary">Chờ duyệt</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="h6" color="success.main">{stats.incoming}</Typography>
            <Typography variant="body2" color="text.secondary">Có thể duyệt</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="h6" color="info.main">{stats.outgoing}</Typography>
            <Typography variant="body2" color="text.secondary">Gửi đi</Typography>
          </Paper>
        </Box>

        {/* Tabs */}
        <AnimatedCard delay={0.1}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab
                label={
                  <Badge
                    badgeContent={stats.all}
                    color="primary"
                    max={999}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        height: '20px',
                        minWidth: '20px',
                        borderRadius: '10px',
                        transform: 'translate(12px, -6px)',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ pr: 2 }}>
                      Tất cả yêu cầu
                    </Typography>
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge
                    badgeContent={stats.incoming}
                    color="success"
                    max={999}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        height: '20px',
                        minWidth: '20px',
                        borderRadius: '10px',
                        transform: 'translate(12px, -6px)',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ pr: 2 }}>
                      Chi nhánh cũ duyệt
                    </Typography>
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge
                    badgeContent={stats.pending || 0}
                    color="warning"
                    max={999}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        height: '20px',
                        minWidth: '20px',
                        borderRadius: '10px',
                        transform: 'translate(12px, -6px)',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ pr: 2 }}>
                      Chi nhánh mới duyệt
                    </Typography>
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge
                    badgeContent={stats.outgoing}
                    color="info"
                    max={999}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        height: '20px',
                        minWidth: '20px',
                        borderRadius: '10px',
                        transform: 'translate(12px, -6px)',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ pr: 2 }}>
                      Yêu cầu đã gửi
                    </Typography>
                  </Badge>
                }
              />
            </Tabs>
          </Paper>
        </AnimatedCard>

        {/* Requests Table */}
        <AnimatedCard delay={0.2}>
          {filteredRequests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <TransferIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {tabValue === 1 ? 'Không có yêu cầu nào cần chi nhánh cũ duyệt' :
                 tabValue === 2 ? 'Không có yêu cầu nào cần chi nhánh mới duyệt' :
                 tabValue === 3 ? 'Không có yêu cầu nào đã gửi' :
                 'Không có yêu cầu chuyển chi nhánh nào'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Học sinh</strong></TableCell>
                    <TableCell><strong>Phụ huynh</strong></TableCell>
                    <TableCell><strong>Từ chi nhánh</strong></TableCell>
                    <TableCell><strong>Đến chi nhánh</strong></TableCell>
                    <TableCell><strong>Thay đổi</strong></TableCell>
                    <TableCell><strong>Ngày tạo</strong></TableCell>
                    <TableCell><strong>Trạng thái</strong></TableCell>
                    <TableCell><strong>Conflict</strong></TableCell>
                    <TableCell align="center"><strong>Thao tác</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {request.studentName || request.student?.name || request.student?.userName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.requestedByName || request.parent?.name || request.parent?.userName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.currentBranchName || request.currentBranch?.branchName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BranchIcon fontSize="small" color="success" />
                          <Typography variant="body2">
                            {request.targetBranchName || request.targetBranch?.branchName || 'N/A'}
                          </Typography>
                          {request.canApprove && (
                            <Chip label="Có thể duyệt" size="small" color="success" variant="outlined" />
                          )}
                        </Box>
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
                      <TableCell>
                        {hasConflicts(request) ? (
                          <Tooltip title={`Có ${request.activeSubscriptionsCount + request.futureSlotsCount + request.pendingOrdersCount} conflict`}>
                            <ConflictIcon color="warning" />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="success.main">
                            Không có
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => handleViewRequest(request.id)}
                              color="primary"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* Approve/Reject buttons moved to detail page */}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AnimatedCard>

      </Box>

    </>
  );
};

export default ManagerTransferRequests;
