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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  SwapHoriz as TransferIcon,
  Schedule as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  DoNotDisturb as CancelledIcon,
  Business as BranchIcon,
  School as SchoolIcon,
  Grade as LevelIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AnimatedCard from '../../../../components/Common/AnimatedCard';
import ContentLoading from '../../../../components/Common/ContentLoading';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog';
import branchTransferService from '../../../../services/branchTransfer.service';
import { useApp } from '../../../../contexts/AppContext';
import useContentLoading from '../../../../hooks/useContentLoading';
import { formatDateOnlyUTC7 } from '../../../../utils/dateHelper';

const TransferRequestDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();

  const [request, setRequest] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [documentDialog, setDocumentDialog] = useState({
    open: false,
    imageUrl: '',
    loading: false
  });

  useEffect(() => {
    if (id) {
      loadRequestDetail();
    }
  }, [id]);

  const loadRequestDetail = async () => {
    showLoading();
    try {
      const data = await branchTransferService.getMyTransferRequestById(id);
      setRequest(data);
    } catch (error) {
      showGlobalError('Không thể tải chi tiết yêu cầu chuyển nhánh');
    } finally {
      hideLoading();
    }
  };

  const handleCancelRequest = async () => {
    try {
      await branchTransferService.cancelTransferRequest(id);
      toast.success('Đã hủy yêu cầu chuyển nhánh thành công', {
        position: 'top-right',
        autoClose: 3000
      });
      loadRequestDetail(); // Reload the request
    } catch (error) {
      const message = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Không thể hủy yêu cầu';
      toast.error(message, { position: 'top-right', autoClose: 4000 });
    } finally {
      setCancelDialog(false);
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
        icon: <PendingIcon />,
        description: 'Yêu cầu đang chờ quản lý chi nhánh đích xem xét và duyệt'
      },
      Approved: {
        label: 'Đã duyệt',
        color: 'success',
        icon: <ApprovedIcon />,
        description: 'Yêu cầu đã được duyệt và đang được xử lý'
      },
      Rejected: {
        label: 'Từ chối',
        color: 'error',
        icon: <RejectedIcon />,
        description: 'Yêu cầu đã bị từ chối'
      },
      Cancelled: {
        label: 'Đã hủy',
        color: 'default',
        icon: <CancelledIcon />,
        description: 'Yêu cầu đã được hủy bởi bạn'
      }
    };
    return configs[status] || configs.Pending;
  };

  const canCancelRequest = request?.status === 'Pending';

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
              onClick={() => navigate('/user/branch-transfer/requests')}
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
                  <Typography variant="body2" color="text.secondary">
                    {statusConfig.description}
                  </Typography>
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

                <Divider sx={{ my: 3 }} />

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
            <AnimatedCard delay={0.3}>
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
                              {request.targetSchoolName || request.targetSchool?.schoolName || 'N/A'}
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

          {/* Reason and Document */}
          <Grid item xs={12}>
            <AnimatedCard delay={0.4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Lý do và tài liệu
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Lý do chuyển nhánh
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
          {canCancelRequest && (
            <Grid item xs={12}>
              <AnimatedCard delay={0.5}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => setCancelDialog(true)}
                      size="large"
                    >
                      Hủy yêu cầu chuyển nhánh
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                    Bạn chỉ có thể hủy yêu cầu khi nó đang ở trạng thái chờ duyệt
                  </Typography>
                </Paper>
              </AnimatedCard>
            </Grid>
          )}

          {/* Rejection Reason */}
          {request.status === 'Rejected' && request.rejectionReason && (
            <Grid item xs={12}>
              <AnimatedCard delay={0.6}>
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

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        onConfirm={handleCancelRequest}
        title="Xác nhận hủy yêu cầu"
        content="Bạn có chắc chắn muốn hủy yêu cầu chuyển nhánh này? Hành động này không thể hoàn tác."
        confirmText="Hủy yêu cầu"
        cancelText="Giữ lại"
        confirmColor="error"
      />

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

export default TransferRequestDetail;
