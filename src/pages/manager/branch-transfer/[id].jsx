import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Grid,
  Divider,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  SwapHoriz as TransferIcon,
  Schedule as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Business as BranchIcon,
  School as SchoolIcon,
  Grade as LevelIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  MonetizationOn as MoneyIcon,
  EventAvailable as SlotIcon,
  ShoppingCart as OrderIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AnimatedCard from '../../../components/Common/AnimatedCard';
import ContentLoading from '../../../components/Common/ContentLoading';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import branchTransferService from '../../../services/branchTransfer.service';
import schoolService from '../../../services/school.service';
import { useApp } from '../../../contexts/AppContext';
import useContentLoading from '../../../hooks/useContentLoading';
import { formatDateOnlyUTC7 } from '../../../utils/dateHelper';

const ManagerTransferRequestDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();

  const [request, setRequest] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [approveDialog, setApproveDialog] = useState({
    open: false,
    data: {
      autoCancelSubscriptions: false,
      autoCancelSlots: false,
      autoCancelOrders: false,
      approveOnlyIfNoConflicts: false,
      managerNotes: ''
    }
  });
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    reason: '',
    managerNotes: ''
  });
  const [documentDialog, setDocumentDialog] = useState({
    open: false,
    imageUrl: '',
    loading: false
  });

  const [schoolDetails, setSchoolDetails] = useState(null);
  const [loadingSchool, setLoadingSchool] = useState(false);

  useEffect(() => {
    if (id) {
      loadRequestDetail();
      loadConflicts();
    }
  }, [id]);

  // Load school details if needed
  useEffect(() => {
    const loadSchoolDetails = async () => {
      if (request?.targetSchoolId && request?.changeSchool && !request?.targetSchoolName && !schoolDetails) {
        try {
          setLoadingSchool(true);
          const schoolData = await schoolService.getSchoolById(request.targetSchoolId);
          setSchoolDetails(schoolData);
        } catch (error) {
        } finally {
          setLoadingSchool(false);
        }
      }
    };

    loadSchoolDetails();
  }, [request?.targetSchoolId, request?.changeSchool, request?.targetSchoolName, schoolDetails]);

  const loadRequestDetail = async () => {
    try {
      const data = await branchTransferService.getTransferRequestById(id);
      setRequest(data);
    } catch (error) {
      showGlobalError('Không thể tải chi tiết yêu cầu chuyển chi nhánh');
    }
  };

  const loadConflicts = async () => {
    try {
      const data = await branchTransferService.getTransferRequestConflicts(id);
      setConflicts(data);
    } catch (error) {
      // Conflicts might not be available, ignore silently
    }
  };

  const handleApprove = () => {
    // Different logic based on request status
    const isOldBranchApproval = request.status === 'Pending'; // Chi nhánh cũ duyệt
    const isNewBranchApproval = request.status === 'ReadyToTransfer'; // Chi nhánh mới duyệt

    setApproveDialog({
      open: true,
      data: {
        // Only show clear options for old branch approval
        autoCancelSubscriptions: isOldBranchApproval ? false : undefined,
        autoCancelSlots: isOldBranchApproval ? false : undefined,
        autoCancelOrders: isOldBranchApproval ? false : undefined,
        approveOnlyIfNoConflicts: isOldBranchApproval ? false : undefined,
        managerNotes: ''
      },
      isOldBranchApproval,
      isNewBranchApproval
    });
  };

  const handleReject = () => {
    setRejectDialog({
      open: true,
      reason: '',
      managerNotes: ''
    });
  };

  const confirmApprove = async () => {
    try {
      showLoading();

      // Format data to match API expectations
      const approvalData = {
        requestId: id, // Include requestId as shown in API docs
        autoCancelSubscriptions: Boolean(approveDialog.data.autoCancelSubscriptions),
        autoCancelSlots: Boolean(approveDialog.data.autoCancelSlots),
        autoCancelOrders: Boolean(approveDialog.data.autoCancelOrders),
        approveOnlyIfNoConflicts: Boolean(approveDialog.data.approveOnlyIfNoConflicts),
        managerNotes: approveDialog.data.managerNotes || ''
      };

      await branchTransferService.approveTransferRequest(id, approvalData);
      
      toast.success('Đã duyệt yêu cầu chuyển chi nhánh thành công', {
        position: 'top-right',
        autoClose: 3000
      });
      
      // Delay navigation to ensure toast is visible
      setTimeout(() => {
        navigate('/manager/branch-transfer');
      }, 1000);
    } catch (error) {
      // Handle different error types
      let errorMessage = 'Không thể duyệt yêu cầu';
      
      if (error?.response?.status === 401) {
        // 401 Unauthorized - likely business logic error (manager doesn't manage target branch)
        errorMessage = error?.response?.data?.message || 
                      'Bạn không có quyền duyệt yêu cầu này. Kiểm tra lại bạn có quản lý chi nhánh đích không.';
      } else {
        errorMessage = error?.response?.data?.detail ||
                      error?.response?.data?.message ||
                      error?.message ||
                      'Không thể duyệt yêu cầu';
      }
      
      toast.error(errorMessage, { position: 'top-right', autoClose: 4000 });
    } finally {
      hideLoading();
      setApproveDialog({ ...approveDialog, open: false });
    }
  };

  const confirmReject = async () => {
    if (!rejectDialog.reason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối', { position: 'top-right', autoClose: 3000 });
      return;
    }

    try {
      showLoading();

      const rejectionData = {
        requestId: id, // Include requestId as shown in API structure
        rejectionReason: rejectDialog.reason.trim(),
        managerNotes: rejectDialog.managerNotes || ''
      };

      await branchTransferService.rejectTransferRequest(id, rejectionData);
      
      toast.success('Đã từ chối yêu cầu chuyển chi nhánh', {
        position: 'top-right',
        autoClose: 3000
      });
      
      // Delay navigation to ensure toast is visible
      setTimeout(() => {
        navigate('/manager/branch-transfer');
      }, 1000);
    } catch (error) {
      // Handle different error types
      let errorMessage = 'Không thể từ chối yêu cầu';
      
      if (error?.response?.status === 401) {
        // 401 Unauthorized - likely business logic error (manager doesn't manage target branch)
        errorMessage = error?.response?.data?.message || 
                      'Bạn không có quyền từ chối yêu cầu này. Kiểm tra lại bạn có quản lý chi nhánh đích không.';
      } else {
        errorMessage = error?.response?.data?.detail ||
                      error?.response?.data?.message ||
                      error?.message ||
                      'Không thể từ chối yêu cầu';
      }
      
      toast.error(errorMessage, { position: 'top-right', autoClose: 4000 });
    } finally {
      hideLoading();
      setRejectDialog({ open: false, reason: '', managerNotes: '' });
    }
  };

  const handleViewDocument = async () => {
    if (!request?.documentId) return;

    setDocumentDialog({ open: true, imageUrl: '', loading: true });
    try {
      const response = await branchTransferService.getTransferDocumentImageUrl(request.documentId);
      setDocumentDialog({
        open: true,
        imageUrl: response.imageUrl,
        loading: false
      });
    } catch (error) {
      toast.error('Không thể tải tài liệu', { position: 'top-right', autoClose: 4000 });
      setDocumentDialog({ open: false, imageUrl: '', loading: false });
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      Pending: {
        label: 'Chờ duyệt',
        color: 'warning',
        icon: <PendingIcon />
      },
      Approved: {
        label: 'Đã duyệt',
        color: 'success',
        icon: <ApprovedIcon />
      },
      Rejected: {
        label: 'Từ chối',
        color: 'error',
        icon: <RejectedIcon />
      },
      Cancelled: {
        label: 'Đã hủy',
        color: 'default'
      }
    };
    return configs[status] || configs.Pending;
  };

  // Manager can approve if they manage the branch and request is in pending status
  // Use more permissive logic to ensure buttons show for testing
  const canApprove = (request?.canApprove || request?.canApprove === undefined) && (request?.status === 'Pending' || request?.status === 'ReadyToTransfer');
  const canReject = (request?.canApprove || request?.canApprove === undefined) && (request?.status === 'Pending' || request?.status === 'ReadyToTransfer');


  // Calculate counts from API response arrays
  const activeSubscriptionsCount = conflicts?.activeSubscriptions?.length || 0;
  const futureSlotsCount = conflicts?.futureSlots?.length || 0;
  const pendingOrdersCount = conflicts?.pendingOrders?.length || 0;

  const hasConflicts = conflicts && (
    activeSubscriptionsCount > 0 ||
    futureSlotsCount > 0 ||
    pendingOrdersCount > 0
  );

  const hasRefundInfo = conflicts?.estimatedRefundAmount !== undefined;

  if (!request) {
    return <ContentLoading isLoading={true} text="Đang tải chi tiết yêu cầu..." />;
  }

  const statusConfig = getStatusConfig(request.status);

  return (
    <>
      {isLoading && <ContentLoading isLoading={isLoading} text={loadingText} />}

      <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate('/manager/branch-transfer')}
              variant="outlined"
            >
              Quay lại
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TransferIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Chi tiết yêu cầu chuyển chi nhánh
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Yêu cầu #{request.id?.substring(0, 8)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Status Card */}
          <Grid item xs={12} md={4}>
            <AnimatedCard delay={0.1}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {statusConfig.icon}
                  </Box>
                  <Chip
                    label={statusConfig.label}
                    color={statusConfig.color}
                    size="large"
                    sx={{ mb: 2 }}
                  />
                  {canApprove && (
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      Bạn có thể duyệt yêu cầu này
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>
          </Grid>

          {/* Request Info */}
          <Grid item xs={12} md={8}>
            <AnimatedCard delay={0.2}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin yêu cầu
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <PersonIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Học sinh
                        </Typography>
                        <Typography variant="body1">
                          {request.studentName || request.student?.name || request.student?.userName || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <PersonIcon color="secondary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phụ huynh
                        </Typography>
                        <Typography variant="body1">
                          {request.requestedByName || request.parent?.name || request.parent?.userName || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CalendarIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Ngày tạo
                        </Typography>
                        <Typography variant="body1">
                          {formatDateOnlyUTC7(request.createdTime || request.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </AnimatedCard>
          </Grid>

          {/* Branch Transfer */}
          <Grid item xs={12}>
            <AnimatedCard delay={0.3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Chi nhánh chuyển
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <BranchIcon color="error" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Từ chi nhánh
                        </Typography>
                        <Typography variant="body1">
                          {request.currentBranchName || request.currentBranch?.branchName || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <BranchIcon color="success" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Đến chi nhánh
                        </Typography>
                        <Typography variant="body1">
                          {request.targetBranchName || request.targetBranch?.branchName || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </AnimatedCard>
          </Grid>

          {/* Changes */}
          <Grid item xs={12}>
            <AnimatedCard delay={0.4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thay đổi bổ sung
                </Typography>

                {(request.changeSchool || request.changeLevel) ? (
                  <Grid container spacing={2}>
                    {request.changeSchool && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <SchoolIcon color="info" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Trường học mới
                            </Typography>
                            <Typography variant="body1">
                              {request.targetSchoolName ||
                               request.targetSchool?.schoolName ||
                               schoolDetails?.schoolName ||
                               schoolDetails?.name ||
                               (loadingSchool ? 'Đang tải...' : 'N/A')}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}

                    {request.changeLevel && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <LevelIcon color="secondary" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Cấp độ mới
                            </Typography>
                            <Typography variant="body1">
                              {request.targetStudentLevelName || request.targetStudentLevel?.levelName || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    Không có thay đổi bổ sung. Chỉ chuyển chi nhánh.
                  </Alert>
                )}
              </Paper>
            </AnimatedCard>
          </Grid>

          {/* Conflicts */}
          {conflicts && (
            <Grid item xs={12}>
              <AnimatedCard delay={0.5}>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: hasConflicts ? 'warning.50' : 'success.50',
                      '&:hover': { backgroundColor: hasConflicts ? 'warning.100' : 'success.100' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {hasConflicts ? <WarningIcon color="warning" /> : <CheckIcon color="success" />}
                      <Typography variant="h6">
                        Xung đột cần xử lý {hasConflicts && `(${activeSubscriptionsCount + futureSlotsCount + pendingOrdersCount} items)`}
                        {hasRefundInfo && conflicts.estimatedRefundAmount > 0 && (
                          <Typography component="span" variant="body2" color="success.main" sx={{ ml: 1 }}>
                            (Hoàn tiền: {conflicts.estimatedRefundAmount?.toLocaleString('vi-VN')} VNĐ)
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {hasRefundInfo && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Quy tắc hoàn tiền:
                        </Typography>
                        <Typography variant="body2">
                          • Tự động tính toán dựa trên slots đã dùng và thời gian<br/>
                          • Ước tính số tiền hoàn lại: {conflicts.estimatedRefundAmount?.toLocaleString('vi-VN') || 0} VNĐ
                        </Typography>
                      </Alert>
                    )}
                    {hasConflicts ? (
                      <List>
                        {activeSubscriptionsCount > 0 && (
                          <ListItem>
                            <ListItemIcon>
                              <MoneyIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${activeSubscriptionsCount} gói dịch vụ đang hoạt động`}
                              secondary={
                                hasRefundInfo ? (
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      Dự kiến hoàn tiền: {conflicts.estimatedRefundAmount?.toLocaleString('vi-VN') || 0} VNĐ
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Chi tiết từng gói:
                                    </Typography>
                                    {conflicts.activeSubscriptions?.map((sub, index) => (
                                      <Typography key={index} variant="caption" component="div" color="text.secondary">
                                        • {sub.packageName}: {sub.priceFinal?.toLocaleString('vi-VN')} VNĐ ({sub.usedSlot}/{sub.totalSlots} slots)
                                      </Typography>
                                    ))}
                                  </Box>
                                ) : (
                                  'Sẽ bị hủy nếu chọn tự động xử lý'
                                )
                              }
                            />
                          </ListItem>
                        )}
                        {futureSlotsCount > 0 && (
                          <ListItem>
                            <ListItemIcon>
                              <SlotIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${futureSlotsCount} slot học tập sắp tới`}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Sẽ bị hủy nếu chọn tự động xử lý
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Chi tiết:
                                  </Typography>
                                  {conflicts.futureSlots?.slice(0, 3).map((slot, index) => (
                                    <Typography key={index} variant="caption" component="div" color="text.secondary">
                                      • {slot.timeframeName} - {slot.roomName} ({new Date(slot.date).toLocaleDateString('vi-VN')})
                                    </Typography>
                                  ))}
                                  {futureSlotsCount > 3 && (
                                    <Typography variant="caption" color="text.secondary">
                                      ... và {futureSlotsCount - 3} slot khác
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                        {pendingOrdersCount > 0 && (
                          <ListItem>
                            <ListItemIcon>
                              <OrderIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${pendingOrdersCount} đơn hàng đang xử lý`}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Sẽ bị hủy nếu chọn tự động xử lý
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Chi tiết:
                                  </Typography>
                                  {conflicts.pendingOrders?.slice(0, 2).map((order, index) => (
                                    <Typography key={index} variant="caption" component="div" color="text.secondary">
                                      • {order.itemCount} items - {order.totalAmount?.toLocaleString('vi-VN')} VNĐ ({new Date(order.createdDate).toLocaleDateString('vi-VN')})
                                    </Typography>
                                  ))}
                                  {pendingOrdersCount > 2 && (
                                    <Typography variant="caption" color="text.secondary">
                                      ... và {pendingOrdersCount - 2} đơn khác
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                      </List>
                    ) : (
                      <Alert severity="success">
                        Không có xung đột nào. Học sinh có thể chuyển chi nhánh ngay lập tức.
                      </Alert>
                    )}
                  </AccordionDetails>
                </Accordion>
              </AnimatedCard>
            </Grid>
          )}

          {/* Reason and Document */}
          <Grid item xs={12}>
            <AnimatedCard delay={0.6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Lý do và tài liệu
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Lý do chuyển chi nhánh
                    </Typography>
                    <Typography variant="body1">
                      {request.requestReason || 'Không có lý do cụ thể'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    {request.documentId ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Tài liệu hỗ trợ
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<DocumentIcon />}
                          onClick={handleViewDocument}
                          size="small"
                        >
                          Xem tài liệu
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Tài liệu hỗ trợ
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Không có tài liệu
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </AnimatedCard>
          </Grid>

          {/* Actions */}
          {/* Temporary: Always show for debugging */}
          {request && (
            <Grid item xs={12}>
              <AnimatedCard delay={0.7}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Thao tác
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    {canApprove && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleApprove}
                        size="large"
                      >
                        Duyệt yêu cầu
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleReject}
                        size="large"
                      >
                        Từ chối yêu cầu
                      </Button>
                    )}
                  </Box>
                </Paper>
              </AnimatedCard>
            </Grid>
          )}

          {/* Rejection Reason */}
          {request.status === 'Rejected' && request.rejectionReason && (
            <Grid item xs={12}>
              <AnimatedCard delay={0.8}>
                <Alert severity="error">
                  <Typography variant="subtitle2" gutterBottom>
                    Lý do từ chối:
                  </Typography>
                  <Typography variant="body2">
                    {request.rejectionReason}
                  </Typography>
                </Alert>
              </AnimatedCard>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ ...approveDialog, open: false })} maxWidth="md" fullWidth>
        <DialogTitle>
          {approveDialog.isOldBranchApproval ? 'Chi nhánh cũ duyệt yêu cầu' : 'Chi nhánh mới duyệt yêu cầu'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              {approveDialog.isOldBranchApproval
                ? 'Duyệt yêu cầu này sẽ clear tất cả package/slot của học sinh ở chi nhánh cũ và chuyển trạng thái "sẵn sàng để chuyển đi".'
                : 'Duyệt yêu cầu này sẽ thêm học sinh vào chi nhánh mới như một học sinh mới.'
              }
            </Typography>

            {hasConflicts && (
              <Alert severity="warning" sx={{ my: 2 }}>
                Có xung đột cần xử lý. Vui lòng chọn cách xử lý:
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {/* Only show clear options for old branch approval */}
                        {approveDialog.isOldBranchApproval && conflicts?.activeSubscriptionsCount > 0 && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={approveDialog.data.autoCancelSubscriptions}
                      onChange={(e) => setApproveDialog({
                        ...approveDialog,
                        data: { ...approveDialog.data, autoCancelSubscriptions: e.target.checked }
                      })}
                    />
                  }
                  label={
                    hasRefundInfo ?
                      `Tự động hủy ${activeSubscriptionsCount} gói dịch vụ và hoàn tiền (ước tính: ${conflicts.estimatedRefundAmount?.toLocaleString('vi-VN')} VNĐ)` :
                      `Tự động hủy ${activeSubscriptionsCount} gói dịch vụ và hoàn tiền`
                  }
                />
              )}

                        {conflicts?.futureSlotsCount > 0 && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={approveDialog.data.autoCancelSlots}
                      onChange={(e) => setApproveDialog({
                        ...approveDialog,
                        data: { ...approveDialog.data, autoCancelSlots: e.target.checked }
                      })}
                    />
                  }
                  label={`Tự động hủy ${futureSlotsCount} slot học tập sắp tới`}
                />
              )}

              {conflicts?.pendingOrdersCount > 0 && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={approveDialog.data.autoCancelOrders}
                      onChange={(e) => setApproveDialog({
                        ...approveDialog,
                        data: { ...approveDialog.data, autoCancelOrders: e.target.checked }
                      })}
                    />
                  }
                  label={`Tự động hủy ${pendingOrdersCount} đơn hàng đang xử lý`}
                />
              )}

              {hasConflicts && approveDialog.isOldBranchApproval && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={approveDialog.data.approveOnlyIfNoConflicts}
                      onChange={(e) => setApproveDialog({
                        ...approveDialog,
                        data: { ...approveDialog.data, approveOnlyIfNoConflicts: e.target.checked }
                      })}
                    />
                  }
                  label="Chỉ duyệt nếu không có xung đột"
                />
              )}

              <TextField
                label="Ghi chú của quản lý (tùy chọn)"
                multiline
                rows={3}
                value={approveDialog.data.managerNotes}
                onChange={(e) => setApproveDialog({
                  ...approveDialog,
                  data: { ...approveDialog.data, managerNotes: e.target.value }
                })}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ ...approveDialog, open: false })}>
            Hủy
          </Button>
          <Button onClick={confirmApprove} variant="contained" color="success">
            Duyệt yêu cầu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, reason: '', managerNotes: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Từ chối yêu cầu chuyển chi nhánh</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Lý do từ chối *"
              multiline
              rows={4}
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
              fullWidth
              required
              placeholder="Vui lòng nhập lý do từ chối yêu cầu chuyển chi nhánh..."
            />
            <TextField
              label="Ghi chú của quản lý (tùy chọn)"
              multiline
              rows={3}
              value={rejectDialog.managerNotes}
              onChange={(e) => setRejectDialog({ ...rejectDialog, managerNotes: e.target.value })}
              fullWidth
              placeholder="Thêm ghi chú nếu cần..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, reason: '', managerNotes: '' })}>
            Hủy
          </Button>
          <Button onClick={confirmReject} variant="contained" color="error">
            Từ chối yêu cầu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Dialog */}
      <Dialog
        open={documentDialog.open}
        onClose={() => setDocumentDialog({ open: false, imageUrl: '', loading: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Tài liệu hỗ trợ</DialogTitle>
        <DialogContent>
          {documentDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography>Đang tải tài liệu...</Typography>
            </Box>
          ) : documentDialog.imageUrl ? (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={documentDialog.imageUrl}
                alt="Tài liệu hỗ trợ"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          ) : (
            <Typography color="error">Không thể tải tài liệu</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialog({ open: false, imageUrl: '', loading: false })}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManagerTransferRequestDetail;
