import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box, Typography } from '@mui/material';
import StepperForm from '../../../../components/Common/StepperForm';
import { AccessTime as BranchSlotIcon } from '@mui/icons-material';
import branchSlotService from '../../../../services/branchSlot.service';
import useBranchSlotDependencies from '../../../../hooks/useBranchSlotDependencies';
import Step1BasicInfo from './Step1BasicInfo';

const UpdateBranchSlot = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get branch slot ID from URL
  
  const [currentBranchId, setCurrentBranchId] = useState('');
  const {
    timeframeOptions,
    slotTypeOptions,
    loading: dependenciesLoading,
    fetchDependencies
  } = useBranchSlotDependencies(currentBranchId || null);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [branchSlotData, setBranchSlotData] = useState(null);
  
  const [formData, setFormData] = useState({
    timeframeId: '',
    slotTypeId: '',
    date: null,
    status: 'Available',
    branchId: ''
  });

  // Ref to keep latest formData for handleComplete
  const formDataRef = useRef(formData);

  
  // Keep ref in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Fetch dependencies and branch slot data on mount
  // Chỉ gọi một endpoint GET /api/BranchSlot/{id} để lấy tất cả dữ liệu cho 2 steps
  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);
        // Lấy dữ liệu ca giữ trẻ
        if (id) {
          const slotData = await branchSlotService.getBranchSlotById(id);
          setBranchSlotData(slotData);
          
          // Parse dữ liệu từ response cho Step 1: Basic Info
          const basicInfo = {
            timeframeId: slotData.timeframeId || '',
            slotTypeId: slotData.slotTypeId || '',
            date: slotData.date || null,
            status: slotData.status || 'Available',
            branchId: slotData.branchId || slotData.branch?.id || ''
          };
          
          // Chỉ set dữ liệu cơ bản
          setFormData(basicInfo);
          // Set branchId for filtered dependencies and refetch
          if (basicInfo.branchId) {
            setCurrentBranchId(basicInfo.branchId);
            // Refetch dependencies using the branchId for correct slot types
            await fetchDependencies();
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Không thể tải dữ liệu ca giữ trẻ', {
          position: "top-right",
          autoClose: 3000,
        });
        navigate('/manager/branch-slots');
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadData();
  }, [id, fetchDependencies, navigate]);

  // Step 1: Validate basic info only (no API call)
  const handleStep1Complete = useCallback(async (data) => {
    const currentData = { ...formData, ...data };
    
    if (!currentData.timeframeId || !currentData.slotTypeId || !currentData.date) {
      toast.error('Vui lòng điền đầy đủ thông tin!', {
        position: "top-right",
        autoClose: 3000,
      });
      return false;
    }

    setFormData(prev => ({ ...prev, ...currentData }));
    return true;
  }, [formData]);

  // Final completion - Execute API call to update branch slot
  const handleComplete = useCallback(async (dataFromStepper) => {
    if (!id) {
      toast.error('Không tìm thấy ID ca giữ trẻ!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Ưu tiên dữ liệu từ StepperForm (dataFromStepper) vì nó là dữ liệu mới nhất
    // Merge với branchId từ branchSlotData nếu chưa có
    const finalData = {
      ...dataFromStepper,
      branchId: dataFromStepper?.branchId || branchSlotData?.branchId || branchSlotData?.branch?.id
    };
    
    console.log('handleComplete - Data sources:', {
      dataFromStepper,
      branchSlotData: branchSlotData?.slotTypeId,
      finalData
    });
    
    if (!finalData.timeframeId || !finalData.slotTypeId || !finalData.date) {
      console.error('handleComplete - Validation failed:', {
        timeframeId: finalData.timeframeId,
        slotTypeId: finalData.slotTypeId,
        date: finalData.date,
        status: finalData.status
      });
      toast.error('Vui lòng điền đầy đủ thông tin cơ bản!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      // Format date to ISO string and calculate weekDate
      let formattedDate = null;
      let weekDate = 0;
      if (finalData.date) {
        let dateObj;
        if (finalData.date instanceof Date) {
          dateObj = finalData.date;
        } else if (typeof finalData.date === 'string') {
          // Parse date string as local date (YYYY-MM-DD format)
          // Avoid timezone issues by parsing as local date
          const dateStr = finalData.date.split('T')[0]; // Get YYYY-MM-DD part
          const [year, month, day] = dateStr.split('-').map(Number);
          dateObj = new Date(year, month - 1, day); // Month is 0-indexed, parse as local date
        } else {
          dateObj = new Date(finalData.date);
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

      // Step 1: Update Branch Slot - đảm bảo tất cả field đều có giá trị
      const submitData = {
        branchId: finalData.branchId,
        timeframeId: finalData.timeframeId,
        slotTypeId: finalData.slotTypeId,
        weekDate: weekDate,
        date: formattedDate,
        status: finalData.status || 'Available'
      };

      if (!submitData.branchId) {
        toast.error('Không tìm thấy BranchId!', {
          position: "top-right",
          autoClose: 3000,
        });
        setLoading(false);
        return;
      }

      console.log('Update BranchSlot - Request data:', {
        id,
        submitData,
        finalData,
        branchSlotData: branchSlotData?.slotTypeId
      });

      const response = await branchSlotService.updateBranchSlot(id, submitData);
      
      console.log('Update BranchSlot - Response:', response);

      toast.success('Cập nhật ca giữ trẻ thành công!', {
        position: "top-right",
        autoClose: 2000,
      });
      
      // Navigate về trang list và force reload data bằng cách thêm timestamp
      // Sử dụng replace: false để trigger location change và reload
      setTimeout(() => {
        navigate(`/manager/branch-slots?refresh=${Date.now()}`, { replace: false });
      }, 500);
    } catch (err) {
      console.error('Update BranchSlot - Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật ca giữ trẻ';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [id, formData, navigate, branchSlotData]);

  const handleCancel = useCallback(() => {
    navigate('/manager/branch-slots');
  }, [navigate]);

  const steps = useMemo(() => [
    {
      label: 'Thông tin cơ bản',
      component: Step1BasicInfo,
      validation: async (data) => {
        return await handleStep1Complete(data);
      }
    }
  ], [handleStep1Complete]);

  if (initialLoading) {
    return (
      <Box sx={{ 
        height: 'calc(100vh - 64px - 48px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography>Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px - 48px)', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Cập nhật Ca Giữ Trẻ"
        icon={<BranchSlotIcon />}
        initialData={formData}
        stepProps={{
          timeframeOptions,
          slotTypeOptions,
          dependenciesLoading,
          branchSlotId: id
        }}
      />
    </Box>
  );
};

export default UpdateBranchSlot;

