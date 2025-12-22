import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box } from '@mui/material';
import { AccessTime as BranchSlotIcon } from '@mui/icons-material';
import StepperForm from '../../../../components/Common/StepperForm';
import branchSlotService from '../../../../services/branchSlot.service';
import useBranchSlotDependencies from '../../../../hooks/useBranchSlotDependencies';
import { useAuth } from '../../../../contexts/AuthContext';
import Step1DateSelection from './Step1DateSelection';
import Step2AssignRooms from './Step2AssignRooms';

const BulkCreateBranchSlot = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [actionLoading, setActionLoading] = useState(false);
  const [managerBranchId, setManagerBranchId] = useState('');

  const {
    timeframeOptions,
    slotTypeOptions,
    roomOptions,
    staffOptions,
    loading: dependenciesLoading,
    fetchDependencies
  } = useBranchSlotDependencies(managerBranchId || null);

  useEffect(() => {
    if (managerBranchId) {
      fetchDependencies();
    }
  }, [managerBranchId, fetchDependencies]);

  useEffect(() => {
    const extractBranchId = (userData) =>
      userData?.managerProfile?.branchId || userData?.branchId || userData?.managerBranchId || '';

    const existingBranchId = extractBranchId(authUser);
    if (existingBranchId) {
      setManagerBranchId(existingBranchId);
    }
  }, [authUser]);

  // Cleanup khi component mount - clear any existing stepper form data
  useEffect(() => {
    // Clear all stepper form data to prevent navigation conflicts
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('stepperForm_')) {
        sessionStorage.removeItem(key);
      }
    });

    return () => {
      // Cleanup on unmount - clear everything before navigation
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('stepperForm_')) {
          sessionStorage.removeItem(key);
        }
      });
    };
  }, []);

  // Prevent back/forward navigation conflicts - remove this as it may cause issues
  // useEffect(() => {
  //   const handlePopState = () => {
  //     Object.keys(sessionStorage).forEach(key => {
  //       if (key.startsWith('stepperForm_')) {
  //         sessionStorage.removeItem(key);
  //       }
  //     });
  //   };

  //   window.addEventListener('popstate', handlePopState);
  //   return () => {
  //     window.removeEventListener('popstate', handlePopState);
  //   };
  // }, []);

  const generateDates = useCallback((startDate, endDate, selectedWeekDays) => {
    if (!startDate || !endDate || selectedWeekDays.length === 0) {
      return [];
    }

    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (selectedWeekDays.includes(dayOfWeek)) {
        dates.push(new Date(date));
      }
    }

    return dates;
  }, []);

  const formatLocalDateToUTC7Noon = useCallback((dateValue) => {
    if (!dateValue) return null;
    let dateObj;
    if (dateValue instanceof Date) {
      dateObj = dateValue;
    } else if (typeof dateValue === 'string') {
      // Parse YYYY-MM-DD (or ISO) as local date to avoid timezone shifting
      const dateStr = dateValue.split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(dateValue);
    }

    if (isNaN(dateObj.getTime())) return null;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000+07:00`;
  }, []);

  const handleComplete = useCallback(async (finalData = {}) => {
    try {
      setActionLoading(true);

      const dates = generateDates(
        finalData.startDate,
        finalData.endDate,
        finalData.selectedWeekDays || []
      );

      if (dates.length === 0) {
        toast.error('Không có ngày nào được chọn để tạo ca giữ trẻ', {
          position: 'top-right',
          autoClose: 3000
        });
        return;
      }

      const weekDates = (finalData.selectedWeekDays || []).map((d) => Number(d));
      const startDate = formatLocalDateToUTC7Noon(finalData.startDate);
      const endDate = formatLocalDateToUTC7Noon(finalData.endDate);

      const roomAssignments = (finalData.roomAssignments || [])
        .filter((ra) => ra.roomId)
        .map((ra) => {
          const staffIdFromLegacy = Array.isArray(ra.staffIds) && ra.staffIds.length > 0 ? ra.staffIds[0] : '';
          const staffId = ra.staffId || staffIdFromLegacy || '';
          const staffName =
            ra.staffName ||
            (staffId ? (staffOptions || []).find((s) => s.id === staffId)?.name : '') ||
            '';

          return {
            roomId: ra.roomId,
            staffId: staffId || null,
            staffName: staffName || null,
            // backward compatibility for BE expecting staffIds
            staffIds: staffId ? [staffId] : []
          };
        });
      if (roomAssignments.length === 0) {
        toast.error('Vui lòng gán ít nhất 1 phòng để tạo ca giữ trẻ', {
          position: 'top-right',
          autoClose: 4000
        });
        return;
      }

      // Call bulk create API theo format ổn định
      // Gửi vào shape { dto, weekDates } để service không phải đoán start/end
      await branchSlotService.bulkCreateBranchSlots({
        dto: {
          timeframeId: finalData.timeframeId,
          slotTypeId: finalData.slotTypeId,
          startDate,
          endDate,
          status: finalData.status || 'Available',
          roomAssignments
        },
        weekDates // Array of weekday numbers [0,1,2,3,4,5,6]
      });

      toast.success(`Đã tạo thành công ${dates.length} ca giữ trẻ!`, {
        position: 'top-right',
        autoClose: 3000
      });

      navigate('/manager/branch-slots?refresh=true');
    } catch (error) {

      const errorMessage =
        error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo ca giữ trẻ hàng loạt';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setActionLoading(false);
    }
  }, [generateDates, navigate, formatLocalDateToUTC7Noon, managerBranchId]);

  const steps = useMemo(
    () => [
      {
        label: 'Chọn Ngày & Thông Tin',
        component: Step1DateSelection
      },
      {
        label: 'Gán Phòng & Nhân Viên',
        component: Step2AssignRooms
      }
    ],
    []
  );

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px - 48px)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <StepperForm
        title="Tạo Ca Giữ Trẻ Hàng Loạt"
        icon={<BranchSlotIcon />}
        steps={steps}
        onComplete={handleComplete}
        onCancel={() => {
          // Clear any saved stepper form data before navigating
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('stepperForm_')) {
              sessionStorage.removeItem(key);
            }
          });

          // Small delay to ensure cleanup completes before navigation
          setTimeout(() => {
            window.location.href = '/manager/branch-slots';
          }, 50);
        }}
        loading={actionLoading}
        enableLocalStorage={false} // Disable localStorage để tránh conflict với navigation
        showStepConfirmation={true}
        stepConfirmationCancelText="Quay về"
        stepProps={{
          timeframeOptions,
          slotTypeOptions,
          roomOptions,
          staffOptions,
          dependenciesLoading,
          actionLoading
        }}
      />
    </Box>
  );
};

export default BulkCreateBranchSlot;

