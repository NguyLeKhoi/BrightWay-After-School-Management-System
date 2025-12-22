import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Typography,
  Button,
  Divider,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
  Checkbox,
  ListItemText,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import { 
  ArrowBack,
  LocalOffer,
  Description,
  AttachMoney,
  CheckCircle,
  Cancel,
  Business,
  Add,
  Remove,
  CheckBoxOutlineBlank,
  CheckBox as CheckBoxIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ContentLoading from '../../../../components/Common/ContentLoading';
import serviceService from '../../../../services/service.service';
import branchService from '../../../../services/branch.service';
import { useApp } from '../../../../contexts/AppContext';
import { getErrorMessage } from '../../../../utils/errorHandler';
import styles from './ServiceDetail.module.css';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allBranches, setAllBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Thiếu thông tin cần thiết');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const serviceData = await serviceService.getServiceById(id);
        setService(serviceData);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin dịch vụ';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, showGlobalError]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoadingBranches(true);
        const branches = await branchService.getAllBranches();
        setAllBranches(branches || []);
      } catch (err) {

        setAllBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    if (assignDialogOpen || unassignDialogOpen) {
      loadBranches();
    }
  }, [assignDialogOpen, unassignDialogOpen]);

  const handleBack = () => {
    navigate('/admin/services');
  };

  const handleOpenAssignDialog = () => {
    setSelectedBranches([]);
    setAssignDialogOpen(true);
  };

  const handleOpenUnassignDialog = () => {
    const assignedBranchIds = (service?.branches || []).map(b => b.id);
    setSelectedBranches(assignedBranchIds);
    setUnassignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedBranches([]);
  };

  const handleCloseUnassignDialog = () => {
    setUnassignDialogOpen(false);
    setSelectedBranches([]);
  };

  const handleAssignBranches = async () => {
    if (!id || selectedBranches.length === 0) {
      toast.error('Vui lòng chọn ít nhất một chi nhánh');
      return;
    }

    try {
      setActionLoading(true);
      await serviceService.assignServiceToBranches(id, selectedBranches);
      toast.success(`Đã gán dịch vụ vào ${selectedBranches.length} chi nhánh thành công!`);
      handleCloseAssignDialog();
      
      // Reload service data
      const serviceData = await serviceService.getServiceById(id);
      setService(serviceData);
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể gán dịch vụ vào chi nhánh';
      toast.error(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignBranches = async () => {
    if (!id || selectedBranches.length === 0) {
      toast.error('Vui lòng chọn ít nhất một chi nhánh');
      return;
    }

    try {
      setActionLoading(true);
      await serviceService.unassignServiceFromBranches(id, selectedBranches);
      toast.success(`Đã hủy gán dịch vụ khỏi ${selectedBranches.length} chi nhánh thành công!`);
      handleCloseUnassignDialog();
      
      // Reload service data
      const serviceData = await serviceService.getServiceById(id);
      setService(serviceData);
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể hủy gán dịch vụ khỏi chi nhánh';
      toast.error(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const assignedBranchIds = (service?.branches || []).map(b => b.id);
  const availableBranchesForAssign = allBranches.filter(b => !assignedBranchIds.includes(b.id));
  const assignedBranches = allBranches.filter(b => assignedBranchIds.includes(b.id));

  if (loading) {
    return (
      <ContentLoading isLoading={true} text="Đang tải thông tin dịch vụ..." />
    );
  }

  if (error || !service) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Quay lại
          </Button>
          <Alert severity="error">
            {error || 'Không tìm thấy thông tin dịch vụ'}
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <div className={styles.container}>
        {/* Header */}
        <Paper 
          elevation={0}
          sx={{
            padding: 3,
            marginBottom: 3,
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              variant="contained"
              sx={{
                borderRadius: 'var(--radius-lg)',
                textTransform: 'none',
                fontFamily: 'var(--font-family)',
                background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                boxShadow: 'var(--shadow-sm)',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                  boxShadow: 'var(--shadow-md)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Quay lại
            </Button>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                flex: 1
              }}
            >
              Chi tiết Dịch Vụ
            </Typography>
          </Box>
        </Paper>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Thông tin Dịch Vụ
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Image */}
              {service.image && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      src={service.image}
                      alt={service.name || 'Service'}
                      sx={{ width: 80, height: 80 }}
                      variant="rounded"
                    >
                      <LocalOffer />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Hình Ảnh
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hình ảnh dịch vụ
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Name */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <LocalOffer sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Tên Dịch Vụ
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {service.name || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Description */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Description sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Mô Tả
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ whiteSpace: 'pre-wrap' }}>
                    {service.description || 'Chưa có mô tả'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Service Type */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <LocalOffer sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Loại Dịch Vụ
                  </Typography>
                  <Chip
                    label={service.serviceType || 'N/A'}
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Divider />

              {/* Price */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <AttachMoney sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Giá
                  </Typography>
                  <Typography variant="h6" fontWeight="medium" color="primary">
                    {service.price !== null && service.price !== undefined 
                      ? new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(service.price)
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Stock */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <LocalOffer sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Tồn kho
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {service.stock !== null && service.stock !== undefined ? service.stock : 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Status */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {service.status ? (
                  <CheckCircle sx={{ color: 'success.main', fontSize: 24, mt: 0.5 }} />
                ) : (
                  <Cancel sx={{ color: 'error.main', fontSize: 24, mt: 0.5 }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    Trạng Thái
                  </Typography>
                  <Chip
                    label={service.status ? 'Hoạt động' : 'Không hoạt động'}
                    color={service.status ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Branches Card */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Chi Nhánh Được Gán
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<Add />}
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleOpenAssignDialog}
                  sx={{ textTransform: 'none' }}
                >
                  Gán Chi Nhánh
                </Button>
                {assignedBranchIds.length > 0 && (
                  <Button
                    startIcon={<Remove />}
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleOpenUnassignDialog}
                    sx={{ textTransform: 'none' }}
                  >
                    Hủy Gán
                  </Button>
                )}
              </Box>
            </Box>

            {service?.branches && service.branches.length > 0 ? (
              <Grid container spacing={2}>
                {service.branches.map((branch) => (
                  <Grid item xs={12} sm={6} md={4} key={branch.id}>
                    <Chip
                      icon={<Business />}
                      label={branch.branchName || branch.name || 'N/A'}
                      color="primary"
                      variant="outlined"
                      sx={{ width: '100%', justifyContent: 'flex-start' }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                Dịch vụ chưa được gán vào chi nhánh nào. Nhấn "Gán Chi Nhánh" để thêm.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Assign Branches Dialog */}
        <Dialog
          open={assignDialogOpen}
          onClose={handleCloseAssignDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Gán Dịch Vụ Vào Chi Nhánh
          </DialogTitle>
          <DialogContent>
            {loadingBranches ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Chọn các chi nhánh để gán dịch vụ này vào:
                </Typography>
                <Autocomplete
                  multiple
                  options={availableBranchesForAssign}
                  getOptionLabel={(option) => option.branchName || option.name || 'N/A'}
                  value={allBranches.filter(b => selectedBranches.includes(b.id))}
                  onChange={(event, newValue) => {
                    setSelectedBranches(newValue.map(b => b.id));
                  }}
                  disableCloseOnSelect
                  renderOption={(props, option) => {
                    const isSelected = selectedBranches.includes(option.id);
                    return (
                      <Box component="li" {...props}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlank />}
                          checkedIcon={<CheckBoxIcon />}
                          checked={isSelected}
                        />
                        <ListItemText
                          primary={option.branchName || option.name || 'N/A'}
                          secondary={option.address || 'Không có địa chỉ'}
                        />
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Tìm và chọn chi nhánh..."
                      variant="outlined"
                    />
                  )}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Đã chọn: <strong>{selectedBranches.length}</strong> chi nhánh
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssignDialog} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleAssignBranches}
              variant="contained"
              color="primary"
              disabled={actionLoading || selectedBranches.length === 0}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Gán'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Unassign Branches Dialog */}
        <Dialog
          open={unassignDialogOpen}
          onClose={handleCloseUnassignDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Hủy Gán Dịch Vụ Khỏi Chi Nhánh
          </DialogTitle>
          <DialogContent>
            {loadingBranches ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Chọn các chi nhánh để hủy gán dịch vụ này:
                </Typography>
                <Autocomplete
                  multiple
                  options={assignedBranches}
                  getOptionLabel={(option) => option.branchName || option.name || 'N/A'}
                  value={allBranches.filter(b => selectedBranches.includes(b.id))}
                  onChange={(event, newValue) => {
                    setSelectedBranches(newValue.map(b => b.id));
                  }}
                  disableCloseOnSelect
                  renderOption={(props, option) => {
                    const isSelected = selectedBranches.includes(option.id);
                    return (
                      <Box component="li" {...props}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlank />}
                          checkedIcon={<CheckBoxIcon />}
                          checked={isSelected}
                        />
                        <ListItemText
                          primary={option.branchName || option.name || 'N/A'}
                          secondary={option.address || 'Không có địa chỉ'}
                        />
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Tìm và chọn chi nhánh..."
                      variant="outlined"
                    />
                  )}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Đã chọn: <strong>{selectedBranches.length}</strong> chi nhánh
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUnassignDialog} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleUnassignBranches}
              variant="contained"
              color="error"
              disabled={actionLoading || selectedBranches.length === 0}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Hủy Gán'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default ServiceDetail;


