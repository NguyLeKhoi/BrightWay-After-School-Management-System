import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarToday as ScheduleIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import StepperForm from '../../../../../components/Common/StepperForm';
import Step1SelectDate from './Step1SelectDate';
import Step2SelectSlotsByDate from './Step2SelectSlotsByDate';
import Step3SelectRoom from './Step3SelectRoom';
import Step5Confirm from './Step5Confirm';
import studentSlotService from '../../../../../services/studentSlot.service';
import studentService from '../../../../../services/student.service';
import packageService from '../../../../../services/package.service';
import { useApp } from '../../../../../contexts/AppContext';
import { formatDateToUTC7ISO, parseDateFromUTC7 } from '../../../../../utils/dateHelper';
import ConfirmDialog from '../../../../../components/Common/ConfirmDialog';
import ServiceSelectionDialog from '../../../../../components/Common/ServiceSelectionDialog';

const WEEKDAY_LABELS = {
  0: 'Chủ nhật',
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy'
};

const MySchedule = () => {
  const navigate = useNavigate();
  const { childId } = useParams(); // Get childId from URL if coming from child schedule page
  const { addNotification } = useApp();
  const [isBooking, setIsBooking] = useState(false);
  const [initialData, setInitialData] = useState({});
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [postBookingPrompt, setPostBookingPrompt] = useState({
    open: false,
    childId: null,
    slotId: null
  });
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceDialogChildId, setServiceDialogChildId] = useState(null);
  const [serviceDialogSlotId, setServiceDialogSlotId] = useState(null);


  // Load child data if childId is provided in URL
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
          // If child not found or no permission, navigate back
          navigate(`/user/management/schedule/${childId}`);
        } finally {
          setIsLoadingInitialData(false);
        }
      }
    };
    loadChildData();
  }, [childId, navigate]);

  const getNextSlotDate = (slot) => {
    const now = new Date();
    if (!slot) {
      return now;
    }

    const targetWeekDay = typeof slot.weekDay === 'number' ? slot.weekDay : now.getDay();
    const todayWeekDay = now.getDay();
    let diff = targetWeekDay - todayWeekDay;
    if (diff < 0) diff += 7;

    const result = new Date(now);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() + diff);

    const time = slot.startTime || '08:00';
    const [hours = '8', minutes = '0'] = time.split(':');
    result.setHours(Number(hours), Number(minutes), 0, 0);

    // Nếu slot đã trôi qua trong ngày hôm nay, chuyển sang tuần sau
    if (diff === 0 && result <= now) {
      result.setDate(result.getDate() + 7);
    }

    return result;
  };

  // Auto-load package subscription (hidden step)
  const autoLoadPackage = useCallback(async (studentId, slot) => {
    try {
      // Get student's active subscriptions
      const subscriptionsResponse = await packageService.getSubscriptionsByStudent(studentId);
      let subscriptions = [];
      
      if (Array.isArray(subscriptionsResponse)) {
        subscriptions = subscriptionsResponse;
      } else if (Array.isArray(subscriptionsResponse?.items)) {
        subscriptions = subscriptionsResponse.items;
      } else if (subscriptionsResponse?.id) {
        subscriptions = [subscriptionsResponse];
      }

      // Filter active subscriptions
      const activeSubscriptions = subscriptions.filter(
        sub => sub.status?.toLowerCase() === 'active'
      );

      if (activeSubscriptions.length === 0) {
        return null;
      }

      // Backend already filters slots by allowed packages, so first active subscription should work
      // But we verify it matches allowed packages if available
      const firstActiveSubscription = activeSubscriptions[0];
      
      // Verify the package is in allowed packages for this slot (if available)
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
    if (!formData.studentId || !formData.slotId || !formData.selectedDate) {
      addNotification({
        message: 'Vui lòng hoàn thành đầy đủ thông tin',
        severity: 'warning'
      });
      return;
    }

    setIsBooking(true);
    try {
      // Auto-load package subscription if not already loaded
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

      // Get student name for display
      let studentName = '';
      try {
        const student = await studentService.getMyChildById(formData.studentId);
        studentName = student?.name || '';
      } catch (err) {
        // Ignore error
      }

      // Use selected date from formData
      let selectedDate = formData.selectedDate instanceof Date 
        ? new Date(formData.selectedDate) 
        : new Date(formData.selectedDate);
      
      // Ensure date has time from slot before validation
      if (formData.slot?.startTime) {
        const time = formData.slot.startTime;
        const [hours = '8', minutes = '0'] = time.split(':');
        selectedDate.setHours(Number(hours), Number(minutes), 0, 0);
      } else {
        // Default to 00:00:00 if no startTime
        selectedDate.setHours(0, 0, 0, 0);
      }
      
      // Validate that selected date matches slot's date if slot has specific date
      if (formData.slot?.date) {
        // Slot has a specific date, check if selectedDate matches
        const slotDate = parseDateFromUTC7(formData.slot.date);
        
        if (slotDate) {
          // Compare dates (ignore time, only compare year, month, day)
          const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
          
          if (selectedDateOnly.getTime() !== slotDateOnly.getTime()) {
            const slotDateStr = slotDate.toLocaleDateString('vi-VN');
            addNotification({
              message: `Ngày đã chọn không khớp với ngày của slot. Slot này chỉ có vào ngày ${slotDateStr}.`,
              severity: 'error'
            });
            setIsBooking(false);
            return;
          }
        }
      } else if (formData.slot?.weekDay !== undefined) {
        // Slot doesn't have specific date, validate by weekday
        // Use getDay() which returns 0 (Sunday) to 6 (Saturday), same as backend WeekDate
        const selectedWeekDay = selectedDate.getDay();
        const slotWeekDay = formData.slot.weekDay;
        
        if (selectedWeekDay !== slotWeekDay) {
          addNotification({
            message: `Ngày đã chọn không khớp với lịch giữ trẻ của slot. Slot này chỉ có vào ${WEEKDAY_LABELS[slotWeekDay] || 'ngày phù hợp'}.`,
            severity: 'error'
          });
          setIsBooking(false);
          return;
        }
      }
      
      // Format date to UTC+7 ISO string for backend
      // This ensures the date maintains the same day regardless of timezone conversion
      const isoDate = formatDateToUTC7ISO(selectedDate);
      
      if (!isoDate) {
        addNotification({
          message: 'Ngày không hợp lệ. Vui lòng chọn lại ngày.',
          severity: 'error'
        });
        setIsBooking(false);
        return;
      }

      const bookingResponse = await studentSlotService.bookSlot({
        studentId: formData.studentId,
        branchSlotId: formData.slotId,
        packageSubscriptionId: subscriptionId,
        roomId: formData.roomId || null, // Optional - backend will auto-assign if null
        date: isoDate,
        parentNote: formData.parentNote || ''
      });

      addNotification({
        message: 'Đặt lịch giữ trẻ thành công!',
        severity: 'success'
      });

      toast.success('Đặt lịch giữ trẻ thành công!', {
        position: 'top-right',
        autoClose: 3000
      });

      // Sau khi đặt lịch thành công, hỏi phụ huynh có muốn mua thêm dịch vụ không
      // Lấy studentSlotId từ bookingResponse (id của student slot vừa được tạo)
      const studentSlotId = bookingResponse?.id || bookingResponse?.studentSlotId || null;
      setPostBookingPrompt({
        open: true,
        childId: formData.studentId,
        slotId: studentSlotId
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
    // Navigate back - if came from child schedule, go back there
    if (childId) {
      navigate(`/user/management/schedule/${childId}`);
    } else {
      navigate('/user/management/children');
    }
  }, [navigate, childId]);

  // New flow steps
  const allSteps = [
    {
      label: 'Chọn ngày',
      component: Step1SelectDate,
      validation: async (data) => {
        if (!data.selectedDate) {
          addNotification({
            message: 'Vui lòng chọn ngày đăng ký',
            severity: 'warning'
          });
          return false;
        }
        return true;
      }
    },
    {
      label: 'Chọn slot',
      component: Step2SelectSlotsByDate,
      validation: async (data) => {
        if (!data.slotId) {
          addNotification({
            message: 'Vui lòng chọn slot phù hợp',
            severity: 'warning'
          });
          return false;
        }
        return true;
      }
    },
    {
      label: 'Chọn phòng',
      component: Step3SelectRoom,
      validation: async (data) => {
        // Room is optional, but package validation is done in Step3SelectRoom
        if (!data.subscriptionId) {
          addNotification({
            message: 'Gói không hợp lệ. Vui lòng chọn slot khác hoặc kiểm tra lại gói.',
            severity: 'error'
          });
          return false;
        }
        return true;
      }
    },
    {
      label: 'Xác nhận',
      component: Step5Confirm,
      validation: async () => true
    }
  ];

  // Use steps directly (no need to skip since we removed student selection step)
  const steps = allSteps;

  // Show loading while loading initial data
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
        title={childId ? `Đăng ký ca chăm sóc cho ${initialData.studentName || 'con'}` : 'Đăng ký ca chăm sóc'}
        icon={<ScheduleIcon />}
      />

      <ConfirmDialog
        open={postBookingPrompt.open}
        onClose={() => {
          setPostBookingPrompt({ open: false, childId: null, slotId: null });
          // Nếu phụ huynh không muốn mua thêm, quay lại trang lịch giữ trẻ/children như cũ
          if (childId) {
            navigate(`/user/management/schedule/${childId}`);
          } else {
            navigate('/user/management/children');
          }
        }}
        onConfirm={() => {
          const { childId: bookedChildId, slotId } = postBookingPrompt;
          setPostBookingPrompt({ open: false, childId: null, slotId: null });
          // Mở dialog dịch vụ thay vì navigate
          setServiceDialogChildId(bookedChildId);
          setServiceDialogSlotId(slotId);
          setServiceDialogOpen(true);
        }}
        title="Mua thêm đồ ăn cho bé?"
        description="Ba/Mẹ có muốn mua thêm đồ ăn cho bé trong slot này không?"
        confirmText="Có, mua ngay"
        cancelText="Không, cảm ơn"
        confirmColor="primary"
      />

      <ServiceSelectionDialog
        open={serviceDialogOpen}
        onClose={() => {
          setServiceDialogOpen(false);
          setServiceDialogChildId(null);
          setServiceDialogSlotId(null);
          // Sau khi đóng dialog dịch vụ, quay lại trang lịch giữ trẻ/children
          if (childId) {
            navigate(`/user/management/schedule/${childId}`);
          } else {
            navigate('/user/management/children');
          }
        }}
        childId={serviceDialogChildId}
        slotId={serviceDialogSlotId}
      />
    </>
  );
};

export default MySchedule;
