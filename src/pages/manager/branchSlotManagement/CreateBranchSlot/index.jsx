import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box } from '@mui/material';
import { AccessTime as BranchSlotIcon } from '@mui/icons-material';
import StepperForm from '../../../../components/Common/StepperForm';
import branchSlotService from '../../../../services/branchSlot.service';
import userService from '../../../../services/user.service';
import useBranchSlotDependencies from '../../../../hooks/useBranchSlotDependencies';
import { useAuth } from '../../../../contexts/AuthContext';
import Step1BasicInfo from './Step1BasicInfo';
import Step2AssignRooms from './Step2AssignRooms';

const CreateBranchSlot = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();

  const [actionLoading, setActionLoading] = useState(false);
  const [managerBranchId, setManagerBranchId] = useState('');

  const {
    timeframeOptions,
    slotTypeOptions,
    roomOptions,
    studentLevelOptions,
    staffOptions,
    loading: dependenciesLoading,
    fetchDependencies
  } = useBranchSlotDependencies(managerBranchId || null);
  const [formData, setFormData] = useState(() => {
    const timeframeId = searchParams.get('timeframeId') || '';
    const slotTypeId = searchParams.get('slotTypeId') || '';
    const weekDateParam = searchParams.get('weekDate');
    const parsedWeekDate =
      weekDateParam !== null && !isNaN(Number(weekDateParam)) ? String(Number(weekDateParam)) : '';

    return {
      timeframeId,
      slotTypeId,
      weekDate: parsedWeekDate || '', // Will be calculated from date
      date: null,
      status: 'Available',
      roomIds: [],
      staffAssignments: [],
      branchSlotId: '',
      branchId: ''
    };
  });

  const formDataRef = React.useRef(formData);


  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Hook will automatically refetch when managerBranchId changes
  // This useEffect ensures refetch when branchId is first loaded
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
      setFormData((prev) => {
        if (prev.branchId) return prev;
        const updated = { ...prev, branchId: existingBranchId };
        formDataRef.current = updated;
        return updated;
      });
      return;
    }

    const fetchBranch = async () => {
      try {
        const currentUser = await userService.getCurrentUser();
        const branchId = extractBranchId(currentUser);
        if (branchId) {
          setManagerBranchId(branchId);
          setFormData((prev) => {
            if (prev.branchId) return prev;
            const updated = { ...prev, branchId };
            formDataRef.current = updated;
            return updated;
          });
        }
      } catch (err) {
      }
    };

    fetchBranch();
  }, [authUser]);

  const updateFormData = useCallback((newData) => {
    setFormData((prev) => {
      const updated = { ...prev, ...newData };
      formDataRef.current = updated;
      return updated;
    });
  }, []);

  const ensureBranchSlotExists = useCallback(async (dataOverride = {}) => {
    const currentData = { ...formDataRef.current, ...dataOverride };

    if (
      !currentData.timeframeId ||
      !currentData.slotTypeId ||
      !currentData.date
    ) {
      throw new Error('Vui lòng điền đầy đủ thông tin!');
    }

    const branchIdToUse = currentData.branchId || managerBranchId || currentData?.branch?.id || null;

    // Format date to ISO string and calculate weekDate
    // BE expects: DateTime? and calculates DayOfWeek from it
    // C# DayOfWeek: Sunday=0, Monday=1, ..., Saturday=6 (same as JS)
    let formattedDate = null;
    let weekDate = 0;
    if (currentData.date) {
      let dateObj;
      if (currentData.date instanceof Date) {
        dateObj = currentData.date;
      } else if (typeof currentData.date === 'string') {
        // Parse date string as local date (YYYY-MM-DD format)
        // Avoid timezone issues by parsing as local date
        const dateStr = currentData.date.split('T')[0]; // Get YYYY-MM-DD part
        const [year, month, day] = dateStr.split('-').map(Number);
        dateObj = new Date(year, month - 1, day); // Month is 0-indexed, parse as local date
      } else {
        dateObj = new Date(currentData.date);
      }
      
      if (!isNaN(dateObj.getTime())) {
        // Calculate weekDate from local date FIRST (before any timezone conversion)
        // This ensures we get the correct day of week for the date user selected
        weekDate = dateObj.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
        
        // Format date to ISO string with UTC+7 timezone at noon (12:00)
        // Using noon instead of midnight avoids timezone conversion issues
        // that could shift the date when BE parses it
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        // Format as UTC+7 noon to preserve the exact date even if timezone conversion occurs
        formattedDate = `${year}-${month}-${day}T12:00:00.000+07:00`;
      }
    }

    const payload = {
      branchId: branchIdToUse,
      timeframeId: currentData.timeframeId,
      slotTypeId: currentData.slotTypeId,
      weekDate: weekDate,
      date: formattedDate,
      studentLevelId: currentData.studentLevelId || null,
      status: currentData.status || 'Available'
    };

    const updateState = (nextData) => {
      formDataRef.current = nextData;
      setFormData(nextData);
    };

    if (currentData.branchSlotId) {
      await branchSlotService.updateBranchSlot(currentData.branchSlotId, payload);
      updateState({ ...currentData, branchId: branchIdToUse || currentData.branchId });
      return currentData.branchSlotId;
    }

    const result = await branchSlotService.createMyBranchSlot(payload);
    if (!result?.id) {
      throw new Error('Không thể tạo ca giữ trẻ');
    }

    const updatedData = {
      ...currentData,
      branchSlotId: result.id,
      branchId: result.branchId || branchIdToUse || currentData.branchId
    };
    updateState(updatedData);
    return result.id;
  }, [managerBranchId]);

  const handleStep1Complete = useCallback(
    async (data) => {
      updateFormData(data);
      setActionLoading(true);
      try {
        const branchSlotId = await ensureBranchSlotExists(data);
        toast.success('Lưu thông tin ca giữ trẻ thành công! Tiếp tục gán phòng.', {
          position: 'top-right',
          autoClose: 2500
        });
        return !!branchSlotId;
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error.message || 'Không thể lưu thông tin ca giữ trẻ';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 4000
        });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [ensureBranchSlotExists, updateFormData]
  );

  const handleStep2Complete = useCallback(
    async (data) => {
      const mergedRooms = Array.isArray(data.roomIds) ? data.roomIds : [];
      const mergedStaffAssignments = Array.isArray(data.staffAssignments) ? data.staffAssignments : [];
      updateFormData({ roomIds: mergedRooms, staffAssignments: mergedStaffAssignments });

      setActionLoading(true);
      try {
        const branchSlotId = await ensureBranchSlotExists();
        
        if (!branchSlotId) {
          throw new Error('Không tìm thấy ID ca giữ trẻ');
        }

        // Gán phòng nếu có
        if (mergedRooms.length > 0) {
          await branchSlotService.assignRooms({
            branchSlotId,
            roomIds: mergedRooms
          });
        }

        // Gán nhân viên nếu có
        if (mergedStaffAssignments.length > 0) {
          // Validate staff assignments
          const validAssignments = mergedStaffAssignments.filter(
            assignment => assignment.userId && assignment.userId !== ''
          );

          if (validAssignments.length > 0) {
            // Gán từng nhân viên
            const assignPromises = validAssignments.map(assignment =>
              branchSlotService.assignStaff({
                branchSlotId,
                userId: assignment.userId,
                roomId: assignment.roomId || null,
                name: assignment.name || null
              })
            );

            await Promise.all(assignPromises);
          }
        }

        if (mergedRooms.length > 0 || mergedStaffAssignments.length > 0) {
          toast.success('Gán phòng và nhân viên thành công!', {
            position: 'top-right',
            autoClose: 2500
          });
        } else {
          toast.info('Bạn có thể gán phòng và nhân viên sau.', {
            position: 'top-right',
            autoClose: 2500
          });
        }

        return true;
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error.message || 'Không thể gán phòng và nhân viên';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 4000
        });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [ensureBranchSlotExists, updateFormData]
  );

  const handleComplete = useCallback(() => {
    toast.success('Hoàn tất tạo ca giữ trẻ! Bạn có thể gán nhân viên sau.', {
      position: 'top-right',
      autoClose: 2500
    });
    navigate('/manager/branch-slots');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/manager/branch-slots');
  }, [navigate]);

  const steps = useMemo(
    () => [
      {
        label: 'Thông tin cơ bản',
        component: Step1BasicInfo,
        validation: handleStep1Complete
      },
      {
        label: 'Gán phòng và nhân viên',
        component: Step2AssignRooms,
        validation: handleStep2Complete
      }
    ],
    [handleStep1Complete, handleStep2Complete]
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
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Tạo Ca Giữ Trẻ Mới"
        icon={<BranchSlotIcon />}
        initialData={formData}
        showStepConfirmation={true}
        stepProps={{
          timeframeOptions,
          slotTypeOptions,
          studentLevelOptions,
          roomOptions,
          staffOptions,
          dependenciesLoading,
          actionLoading
        }}
      />
    </Box>
  );
};

export default CreateBranchSlot;

