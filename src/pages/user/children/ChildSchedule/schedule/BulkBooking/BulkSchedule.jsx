import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarToday as ScheduleIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import StepperForm from '../../../../../../components/Common/StepperForm';
import BulkStep1DateRange from './BulkStep1DateRange';
import BulkStep2WeekDates from './BulkStep2WeekDates';
import BulkStep3SelectSlot from './BulkStep3SelectSlot';
import BulkStep4Confirm from './BulkStep4Confirm';
import studentSlotService from '../../../../../../services/studentSlot.service';
import studentService from '../../../../../../services/student.service';
import packageService from '../../../../../../services/package.service';
import { useApp } from '../../../../../../contexts/AppContext';
import ConfirmDialog from '../../../../../../components/Common/ConfirmDialog';
import ServiceSelectionDialog from '../../../../../../components/Common/ServiceSelectionDialog';

const BulkSchedule = () => {
  const navigate = useNavigate();
  const { childId } = useParams();
  const { addNotification } = useApp();
  const [isBooking, setIsBooking] = useState(false);
  const [initialData, setInitialData] = useState({});
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [postBookingPrompt, setPostBookingPrompt] = useState({
    open: false,
    childId: null,
    slotIds: []
  });
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceDialogChildId, setServiceDialogChildId] = useState(null);
  const [serviceDialogSlotIds, setServiceDialogSlotIds] = useState([]);

  useEffect(() => {
    const loadChildData = async () => {
      if (childId) {
        setIsLoadingInitialData(true);
        try {
          const child = await studentService.getMyChildById(childId);
          setInitialData({
            studentId: childId,
            studentName: child?.name || child?.userName || ''
          });
        } catch (err) {
          navigate(`/user/management/schedule/${childId}`);
        } finally {
          setIsLoadingInitialData(false);
        }
      }
    };
    loadChildData();
  }, [childId, navigate]);

  const autoLoadPackage = useCallback(async (studentId, slot) => {
    try {
      const subscriptionsResponse = await packageService.getSubscriptionsByStudent(studentId);
      let subscriptions = [];

      if (Array.isArray(subscriptionsResponse)) {
        subscriptions = subscriptionsResponse;
      } else if (Array.isArray(subscriptionsResponse?.items)) {
        subscriptions = subscriptionsResponse.items;
      } else if (subscriptionsResponse?.id) {
        subscriptions = [subscriptionsResponse];
      }

      const activeSubscriptions = subscriptions.filter(
        sub => sub.status?.toLowerCase() === 'active'
      );

      if (activeSubscriptions.length === 0) {
        return null;
      }

      const firstActiveSubscription = activeSubscriptions[0];
      const allowedPackageIds = slot?.allowedPackages?.map(pkg => pkg.id) || [];
      const subscriptionPackageId = firstActiveSubscription.packageId || firstActiveSubscription.package?.id;

      if (allowedPackageIds.length > 0 && subscriptionPackageId) {
        if (!allowedPackageIds.includes(subscriptionPackageId)) {
          return null;
        }
      }

      return {
        id: firstActiveSubscription.id,
        name: firstActiveSubscription.packageName || 'Gói không tên'
      };
    } catch (err) {
      console.error('Error auto-loading package:', err);
      return null;
    }
  }, []);

  const handleComplete = useCallback(async (formData) => {
    if (!formData.studentId || !formData.slotId || !formData.startDate || !formData.endDate || !formData.weekDates) {
      addNotification({
        message: 'Vui lòng hoàn thành đầy đủ thông tin',
        severity: 'warning'
      });
      return;
    }

    setIsBooking(true);
    try {
      let subscriptionId = formData.subscriptionId;
      let subscriptionName = formData.subscriptionName;

      if (!subscriptionId && formData.slot) {
        const autoPackage = await autoLoadPackage(formData.studentId, formData.slot);
        if (autoPackage) {
          subscriptionId = autoPackage.id;
          subscriptionName = autoPackage.name;
        } else {
          addNotification({
            message: 'Không tìm thấy gói hợp lệ cho đứa trẻ này. Vui lòng kiểm tra lại.',
            severity: 'error'
          });
          setIsBooking(false);
          return;
        }
      }

      if (!subscriptionId) {
        addNotification({
          message: 'Không tìm thấy gói đăng ký hợp lệ',
          severity: 'error'
        });
        setIsBooking(false);
        return;
      }

      let studentName = '';
      try {
        const student = await studentService.getMyChildById(formData.studentId);
        studentName = student?.name || '';
      } catch (err) {
        // Ignore error
      }

      const startDate = formData.startDate instanceof Date
        ? formData.startDate.toISOString().split('T')[0]
        : formData.startDate;

      const endDate = formData.endDate instanceof Date
        ? formData.endDate.toISOString().split('T')[0]
        : formData.endDate;

      const bookingResponse = await studentSlotService.bulkBookSlots({
        studentId: formData.studentId,
        packageSubscriptionId: subscriptionId,
        branchSlotId: formData.slotId,
        roomId: formData.roomId || null,
        startDate: startDate,
        endDate: endDate,
        weekDates: formData.weekDates,
        parentNote: formData.parentNote || ''
      });

      let slotIds = [];
      if (Array.isArray(bookingResponse)) {
        slotIds = bookingResponse.map(slot => slot.id || slot.studentSlotId).filter(id => id);
      } else if (bookingResponse?.id || bookingResponse?.studentSlotId) {
        slotIds = [bookingResponse.id || bookingResponse.studentSlotId];
      }

      const slotCount = Array.isArray(bookingResponse) ? bookingResponse.length : 1;

      addNotification({
        message: `Đặt lịch giữ trẻ thành công! Đã tạo ${slotCount} slots.`,
        severity: 'success'
      });

      toast.success(`✓ Đã tạo ${slotCount} slots thành công!`, {
        position: 'top-right',
        autoClose: 3000
      });

      setPostBookingPrompt({
        open: true,
        childId: formData.studentId,
        slotIds: slotIds
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || err?.error || 'Không thể đặt lịch giữ trẻ';
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000
      });
    } finally {
      setIsBooking(false);
    }
  }, [navigate, addNotification, autoLoadPackage, childId]);

  const handleCancel = useCallback(() => {
    if (childId) {
      navigate(`/user/management/schedule/${childId}`);
    } else {
      navigate('/user/management/children');
    }
  }, [navigate, childId]);

  const steps = [
    {
      label: 'Chọn khoảng thời gian',
      component: BulkStep1DateRange,
      validation: async (data) => {
        if (!data.startDate || !data.endDate) {
          addNotification({
            message: 'Vui lòng chọn ngày bắt đầu và kết thúc',
            severity: 'warning'
          });
          return false;
        }
        return true;
      }
    },
    {
      label: 'Chọn ngày trong tuần',
      component: BulkStep2WeekDates,
      validation: async (data) => {
        if (!data.weekDates || data.weekDates.length === 0) {
          addNotification({
            message: 'Vui lòng chọn ít nhất một ngày trong tuần',
            severity: 'warning'
          });
          return false;
        }
        return true;
      }
    },
    {
      label: 'Chọn khung giờ',
      component: BulkStep3SelectSlot,
      validation: async (data) => {
        if (!data.slotId) {
          addNotification({
            message: 'Vui lòng chọn khung giờ',
            severity: 'warning'
          });
          return false;
        }
        return true;
      }
    },
    {
      label: 'Xác nhận',
      component: BulkStep4Confirm,
      validation: async () => true
    }
  ];

  if (childId && isLoadingInitialData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        initialData={initialData}
        title={childId ? `Đặt lịch giữ trẻ theo tuần - ${initialData.studentName || 'con'}` : 'Đặt lịch giữ trẻ theo tuần'}
        icon={<ScheduleIcon />}
        isLoading={isBooking}
        loadingMessage="Đang xử lý đặt lịch..."
      />

      <ConfirmDialog
        open={postBookingPrompt.open}
        onClose={() => {
          setPostBookingPrompt({ open: false, childId: null, slotIds: [] });
          if (childId) {
            navigate(`/user/management/schedule/${childId}`);
          } else {
            navigate('/user/management/children');
          }
        }}
        onConfirm={() => {
          const { childId: bookedChildId, slotIds } = postBookingPrompt;
          setPostBookingPrompt({ open: false, childId: null, slotIds: [] });
          setServiceDialogChildId(bookedChildId);
          setServiceDialogSlotIds(slotIds);
          setServiceDialogOpen(true);
        }}
        title="Mua thêm đồ ăn cho bé?"
        description={`Ba/Mẹ có muốn mua thêm đồ ăn cho bé trong các slots vừa đặt không?`}
        confirmText="Có, mua ngay"
        cancelText="Không, cảm ơn"
        confirmColor="primary"
      />

      <ServiceSelectionDialog
        open={serviceDialogOpen}
        onClose={() => {
          setServiceDialogOpen(false);
          setServiceDialogChildId(null);
          setServiceDialogSlotIds([]);
          if (childId) {
            navigate(`/user/management/schedule/${childId}`);
          } else {
            navigate('/user/management/children');
          }
        }}
        childId={serviceDialogChildId}
        slotIds={serviceDialogSlotIds}
      />
    </>
  );
};

export default BulkSchedule;
