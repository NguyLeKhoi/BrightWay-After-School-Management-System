import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Divider,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { 
  ArrowBack, 
  ShoppingCart as ShoppingCartIcon, 
  Payment as PaymentIcon,
  CalendarToday,
  AccessTime,
  MeetingRoom,
  Business,
  Person,
  CheckCircle,
  Note,
  AddShoppingCart,
  Info,
  PhotoLibrary,
  Visibility
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ContentLoading from '../../../../../components/Common/ContentLoading';
import ManagementFormDialog from '../../../../../components/Management/FormDialog';
import Form from '../../../../../components/Common/Form';
import ConfirmDialog from '../../../../../components/Common/ConfirmDialog';
import studentService from '../../../../../services/student.service';
import studentSlotService from '../../../../../services/studentSlot.service';
import serviceService from '../../../../../services/service.service';
import orderService from '../../../../../services/order.service';
import activityService from '../../../../../services/activity.service';
import { useApp } from '../../../../../contexts/AppContext';
import { formatDateTimeUTC7, extractDateString } from '../../../../../utils/dateHelper';
import * as yup from 'yup';
import styles from './ChildScheduleDetail.module.css';

const ChildScheduleDetail = () => {
  const { childId, slotId } = useParams();
  const navigate = useNavigate();
  const { showGlobalError, addNotification } = useApp();
  
  const [child, setChild] = useState(null);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  // Services state
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState(null);
  
  // Activities state
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);
  
  // Buy service dialog state
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [orderForm, setOrderForm] = useState({
    quantity: 1
  });
  const [isOrdering, setIsOrdering] = useState(false);
  const [showWalletSelectionDialog, setShowWalletSelectionDialog] = useState(false);
  const [showConfirmOrderDialog, setShowConfirmOrderDialog] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [selectedWalletTypeForOrder, setSelectedWalletTypeForOrder] = useState(null);
  const [orderSuccessInfo, setOrderSuccessInfo] = useState(null);
  const [selectedWalletType, setSelectedWalletType] = useState(null);
  const [showConfirmPaymentDialog, setShowConfirmPaymentDialog] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const getStatusColor = (status) => {
    return 'var(--color-primary)';
  };

  // Xác định loại lịch: past, current, upcoming
  const getSlotTimeType = (slot) => {
    if (!slot) return 'upcoming';
    
    const dateValue = slot.branchSlot?.date || slot.date;
    const timeframe = slot.timeframe || slot.timeFrame;
    
    if (!dateValue || !timeframe) return 'upcoming';
    
    try {
      // Parse date và time
      const dateStr = extractDateString(dateValue);
      const startTime = timeframe.startTime || '00:00:00';
      const endTime = timeframe.endTime || '00:00:00';
      
      const formatTime = (time) => {
        if (!time) return '00:00:00';
        if (time.length === 5) return time + ':00';
        return time;
      };
      
      const formattedStartTime = formatTime(startTime);
      const formattedEndTime = formatTime(endTime);
      
      // Tạo datetime objects (UTC+7)
      const startDateTime = new Date(`${dateStr}T${formattedStartTime}+07:00`);
      const endDateTime = new Date(`${dateStr}T${formattedEndTime}+07:00`);
      const now = new Date();
      
      // So sánh với thời gian hiện tại
      if (endDateTime < now) {
        return 'past'; // Đã qua
      } else if (startDateTime <= now && now <= endDateTime) {
        return 'current'; // Đang diễn ra
      } else {
        return 'upcoming'; // Sắp tới
      }
    } catch (error) {
      return 'upcoming';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!childId || !slotId) {
        setError('Thiếu thông tin cần thiết');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Kiểm tra quyền truy cập
        const myChildren = await studentService.getMyChildren();
        const childIds = Array.isArray(myChildren) 
          ? myChildren.map(c => c.id) 
          : [];
        
        if (!childIds.includes(childId)) {
          setError('Bạn không có quyền xem thông tin này');
          navigate(`/user/management/schedule/${childId}`);
          return;
        }

        // Lấy thông tin trẻ
        const childData = await studentService.getMyChildById(childId);
        setChild(childData);

        // Lấy thông tin slot
        const response = await studentSlotService.getStudentSlots({
          StudentId: childId,
          pageIndex: 1,
          pageSize: 1000
        });

        const slots = response?.items || [];
        const foundSlot = slots.find(s => s.id === slotId);

        if (!foundSlot) {
          setError('Không tìm thấy lịch giữ trẻ này');
          navigate(`/user/management/schedule/${childId}`);
          return;
        }

        setSlot(foundSlot);
        loadServices();
        loadActivities();
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [childId, slotId, navigate, showGlobalError]);

  const loadServices = async () => {
    if (!childId) return;
    
    setIsLoadingServices(true);
    setServicesError(null);
    
    try {
      const response = await serviceService.getAddOnsForStudent(childId);
      const items = Array.isArray(response) ? response : [];
      
      const mappedServices = items.map((service) => ({
        id: service.serviceId || service.id,
        name: service.name || 'Dịch vụ không tên',
        type: service.serviceType || 'Dịch vụ bổ sung',
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
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể tải danh sách dịch vụ';
      setServicesError(errorMessage);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadActivities = async () => {
    if (!childId || !slotId) return;
    
    setIsLoadingActivities(true);
    setActivitiesError(null);
    
    try {
      const response = await activityService.getMyChildrenActivities({
        studentId: childId,
        studentSlotId: slotId,
        pageIndex: 1,
        pageSize: 100
      });
      
      const items = response?.items || [];
      setActivities(items);
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Không thể tải hoạt động';
      setActivitiesError(errorMessage);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleOrderClick = (service) => {
    setSelectedService(service);
    setOrderForm({
      quantity: 1
    });
    setShowOrderDialog(true);
  };

  const handleOrderSubmit = (data) => {
    if (!selectedService || !slot) return;
    
    // Lưu thông tin đơn hàng và hiển thị dialog chọn ví
    setPendingOrderData({
      service: selectedService,
      quantity: data.quantity,
      totalAmount: selectedService.effectivePrice * data.quantity
    });
    setSelectedWalletTypeForOrder(null);
    setShowOrderDialog(false);
    setShowWalletSelectionDialog(true);
  };

  const handleWalletSelected = (walletType) => {
    setSelectedWalletTypeForOrder(walletType);
    setShowWalletSelectionDialog(false);
    setShowConfirmOrderDialog(true);
  };

  const handleConfirmOrder = async () => {
    if (!pendingOrderData || !selectedService || !slot) return;
    
    setIsOrdering(true);
    try {
      const response = await orderService.createOrder({
        studentSlotId: slot.id,
        items: [
          {
            serviceId: selectedService.id,
            quantity: pendingOrderData.quantity
          }
        ]
      });
      
      const orderId = response?.orderId || response?.id;
      const orderTotal = response?.totalAmount || pendingOrderData.totalAmount;
      
      // Nếu đã chọn ví, tự động thanh toán luôn
      if (selectedWalletTypeForOrder) {
        try {
          const paymentRes = await orderService.payOrderWithWallet({
            orderId: orderId,
            walletType: selectedWalletTypeForOrder
          });
          
          setPaymentResult(paymentRes);
          addNotification({
            message: `Thanh toán từ ví ${selectedWalletTypeForOrder === 'Parent' ? 'phụ huynh' : 'trẻ em'} thành công!`,
            severity: 'success'
          });
        } catch (paymentErr) {
          // Nếu thanh toán thất bại, vẫn hiển thị đơn hàng đã tạo
          const paymentErrorMessage =
            typeof paymentErr === 'string'
              ? paymentErr
              : paymentErr?.message || paymentErr?.error || 'Thanh toán thất bại';
          showGlobalError(paymentErrorMessage);
        }
      }
      
      setOrderSuccessInfo({
        orderId: orderId,
        orderTotal: orderTotal,
        childName: child?.name || child?.userName || 'Không tên'
      });
      setSelectedWalletType(null);
      setShowConfirmOrderDialog(false);
      setPendingOrderData(null);
      setSelectedWalletTypeForOrder(null);
      
      if (!selectedWalletTypeForOrder) {
        addNotification({
          message: 'Tạo đơn dịch vụ thành công!',
          severity: 'success'
        });
      }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleConfirmPayment = async () => {
    if (!orderSuccessInfo || !selectedWalletType) return;
    
    setIsPaying(true);
    try {
      const res = await orderService.payOrderWithWallet({
        orderId: orderSuccessInfo.orderId,
        walletType: selectedWalletType
      });
      
      setPaymentResult(res);
      setShowConfirmPaymentDialog(false);
      setSelectedWalletType(null);
      addNotification({
        message: `Thanh toán từ ví ${selectedWalletType === 'Parent' ? 'phụ huynh' : 'trẻ em'} thành công!`,
        severity: 'success'
      });
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
    } finally {
      setIsPaying(false);
    }
  };

  const handlePaymentClick = (walletType) => {
    setSelectedWalletType(walletType);
    setShowConfirmPaymentDialog(true);
  };

  const handleBack = () => {
    navigate(`/user/management/schedule/${childId}`);
  };

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <ContentLoading isLoading={true} text="Đang tải thông tin..." />
        </div>
      </div>
    );
  }

  if (error || !child || !slot) {
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
            {error || 'Không tìm thấy thông tin'}
          </Alert>
        </div>
      </div>
    );
  }

  // Parse slot data
  const dateValue = slot.branchSlot?.date || slot.date;
  const timeframe = slot.timeframe || slot.timeFrame;
  const roomName = slot.room?.roomName || slot.roomName || slot.branchSlot?.roomName || 'Chưa xác định';
  const branchName = slot.branchSlot?.branchName || slot.branchName || 'Chưa xác định';
  const status = slot.status || 'Booked';
  
  const startTime = dateValue ? formatDateTimeUTC7(dateValue, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Chưa xác định';
  
  const timeframeName = timeframe?.name || 'Chưa xác định';
  const startTimeOnly = timeframe?.startTime || '';
  const endTimeOnly = timeframe?.endTime || '';

  const statusLabels = {
    'Booked': 'Đã đăng ký',
    'Confirmed': 'Đã xác nhận',
    'Cancelled': 'Đã hủy',
    'Completed': 'Đã hoàn thành',
    'Pending': 'Chờ xử lý'
  };

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
                color: 'var(--text-primary)'
              }}
            >
              Chi tiết lịch giữ trẻ
            </Typography>
          </Box>
        </Paper>

        {/* Activities Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{
                padding: 3,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <PhotoLibrary sx={{ color: 'var(--color-primary)' }} />
                Hoạt động của trẻ
              </Typography>

              {isLoadingActivities ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Đang tải hoạt động...
                  </Typography>
                </Box>
              ) : activitiesError ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {activitiesError}
                </Alert>
              ) : activities.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activities.map((activity) => (
                    <Card
                      key={activity.id}
                      elevation={0}
                      sx={{
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'var(--color-primary)',
                          boxShadow: 'var(--shadow-md)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {activity.imageUrl && (
                            <Box
                              component="img"
                              src={activity.imageUrl}
                              alt={activity.name || 'Hoạt động'}
                              sx={{
                                width: 120,
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 'var(--radius-md)',
                                flexShrink: 0
                              }}
                            />
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                                {activity.name || 'Hoạt động không tên'}
                              </Typography>
                              {activity.isViewed && (
                                <Chip
                                  icon={<Visibility />}
                                  label="Đã xem"
                                  size="small"
                                  sx={{
                                    backgroundColor: 'var(--color-success)',
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              )}
                            </Box>
                            
                            {activity.activityType && (
                              <Chip
                                label={activity.activityType.name || activity.activityType}
                                size="small"
                                sx={{
                                  backgroundColor: 'var(--color-primary-50)',
                                  color: 'var(--color-primary-dark)',
                                  fontWeight: 600,
                                  mb: 1
                                }}
                              />
                            )}
                            
                            {activity.activityType?.description && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  mb: 1.5,
                                  lineHeight: 1.6
                                }}
                              >
                                {activity.activityType.description}
                              </Typography>
                            )}
                            
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
                              {activity.staffName && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Person sx={{ fontSize: 16, color: 'var(--text-secondary)' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {activity.staffName}
                                  </Typography>
                                </Box>
                              )}
                              {activity.createdDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarToday sx={{ fontSize: 16, color: 'var(--text-secondary)' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDateTimeUTC7(activity.createdDate, {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    py: 6, 
                    textAlign: 'center',
                    border: '2px dashed var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  <PhotoLibrary sx={{ fontSize: 48, color: 'var(--text-secondary)', mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1" color="text.secondary" fontWeight="medium">
                    Chưa có hoạt động nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Hiện tại chưa có hoạt động nào được ghi lại cho slot này
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Content - Grid Layout */}
        <Grid container spacing={3}>
          {/* Left Column - Basic Information */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{
                padding: 3,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-primary)',
                height: '100%'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Info sx={{ color: 'var(--color-primary)' }} />
                Thông tin lịch giữ trẻ
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Ngày học */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                      Ngày học
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ pl: 4 }}>
                    {startTime}
                  </Typography>
                </Box>

                <Divider />

                {/* Khung giờ */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTime sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                      Khung giờ
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ pl: 4 }}>
                    {timeframeName} ({startTimeOnly} - {endTimeOnly})
                  </Typography>
                </Box>

                <Divider />

                {/* Loại ca */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Note sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                      Loại ca
                    </Typography>
                  </Box>
                  <Box sx={{ pl: 4 }}>
                    <Chip
                      label={slot?.branchSlot?.slotType?.name || slot?.slotTypeName || 'Chưa xác định'}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Phòng */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MeetingRoom sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                      Phòng
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ pl: 4 }}>
                    {roomName}
                  </Typography>
                </Box>

                <Divider />

                {/* Chi nhánh */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Business sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                      Chi nhánh
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ pl: 4 }}>
                    {branchName}
                  </Typography>
                </Box>

                <Divider />

                {/* Trạng thái */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircle sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                      Trạng thái
                    </Typography>
                  </Box>
                  <Box sx={{ pl: 4 }}>
                    <Chip
                      label={statusLabels[status] || status || 'Chưa xác định'}
                      size="small"
                      icon={<CheckCircle sx={{ color: 'white !important' }} />}
                      sx={{
                        backgroundColor: getStatusColor(status),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Box>

                {/* Nhân viên chăm sóc */}
                {slot.staffs && slot.staffs.length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                          Nhân viên chăm sóc
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium" sx={{ pl: 4 }}>
                        {slot.staffs.map((staff, index) => 
                          staff.staffName || staff.name || 'Chưa xác định'
                        ).join(', ')}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Ghi chú */}
                {slot.parentNote && (
                  <>
                    <Divider />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Note sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                          Ghi chú
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ pl: 4, fontStyle: 'italic' }}>
                        {slot.parentNote}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Services */}
          <Grid item xs={12} md={6}>
            {/* Dịch vụ đã mua */}
            {slot?.services && slot.services.length > 0 && (
              <Paper 
                elevation={0}
                sx={{
                  padding: 3,
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-primary)',
                  mb: 3
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3,
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <CheckCircle sx={{ color: 'var(--color-success)' }} />
                  Dịch vụ đã mua
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {slot.services.map((service) => (
                    <Card
                      key={service.serviceId}
                      elevation={0}
                      sx={{
                        border: '2px solid var(--color-success)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'rgba(76, 175, 80, 0.05)'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', mb: 0.5 }}>
                              {service.serviceName}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
                              <Chip
                                label={`Số lượng: ${service.quantity}`}
                                size="small"
                                sx={{
                                  backgroundColor: 'var(--color-info)',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.8rem'
                                }}
                              />
                              <Chip
                                label={`Tổng: ${formatCurrency(service.totalPrice)}`}
                                size="small"
                                sx={{
                                  backgroundColor: 'var(--color-primary)',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.85rem'
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Dịch vụ bổ sung để mua */}
            <Paper 
              elevation={0}
              sx={{
                padding: 3,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-primary)',
                height: '100%'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <AddShoppingCart sx={{ color: 'var(--color-secondary)' }} />
                Dịch vụ bổ sung
              </Typography>

              {isLoadingServices ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Đang tải dịch vụ...
                  </Typography>
                </Box>
              ) : servicesError ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {servicesError}
                </Alert>
              ) : services.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(() => {
                    const slotTimeType = slot ? getSlotTimeType(slot) : 'upcoming';
                    const isPast = slotTimeType === 'past';
                    
                    return services.map((service) => (
                      <Card
                        key={service.id}
                        elevation={0}
                        sx={{
                          border: '2px solid',
                          borderColor: service.isActive && !isPast ? 'var(--color-primary)' : 'var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          transition: 'all 0.3s ease',
                          opacity: isPast ? 0.6 : 1,
                          '&:hover': {
                            borderColor: isPast ? 'var(--border-light)' : 'var(--color-primary)',
                            boxShadow: isPast ? 'none' : 'var(--shadow-md)',
                            transform: isPast ? 'none' : 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', mb: 1 }}>
                                {service.name}
                              </Typography>
                              
                              {service.description && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    mb: 1.5,
                                    lineHeight: 1.6,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {service.description}
                                </Typography>
                              )}
                              
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Chip
                                  icon={<ShoppingCartIcon />}
                                  label={formatCurrency(service.effectivePrice)}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    height: 28
                                  }}
                                />
                                {service.benefits && service.benefits.length > 0 && (
                                  <Chip
                                    label={`${service.benefits.length} lợi ích`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderColor: 'var(--color-secondary)',
                                      color: 'var(--color-secondary)',
                                      fontWeight: 600
                                    }}
                                  />
                                )}
                              </Box>
                              
                              {isPast && (
                                <Alert 
                                  severity="info" 
                                  icon={<Info />}
                                  sx={{ 
                                    mt: 2,
                                    fontSize: '0.85rem',
                                    '& .MuiAlert-icon': {
                                      fontSize: '1.2rem'
                                    }
                                  }}
                                >
                                  Lịch giữ trẻ này đã qua, không thể mua dịch vụ bổ sung
                                </Alert>
                              )}
                            </Box>
                            
                            {service.isActive && !isPast && (
                              <Button
                                variant="contained"
                                startIcon={<ShoppingCartIcon />}
                                onClick={() => handleOrderClick(service)}
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: 'var(--radius-lg)',
                                  background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                                  boxShadow: 'var(--shadow-sm)',
                                  fontWeight: 600,
                                  px: 2.5,
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                                    boxShadow: 'var(--shadow-md)',
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                              >
                                Mua ngay
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ));
                  })()}
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    py: 6, 
                    textAlign: 'center',
                    border: '2px dashed var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  <AddShoppingCart sx={{ fontSize: 48, color: 'var(--text-secondary)', mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1" color="text.secondary" fontWeight="medium">
                    Không có dịch vụ bổ sung nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Hiện tại chưa có dịch vụ bổ sung cho slot này
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Buy Service Dialog */}
        <ManagementFormDialog
          open={showOrderDialog}
          onClose={() => {
            if (!isOrdering) {
              setShowOrderDialog(false);
              setSelectedService(null);
              setOrderForm({
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
              {selectedService.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedService.description}
                </Typography>
              )}
            </Box>
          )}

          <Form
            schema={yup.object().shape({
              quantity: yup.number().min(1, 'Số lượng phải lớn hơn 0').required('Vui lòng nhập số lượng')
            })}
            defaultValues={{
              quantity: orderForm.quantity || 1
            }}
            onSubmit={handleOrderSubmit}
            submitText="Tiếp tục"
            loading={isOrdering}
            disabled={isOrdering}
            fields={[
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

        {/* Wallet Selection Dialog */}
        <Dialog
          open={showWalletSelectionDialog}
          onClose={() => {
            setShowWalletSelectionDialog(false);
            setPendingOrderData(null);
            setSelectedWalletTypeForOrder(null);
            if (selectedService) {
              setShowOrderDialog(true);
            }
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            pb: 1
          }}>
            <PaymentIcon color="primary" />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Chọn ví thanh toán
            </Typography>
          </DialogTitle>
          <DialogContent>
            {pendingOrderData && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(0, 123, 255, 0.05)',
                  borderRadius: 1,
                  mb: 2
                }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Dịch vụ: <strong>{pendingOrderData.service.name}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Số lượng: <strong>{pendingOrderData.quantity}</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, fontWeight: 600, color: 'primary.main' }}>
                    Tổng tiền: {formatCurrency(pendingOrderData.totalAmount)}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Vui lòng chọn ví để thanh toán:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleWalletSelected('Parent')}
                    startIcon={<PaymentIcon />}
                    sx={{ 
                      py: 2,
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: 'rgba(0, 123, 255, 0.05)'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'left', ml: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Ví phụ huynh
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Thanh toán từ ví chính của phụ huynh
                      </Typography>
                    </Box>
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleWalletSelected('Student')}
                    startIcon={<PaymentIcon />}
                    sx={{ 
                      py: 2,
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: 'rgba(0, 123, 255, 0.05)'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'left', ml: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Ví trẻ em
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Thanh toán từ ví của trẻ
                      </Typography>
                    </Box>
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Order Dialog */}
        <ConfirmDialog
          open={showConfirmOrderDialog}
          onClose={() => {
            setShowConfirmOrderDialog(false);
            setPendingOrderData(null);
            setSelectedWalletTypeForOrder(null);
            // Mở lại dialog nhập số lượng
            if (selectedService) {
              setShowOrderDialog(true);
            }
          }}
          onConfirm={handleConfirmOrder}
          title="Xác nhận mua dịch vụ"
          description={
            pendingOrderData 
              ? `Xác nhận mua dịch vụ "${pendingOrderData.service.name}" với số lượng ${pendingOrderData.quantity} (Tổng: ${formatCurrency(pendingOrderData.totalAmount)}). ${selectedWalletTypeForOrder ? `Thanh toán bằng ${selectedWalletTypeForOrder === 'Parent' ? 'Ví phụ huynh' : 'Ví trẻ em'}.` : ''}`
              : ''
          }
          confirmText="Xác nhận mua"
          cancelText="Hủy"
          loading={isOrdering}
        />

        {/* Payment Dialog */}
        {orderSuccessInfo && (
          <ConfirmDialog
            open={!!orderSuccessInfo}
            onClose={() => {
              setOrderSuccessInfo(null);
              setPaymentResult(null);
              setSelectedWalletType(null);
            }}
            onConfirm={() => {
              // Payment handled separately
            }}
            title="Thanh toán đơn hàng"
            message={
              <Box>
                <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                  Đơn #{orderSuccessInfo.orderId}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                  Tổng tiền: {formatCurrency(orderSuccessInfo.orderTotal)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Học sinh: {orderSuccessInfo.childName}
                </Typography>
                {paymentResult && (
                  <Box sx={{ 
                    p: 2, 
                    mt: 2, 
                    bgcolor: paymentResult.status === 'success' ? 'success.light' : 'error.light',
                    borderRadius: 1
                  }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                      Trạng thái: <strong>{paymentResult.status}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Số tiền đã trả: {formatCurrency(paymentResult.paidAmount || 0)}
                    </Typography>
                    <Typography variant="body2">
                      Số dư còn lại: {formatCurrency(paymentResult.remainingBalance || 0)}
                    </Typography>
                  </Box>
                )}
                {!paymentResult && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1, mt: 2 }}>
                      Chọn ví để thanh toán:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handlePaymentClick('Parent')}
                        startIcon={<PaymentIcon />}
                        sx={{ textTransform: 'none', py: 1.5 }}
                        disabled={isPaying}
                      >
                        Ví phụ huynh
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handlePaymentClick('Student')}
                        startIcon={<PaymentIcon />}
                        sx={{ textTransform: 'none', py: 1.5 }}
                        disabled={isPaying}
                      >
                        Ví trẻ em
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            }
            confirmText="Đóng"
            cancelText={null}
            loading={isPaying}
          />
        )}

        {/* Confirm Payment Dialog */}
        <ConfirmDialog
          open={showConfirmPaymentDialog}
          onClose={() => {
            setShowConfirmPaymentDialog(false);
            setSelectedWalletType(null);
          }}
          onConfirm={handleConfirmPayment}
          title="Xác nhận thanh toán"
          message={
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Bạn có chắc chắn muốn thanh toán đơn #{orderSuccessInfo?.orderId} từ ví {selectedWalletType === 'Parent' ? 'phụ huynh' : 'trẻ em'}?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Số tiền: <strong>{formatCurrency(orderSuccessInfo?.orderTotal || 0)}</strong>
              </Typography>
            </Box>
          }
          confirmText="Xác nhận"
          cancelText="Hủy"
          loading={isPaying}
        />
      </div>
    </div>
  );
};

export default ChildScheduleDetail;

