import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ServiceIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ManagementFormDialog from '@components/Management/FormDialog';
import Form from '@components/Common/Form';
import ConfirmDialog from '@components/Common/ConfirmDialog';
import serviceService from '../../services/service.service';
import orderService from '../../services/order.service';
import studentService from '../../services/student.service';
import studentSlotService from '../../services/studentSlot.service';
import { useApp } from '../../contexts/AppContext';
import * as yup from 'yup';

const ServiceSelectionDialog = ({ open, onClose, childId, slotId }) => {
  const { showGlobalError, addNotification } = useApp();
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [orderForm, setOrderForm] = useState({
    childId: '',
    studentSlotId: '',
    quantity: 1
  });
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccessInfo, setOrderSuccessInfo] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [selectedWalletType, setSelectedWalletType] = useState(null);
  const [showConfirmPaymentDialog, setShowConfirmPaymentDialog] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [children, setChildren] = useState([]);
  const [studentSlots, setStudentSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Load services when dialog opens
  useEffect(() => {
    if (open && childId) {
      loadServices(childId);
      loadChildren();
      if (childId) {
        loadStudentSlots(childId);
      }
    } else {
      setServices([]);
      setServicesError(null);
    }
  }, [open, childId]);

  // Pre-fill order form when slotId is provided
  useEffect(() => {
    if (open && childId && slotId) {
      setOrderForm({
        childId: childId,
        studentSlotId: slotId,
        quantity: 1
      });
    }
  }, [open, childId, slotId]);

  const loadServices = async (studentId) => {
    if (!studentId) {
      setServices([]);
      return;
    }

    setIsLoadingServices(true);
    setServicesError(null);

    try {
      const response = await serviceService.getAddOnsForStudent(studentId);
      const items = Array.isArray(response) ? response : [];

      const mappedServices = items.map((service) => ({
        id: service.serviceId || service.id,
        name: service.name || 'Dịch vụ không tên',
        type: service.serviceType || 'Add-on',
        isActive: service.isActive !== false,
        description: service.description || service.desc || '',
        price: service.priceOverride ?? service.price ?? service.effectivePrice ?? 0,
        effectivePrice: service.effectivePrice ?? service.priceOverride ?? service.price ?? 0,
        priceOverride: service.priceOverride,
        benefits: service.benefits || [],
        note: service.note || '',
        // Image fields
        imageUrl: service.imageUrl || service.image || service.iconUrl || service.avatar || service.thumbnail || service.thumbnailUrl || null
      }));

      setServices(mappedServices);
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Không thể tải danh sách dịch vụ';
      setServicesError(errorMessage);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadChildren = async () => {
    try {
      const response = await studentService.getMyChildren();
      const items = Array.isArray(response) ? response : [];
      setChildren(items);
    } catch (err) {
      console.error('Error loading children:', err);
    }
  };

  const loadStudentSlots = async (studentId) => {
    if (!studentId) {
      setStudentSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    try {
      const response = await studentSlotService.getStudentSlots({
        pageIndex: 1,
        pageSize: 50,
        studentId: studentId,
        status: 'booked',
        upcomingOnly: true
      });

      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
          ? response.items
          : [];

      const mapped = items.map((slot) => ({
        id: slot.id,
        date: slot.date,
        status: slot.status,
        parentNote: slot.parentNote,
        branchSlotId: slot.branchSlotId,
        roomId: slot.roomId
      }));

      setStudentSlots(mapped);
    } catch (err) {
      console.error('Error loading student slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  // Helper to find image URL from service object
  const getServiceImageUrl = (service) => {
    const imageFields = ['imageUrl', 'image', 'iconUrl', 'avatar', 'thumbnail', 'thumbnailUrl'];
    for (const field of imageFields) {
      if (service[field] && typeof service[field] === 'string' && (service[field].startsWith('http://') || service[field].startsWith('https://'))) {
        return service[field];
      }
    }
    // Fallback: check all string fields for a URL
    for (const key in service) {
      if (typeof service[key] === 'string' && (service[key].startsWith('http://') || service[key].startsWith('https://'))) {
        return service[key];
      }
    }
    return null;
  };

  const handleOrderClick = (service) => {
    setSelectedService(service);
    setOrderForm({
      childId: childId || '',
      studentSlotId: slotId || '',
      quantity: 1
    });
    setShowOrderDialog(true);
  };

  const handleChildChange = (newChildId) => {
    setOrderForm((prev) => ({
      ...prev,
      childId: newChildId,
      studentSlotId: ''
    }));
    loadStudentSlots(newChildId);
  };

  const handleOrderSubmit = async (data) => {
    if (!selectedService) return;

    setIsOrdering(true);
    try {
      const response = await orderService.createOrder({
        studentSlotId: data.studentSlotId,
        items: [
          {
            serviceId: selectedService.id,
            quantity: data.quantity
          }
        ]
      });

      setOrderSuccessInfo({
        orderId: response?.orderId || response?.id,
        orderTotal:
          response?.totalAmount ||
          selectedService.effectivePrice * data.quantity,
        childName:
          children.find((child) => child.id === data.childId)?.name ||
          children.find((child) => child.id === data.childId)?.userName ||
          'Không tên'
      });
      setPaymentResult(null);
      setShowOrderDialog(false);
      setOrderForm({
        childId: childId || '',
        studentSlotId: slotId || '',
        quantity: 1
      });
      toast.success('Đặt dịch vụ thành công!', {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Không thể tạo đơn dịch vụ';
      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsOrdering(false);
    }
  };

  const orderSchema = yup.object().shape({
    childId: yup.string().required('Vui lòng chọn trẻ em'),
    studentSlotId: yup.string().when('childId', {
      is: (val) => val && val !== '',
      then: (schema) => schema.required('Vui lòng chọn lịch giữ trẻ đã đặt'),
      otherwise: (schema) => schema.nullable()
    }),
    quantity: yup.number().min(1, 'Số lượng phải lớn hơn 0').required('Vui lòng nhập số lượng')
  });

  const handleClose = () => {
    setServices([]);
    setServicesError(null);
    setShowOrderDialog(false);
    setSelectedService(null);
    setOrderSuccessInfo(null);
    setPaymentResult(null);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 'var(--radius-lg)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Mua dịch vụ bổ sung
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {isLoadingServices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : servicesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {servicesError}
            </Alert>
          ) : services.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ServiceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Chưa có dịch vụ bổ sung
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Không có dịch vụ bổ sung nào cho lịch giữ trẻ này.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {services.map((service) => {
                const serviceImageUrl = getServiceImageUrl(service);
                return (
                  <Grid item xs={12} sm={6} key={service.id}>
                    <Card
                      component={motion.div}
                      whileHover={{ y: -4 }}
                      sx={{
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-secondary)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                          {serviceImageUrl ? (
                            <Box
                              component="img"
                              src={serviceImageUrl}
                              alt={service.name}
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 'var(--radius-md)',
                                objectFit: 'cover',
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            />
                          ) : (
                            <ServiceIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                          )}
                          <Box flex={1}>
                            <Chip
                              label={service.type}
                              size="small"
                              sx={{ mb: 1 }}
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {service.name}
                            </Typography>
                            <Typography variant="h6" color="primary.main" fontWeight="bold">
                              {formatCurrency(service.effectivePrice)}
                            </Typography>
                          </Box>
                        </Box>

                        {service.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                            {service.description}
                          </Typography>
                        )}

                        {service.benefits && service.benefits.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            {service.benefits.slice(0, 3).map((benefit, index) => (
                              <Typography key={index} variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                ✓ {benefit.name || benefit}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        {service.isActive && (
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            startIcon={<ShoppingCartIcon />}
                            onClick={() => handleOrderClick(service)}
                            sx={{ mt: 'auto' }}
                          >
                            Mua dịch vụ
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} variant="outlined">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Dialog */}
      {/* Order Dialog */}
      <ManagementFormDialog
        open={showOrderDialog}
        onClose={() => {
          if (!isOrdering) {
            setShowOrderDialog(false);
            setSelectedService(null);
            setOrderForm({
              childId: childId || '',
              studentSlotId: slotId || '',
              quantity: 1
            });
          }
        }}
        mode="create"
        title="Mua dịch vụ"
        icon={ShoppingCartIcon}
        loading={isOrdering}
        maxWidth="md"
      >
        {selectedService && (
          <Box
            sx={{
              mb: 3,
              p: 3,
              backgroundColor: 'rgba(0, 123, 255, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(0, 123, 255, 0.1)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
              {selectedService.name}
            </Typography>
            <Chip
              label={`Giá: ${formatCurrency(selectedService.effectivePrice)}`}
              sx={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            />
          </Box>
        )}

        <Form
          key={`order-form-${orderForm.childId}-${orderForm.studentSlotId}-${studentSlots.length}`}
          schema={orderSchema}
          defaultValues={{
            childId: orderForm.childId || childId || '',
            studentSlotId: orderForm.studentSlotId || slotId || '',
            quantity: orderForm.quantity || 1
          }}
          onSubmit={handleOrderSubmit}
          submitText="Xác nhận mua"
          loading={isOrdering}
          disabled={isOrdering}
          fields={[
            {
              name: 'childId',
              label: 'Chọn trẻ em',
              type: 'select',
              required: true,
              placeholder: '-- Chọn trẻ em --',
              options:
                children.length > 0
                  ? children.map((child) => ({
                      value: child.id,
                      label: child.name || child.userName || 'Không tên'
                    }))
                  : [],
              onChange: (value) => {
                handleChildChange(value);
              },
              disabled: !!childId // Disable if childId is provided
            },
            {
              name: 'studentSlotId',
              label: 'Chọn lịch giữ trẻ',
              type: 'select',
              required: true,
              placeholder: '-- Chọn lịch giữ trẻ --',
              options:
                studentSlots.length > 0
                  ? studentSlots.map((slot) => ({
                      value: slot.id,
                      label: slot.date
                        ? new Date(slot.date).toLocaleDateString('vi-VN')
                        : 'Lịch giữ trẻ'
                    }))
                  : [],
              disabled: !!slotId || isLoadingSlots // Disable if slotId is provided
            },
            {
              name: 'quantity',
              label: 'Số lượng',
              type: 'number',
              required: true,
              min: 1,
              defaultValue: 1
            }
          ]}
        />
      </ManagementFormDialog>

      {/* Payment Dialog */}
      <ManagementFormDialog
        open={!!orderSuccessInfo}
        onClose={() => {
          setOrderSuccessInfo(null);
          setPaymentResult(null);
        }}
        mode="create"
        title="Thanh toán đơn hàng"
        icon={PaymentIcon}
        loading={false}
        maxWidth="sm"
      >
        {orderSuccessInfo && (
          <>
            <Box
              sx={{
                mb: 3,
                p: 3,
                backgroundColor: 'rgba(0, 123, 255, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(0, 123, 255, 0.1)'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: 'text.primary'
                }}
              >
                Đơn #{orderSuccessInfo.orderId}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1">
                  <strong>Tổng tiền:</strong> {formatCurrency(orderSuccessInfo.orderTotal)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Học sinh: {orderSuccessInfo.childName}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
              Chọn ví để thanh toán:
            </Typography>

            {paymentResult && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 2,
                  border: '1px solid rgba(76, 175, 80, 0.3)'
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Trạng thái:</strong> {paymentResult.status}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Số tiền đã trả:</strong> {formatCurrency(paymentResult.paidAmount)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Số dư còn lại:</strong> {formatCurrency(paymentResult.remainingBalance)}
                </Typography>
                <Typography variant="body2">
                  <strong>Tin nhắn:</strong> {paymentResult.message}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  setSelectedWalletType('Parent');
                  setShowConfirmPaymentDialog(true);
                }}
                disabled={isPaying || !!paymentResult}
                sx={{ flex: 1, minWidth: '120px' }}
              >
                Ví phụ huynh
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  setSelectedWalletType('Student');
                  setShowConfirmPaymentDialog(true);
                }}
                disabled={isPaying || !!paymentResult}
                sx={{ flex: 1, minWidth: '120px' }}
              >
                Ví trẻ em
              </Button>
            </Box>
          </>
        )}
      </ManagementFormDialog>

      {/* Confirm Payment Dialog */}
      <ConfirmDialog
        open={showConfirmPaymentDialog}
        onClose={() => {
          setShowConfirmPaymentDialog(false);
          setSelectedWalletType(null);
        }}
        onConfirm={async () => {
          if (!orderSuccessInfo || !selectedWalletType) return;

          setIsPaying(true);
          setShowConfirmPaymentDialog(false);

          try {
            const res = await orderService.payOrderWithWallet({
              orderId: orderSuccessInfo.orderId,
              walletType: selectedWalletType
            });
            setPaymentResult(res);
            addNotification({
              message: `Thanh toán từ ${
                selectedWalletType === 'Parent' ? 'ví phụ huynh' : 'ví học sinh'
              } thành công!`,
              severity: 'success'
            });
            setSelectedWalletType(null);
          } catch (err) {
            const errorMessage =
              typeof err === 'string'
                ? err
                : err?.message || err?.error || 'Thanh toán thất bại';
            showGlobalError(errorMessage);
            addNotification({
              message: errorMessage,
              severity: 'error'
            });
            setSelectedWalletType(null);
          } finally {
            setIsPaying(false);
          }
        }}
        title="Xác nhận thanh toán"
        description={`Bạn có chắc chắn muốn thanh toán đơn hàng #${
          orderSuccessInfo?.orderId
        } với số tiền ${
          orderSuccessInfo ? formatCurrency(orderSuccessInfo.orderTotal) : ''
        } từ ${
          selectedWalletType === 'Parent' ? 'ví phụ huynh' : 'ví học sinh'
        }?`}
        confirmText="Xác nhận thanh toán"
        cancelText="Hủy"
        confirmColor="primary"
        showWarningIcon={true}
      />
    </>
  );
};

export default ServiceSelectionDialog;

