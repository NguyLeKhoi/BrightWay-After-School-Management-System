import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Receipt as ServiceIcon, ShoppingCart as ShoppingCartIcon, Payment as PaymentIcon } from '@mui/icons-material';
import { Box, Typography, Chip, Button, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import ContentLoading from '@components/Common/ContentLoading';
import AnimatedCard from '../../../components/Common/AnimatedCard';
import ManagementFormDialog from '@components/Management/FormDialog';
import ConfirmDialog from '@components/Common/ConfirmDialog';
import Form from '@components/Common/Form';
import { useApp } from '../../../contexts/AppContext';
import serviceService from '../../../services/service.service';
import orderService from '../../../services/order.service';
import studentService from '../../../services/student.service';
import studentSlotService from '../../../services/studentSlot.service';
import * as yup from 'yup';
import styles from './Services.module.css';

const UserServices = () => {
  const location = useLocation();
  const isInitialMount = useRef(true);
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
  const [childrenError, setChildrenError] = useState(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [studentSlots, setStudentSlots] = useState([]);
  const [slotsError, setSlotsError] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  // Filter states
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');

  const { showGlobalError, addNotification } = useApp();


  useEffect(() => {
    loadChildren();
  }, []);

  // Prefill child and slot from query params when navigating from schedule confirmation
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const childIdFromQuery = params.get('childId');
      const slotIdFromQuery = params.get('slotId');

      if (childIdFromQuery) {
        setSelectedChildId(childIdFromQuery);
      }
      if (slotIdFromQuery) {
        setSelectedSlotId(slotIdFromQuery);
      }
    } catch (e) {
      // ignore invalid query params
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (selectedChildId) {
      loadStudentSlots(selectedChildId);
    } else {
      setStudentSlots([]);
      setSelectedSlotId('');
    }
  }, [selectedChildId]);

  useEffect(() => {
    if (selectedChildId) {
      loadServices(selectedChildId, selectedSlotId);
    } else {
      setServices([]);
    }
  }, [selectedChildId, selectedSlotId]);

  // Reload data when navigate back to this page
  useEffect(() => {
    if (location.pathname === '/user/services') {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      if (selectedChildId) {
        loadServices(selectedChildId, selectedSlotId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const loadServices = async (childId, slotId = null) => {
    if (!childId) {
      setServices([]);
      return;
    }

    setIsLoadingServices(true);
    setServicesError(null);

    try {
      // Get add-ons for the selected child
      const response = await serviceService.getAddOnsForStudent(childId);
      const items = Array.isArray(response) ? response : [];
      
      // If slotId is provided, filter services that are available for that slot
      // For now, we'll show all services for the child
      // Backend should handle slot-specific filtering if needed

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
        note: service.note || ''
      }));

      setServices(mappedServices);
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Không thể tải danh sách dịch vụ';

      setServicesError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const handleOrderClick = (service) => {
    setSelectedService(service);
    // Pre-fill with selected child and slot from filter
    const preFilledChildId = selectedChildId || '';
    const preFilledSlotId = selectedSlotId || '';
    
    setOrderForm({
      childId: preFilledChildId,
      studentSlotId: preFilledSlotId,
      quantity: 1
    });
    setShowOrderDialog(true);
    
    // If children not loaded yet, load them
    if (children.length === 0) {
      loadChildren();
    }
    
    // If slots not loaded for selected child, load them
    if (preFilledChildId && studentSlots.length === 0) {
      loadStudentSlots(preFilledChildId);
    }
  };

  const loadChildren = async () => {
    setIsLoadingChildren(true);
    setChildrenError(null);
    try {
      const response = await studentService.getMyChildren();
      const items = Array.isArray(response) ? response : [];
      setChildren(items);
    } catch (err) {
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Không thể tải danh sách con';
      setChildrenError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const loadStudentSlots = async (childId) => {
    if (!childId) {
      setStudentSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    setSlotsError(null);
    try {
      const response = await studentSlotService.getStudentSlots({
        pageIndex: 1,
        pageSize: 50,
        studentId: childId,
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
      const errorMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Không thể tải lịch giữ trẻ đã đặt';
      setSlotsError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleChildChange = (childId) => {
    setOrderForm((prev) => ({
      ...prev,
      childId,
      studentSlotId: ''
    }));
    loadStudentSlots(childId);
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
        childId: '',
        studentSlotId: '',
        quantity: 1
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

  return (
    <motion.div 
      className={styles.servicesPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dịch vụ bổ sung</h1>
            <p className={styles.subtitle}>
              Chọn trẻ em và lịch giữ trẻ để xem dịch vụ phù hợp
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <Paper 
          elevation={1}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <FormControl sx={{ minWidth: 200, flex: 1 }}>
              <InputLabel id="child-select-label">Chọn trẻ em</InputLabel>
              <Select
                labelId="child-select-label"
                id="child-select"
                value={selectedChildId}
                label="Chọn trẻ em"
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  setSelectedSlotId('');
                }}
                disabled={isLoadingChildren}
              >
                {children.length === 0 && !isLoadingChildren && (
                  <MenuItem disabled value="">
                    Chưa có trẻ em
                  </MenuItem>
                )}
                {isLoadingChildren && (
                  <MenuItem disabled value="">
                    Đang tải...
                  </MenuItem>
                )}
                {children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    {child.name || child.userName || 'Không tên'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200, flex: 1 }} disabled={!selectedChildId || isLoadingSlots}>
              <InputLabel id="slot-select-label">Chọn lịch giữ trẻ</InputLabel>
              <Select
                labelId="slot-select-label"
                id="slot-select"
                value={selectedSlotId}
                label="Chọn lịch giữ trẻ"
                onChange={(e) => setSelectedSlotId(e.target.value)}
                disabled={!selectedChildId || isLoadingSlots || studentSlots.length === 0}
              >
                {!selectedChildId && (
                  <MenuItem disabled value="">
                    Vui lòng chọn trẻ em trước
                  </MenuItem>
                )}
                {selectedChildId && isLoadingSlots && (
                  <MenuItem disabled value="">
                    Đang tải lịch giữ trẻ...
                  </MenuItem>
                )}
                {selectedChildId && !isLoadingSlots && studentSlots.length === 0 && (
                  <MenuItem disabled value="">
                    Chưa có lịch giữ trẻ nào
                  </MenuItem>
                )}
                {studentSlots.map((slot) => (
                  <MenuItem key={slot.id} value={slot.id}>
                    {new Date(slot.date).toLocaleString('vi-VN')} · {slot.status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {!selectedChildId ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ServiceIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            </div>
            <h3>Chọn trẻ em để xem dịch vụ</h3>
            <p>Vui lòng chọn trẻ em ở trên để xem danh sách dịch vụ bổ sung phù hợp.</p>
          </div>
        ) : !selectedSlotId ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ServiceIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            </div>
            <h3>Chọn lịch giữ trẻ để xem dịch vụ</h3>
            <p>Vui lòng chọn lịch giữ trẻ ở trên để xem dịch vụ bổ sung cho slot đó.</p>
          </div>
        ) : isLoadingServices ? (
          <div className={styles.inlineLoading}>
            <ContentLoading isLoading={true} text="Đang tải dịch vụ..." />
          </div>
        ) : servicesError ? (
          <div className={styles.errorState}>
            <p>{servicesError}</p>
            <button className={styles.retryButton} onClick={() => loadServices(selectedChildId, selectedSlotId)}>
              Thử lại
            </button>
          </div>
        ) : services.length > 0 ? (
          <div className={styles.servicesGrid}>
            {services.map((service) => (
              <div key={service.id || service.name} className={styles.serviceCard}>
                <div className={styles.serviceHeader}>
                  <div>
                    <p className={styles.serviceType}>{service.type}</p>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                  </div>
                  <span
                    className={`${styles.serviceBadge} ${
                      service.isActive ? styles.active : styles.inactive
                    }`}
                  >
                    {service.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>

                <div className={styles.servicePrice}>
                  {formatCurrency(service.effectivePrice)}
                  {service.priceOverride && service.priceOverride !== service.effectivePrice && (
                    <span className={styles.originalPrice}>
                      {formatCurrency(service.priceOverride)}
                    </span>
                  )}
                </div>

                {service.description && (
                  <p className={styles.serviceDescription}>{service.description}</p>
                )}

                {service.benefits.length > 0 && (
                  <ul className={styles.serviceBenefits}>
                    {service.benefits.map((benefit, index) => (
                      <li key={index}>
                        <span>✓</span>
                        {benefit.name || benefit}
                      </li>
                    ))}
                  </ul>
                )}

                {service.note && (
                  <div className={styles.serviceNote}>
                    <strong>Lưu ý:</strong> {service.note}
                  </div>
                )}

                {service.isActive && (
                  <button
                    className={styles.orderButton}
                    onClick={() => handleOrderClick(service)}
                  >
                    Mua dịch vụ
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ServiceIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            </div>
            <h3>Chưa có dịch vụ bổ sung</h3>
            <p>Không có dịch vụ bổ sung nào cho lịch giữ trẻ đã chọn. Vui lòng thử lịch giữ trẻ khác.</p>
          </div>
        )}
      </div>

      {/* Buy Service Dialog */}
      <ManagementFormDialog
        open={showOrderDialog}
        onClose={() => {
          if (!isOrdering) {
            setShowOrderDialog(false);
            setSelectedService(null);
            // Reset to filter values when closing
            setOrderForm({
              childId: selectedChildId || '',
              studentSlotId: selectedSlotId || '',
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
          <Box sx={{ 
            mb: 3,
            p: 3,
            backgroundColor: 'rgba(0, 123, 255, 0.05)',
            borderRadius: 2,
            border: '1px solid rgba(0, 123, 255, 0.1)'
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 1,
              color: 'text.primary'
            }}>
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
            childId: orderForm.childId || selectedChildId || '',
            studentSlotId: orderForm.studentSlotId || selectedSlotId || '',
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
              options: children.length > 0 ? children.map(child => ({
                value: child.id,
                label: child.name || child.userName || 'Không tên'
              })) : [],
              onChange: (value) => {
                handleChildChange(value);
                // Update orderForm when child changes
                setOrderForm(prev => ({
                  ...prev,
                  childId: value,
                  studentSlotId: value === selectedChildId ? prev.studentSlotId : '' // Keep slot if same child
                }));
              }
            },
            ...((orderForm.childId || selectedChildId) && studentSlots.length > 0 ? [{
              name: 'studentSlotId',
              label: 'Lịch giữ trẻ',
              type: 'select',
              required: true,
              placeholder: '-- Chọn lịch giữ trẻ --',
              options: studentSlots.map(slot => ({
                value: slot.id,
                label: `${new Date(slot.date).toLocaleString('vi-VN')} · ${slot.status}`
              })),
              onChange: (value) => {
                // Update orderForm when slot changes
                setOrderForm(prev => ({
                  ...prev,
                  studentSlotId: value
                }));
              }
            }] : (orderForm.childId || selectedChildId) && isLoadingSlots ? [{
              name: 'studentSlotId',
              label: 'Lịch giữ trẻ',
              type: 'text',
              disabled: true,
              placeholder: 'Đang tải lịch giữ trẻ...'
            }] : (orderForm.childId || selectedChildId) && slotsError ? [{
              name: 'studentSlotId',
              label: 'Lịch giữ trẻ',
              type: 'text',
              disabled: true,
              placeholder: slotsError
            }] : (orderForm.childId || selectedChildId) ? [{
              name: 'studentSlotId',
              label: 'Lịch giữ trẻ',
              type: 'text',
              disabled: true,
              placeholder: 'Chưa có lịch giữ trẻ nào. Vui lòng đặt lịch trước.'
            }] : []),
            {
              name: 'quantity',
              label: 'Số lượng',
              type: 'number',
              required: true,
              min: 1
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
            <Box sx={{ 
              mb: 3,
              p: 3,
              backgroundColor: 'rgba(0, 123, 255, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(0, 123, 255, 0.1)'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                mb: 1,
                color: 'text.primary'
              }}>
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
              <Box sx={{ 
                mb: 3,
                p: 2,
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}>
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
              message: `Thanh toán từ ${selectedWalletType === 'Parent' ? 'ví phụ huynh' : 'ví học sinh'} thành công!`,
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
        description={`Bạn có chắc chắn muốn thanh toán đơn hàng #${orderSuccessInfo?.orderId} với số tiền ${orderSuccessInfo ? formatCurrency(orderSuccessInfo.orderTotal) : ''} từ ${selectedWalletType === 'Parent' ? 'ví phụ huynh' : 'ví học sinh'}?`}
        confirmText="Xác nhận thanh toán"
        cancelText="Hủy"
        confirmColor="primary"
        showWarningIcon={true}
      />
    </motion.div>
  );
};

export default UserServices;

