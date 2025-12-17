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

      // Call bulk create API
      await branchSlotService.bulkCreateBranchSlots({
        // Some BE builds expect wrapper { dto, weekDates }, some expect flat fields.
        // Send both to be compatible.
        dto: {
          branchId: managerBranchId || null,
          timeframeId: finalData.timeframeId,
          slotTypeId: finalData.slotTypeId,
          startDate,
          endDate,
          status: finalData.status || 'Available',
          roomAssignments
        },
        weekDates,
        branchId: managerBranchId || null,
        timeframeId: finalData.timeframeId,
        slotTypeId: finalData.slotTypeId,
        startDate,
        endDate,
        status: finalData.status || 'Available',
        roomAssignments
      });

      toast.success(`Đã tạo thành công ${dates.length} ca giữ trẻ!`, {
        position: 'top-right',
        autoClose: 3000
      });

      navigate('/manager/branch-slots?refresh=true');
    } catch (error) {
      console.error('Error bulk creating branch slots:', error);
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
        onCancel={() => navigate('/manager/branch-slots')}
        loading={actionLoading}
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
