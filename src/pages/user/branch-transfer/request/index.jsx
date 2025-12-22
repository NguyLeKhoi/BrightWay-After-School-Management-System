import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { SwapHoriz as TransferIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import StepperForm from '../../../../components/Common/StepperForm';
import Step1ChildAndBranch from './Step1ChildAndBranch';
import Step2SchoolAndLevel from './Step2SchoolAndLevel';
import Step3DocumentAndReason from './Step3DocumentAndReason';
import branchTransferService from '../../../../services/branchTransfer.service';
import branchService from '../../../../services/branch.service';
import schoolService from '../../../../services/school.service';
import studentLevelService from '../../../../services/studentLevel.service';
import studentService from '../../../../services/student.service';
import { useApp } from '../../../../contexts/AppContext';
import useContentLoading from '../../../../hooks/useContentLoading';

const TRANSFER_DEFAULT_VALUES = {
  studentId: '',
  targetBranchId: '',
  changeSchool: false,
  targetSchoolId: '',
  changeLevel: false,
  targetStudentLevelId: '',
  documentFile: null,
  requestReason: ''
};

const CreateTransferRequest = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();

  const [children, setChildren] = useState([]);
  const [branches, setBranches] = useState([]);
  const [schools, setSchools] = useState([]);
  const [studentLevels, setStudentLevels] = useState([]);

  // selectedChild sẽ được tính toán trong stepProps dựa trên current formData từ StepperForm
  // Vì chúng ta không có access trực tiếp vào formData của StepperForm ở đây,
  // nên stepProps sẽ tính toán selectedChild trong từng step component

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    showLoading();
    try {
      // Load children with detailed information
      const childrenResponse = await studentService.getMyChildren();

      const childrenList = Array.isArray(childrenResponse)
        ? childrenResponse
        : (Array.isArray(childrenResponse?.items) ? childrenResponse.items : []);

      // Load detailed information for each child if needed
      const detailedChildren = await Promise.all(
        childrenList.map(async (child) => {
          try {
            // Get detailed information for each child
            const detailedChild = await studentService.getMyChildById(child.id);
            return { ...child, ...detailedChild };
          } catch (error) {
            // If detailed API fails, return original data

            return child;
          }
        })
      );

      setChildren(detailedChildren);

      // Load branches
      const branchesResponse = await branchService.getAllBranches();
      const branchesList = Array.isArray(branchesResponse)
        ? branchesResponse
        : (Array.isArray(branchesResponse?.items) ? branchesResponse.items : []);
      setBranches(branchesList);

      // Load schools
      const schoolsResponse = await schoolService.getAllSchools();
      const schoolsList = Array.isArray(schoolsResponse)
        ? schoolsResponse
        : (Array.isArray(schoolsResponse?.items) ? schoolsResponse.items : []);
      setSchools(schoolsList);

      // Load student levels
      const levelsResponse = await studentLevelService.getAllStudentLevels();
      const levelsList = Array.isArray(levelsResponse)
        ? levelsResponse
        : (Array.isArray(levelsResponse?.items) ? levelsResponse.items : []);
      setStudentLevels(levelsList);

    } catch (error) {
      showGlobalError('Không thể tải dữ liệu ban đầu');
    } finally {
      hideLoading();
    }
  };


  const handleStep1Complete = useCallback(
    async (data) => {
      if (!data.studentId) {
        toast.error('Vui lòng chọn con');
        return false;
      }

      if (!data.targetBranchId) {
        toast.error('Vui lòng chọn chi nhánh đích');
        return false;
      }

      const child = children.find(c => c.id === data.studentId);
      if (!child) {
        toast.error('Không tìm thấy thông tin con');
        return false;
      }

      if (child.branchId === data.targetBranchId) {
        toast.error('Chi nhánh đích phải khác với chi nhánh hiện tại');
        return false;
      }

      return true;
    },
    [children]
  );

  const handleStep2Complete = useCallback(
    async (data) => {
      // Validate if changing school
      if (data.changeSchool && !data.targetSchoolId) {
        toast.error('Vui lòng chọn trường học đích');
        return false;
      }

      // Validate if changing level
      if (data.changeLevel && !data.targetStudentLevelId) {
        toast.error('Vui lòng chọn cấp độ học sinh đích');
        return false;
      }

      // Check if target branch supports the selected school/level
      if (data.changeSchool || data.changeLevel) {
        const targetBranch = branches.find(b => b.id === data.targetBranchId);
        if (targetBranch) {
          if (data.changeSchool && !targetBranch.schools?.some(s => s.id === data.targetSchoolId)) {
            toast.error('Chi nhánh đích không hỗ trợ trường học đã chọn');
            return false;
          }
          if (data.changeLevel && !targetBranch.studentLevels?.some(l => l.id === data.targetStudentLevelId)) {
            toast.error('Chi nhánh đích không hỗ trợ cấp độ học sinh đã chọn');
            return false;
          }
        }
      }

      return true;
    },
    [branches]
  );

  const handleStep3Complete = useCallback(
    async (data) => {
      // Validate document if changing school/level
      if ((data.changeSchool || data.changeLevel) && !data.documentFile) {
        toast.error('Vui lòng tải lên tài liệu hỗ trợ khi thay đổi trường học hoặc cấp độ');
        return false;
      }

      return true;
    },
    []
  );

  const handleComplete = useCallback(async (finalData) => {
    if (!finalData.studentId) {
      toast.error('Vui lòng chọn học sinh');
      return;
    }

    if (!finalData.targetBranchId) {
      toast.error('Vui lòng chọn chi nhánh đích');
      return;
    }

    showLoading();
    try {
      const requestData = {
        studentId: finalData.studentId,
        targetBranchId: finalData.targetBranchId,
        changeSchool: finalData.changeSchool,
        targetSchoolId: finalData.changeSchool ? finalData.targetSchoolId : undefined,
        changeLevel: finalData.changeLevel,
        targetStudentLevelId: finalData.changeLevel ? finalData.targetStudentLevelId : undefined,
        documentFile: finalData.documentFile,
        requestReason: finalData.requestReason || undefined
      };

      await branchTransferService.createTransferRequest(requestData);

      toast.success('Tạo yêu cầu chuyển chi nhánh thành công!', {
        position: 'top-right',
        autoClose: 3000
      });

      navigate('/user/branch-transfer/requests');
    } catch (err) {
      const message = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Không thể tạo yêu cầu chuyển chi nhánh';
      toast.error(message, { position: 'top-right', autoClose: 4000 });
    } finally {
      hideLoading();
    }
  }, [navigate, showLoading, hideLoading]);

  const handleCancel = useCallback(() => {
    navigate('/user/branch-transfer/requests');
  }, [navigate]);

  const steps = useMemo(
    () => [
      {
        label: 'Chọn con & Chi nhánh',
        component: Step1ChildAndBranch,
        validation: handleStep1Complete
      },
      {
        label: 'Trường học & Cấp độ',
        component: Step2SchoolAndLevel,
        validation: handleStep2Complete
      },
      {
        label: 'Tài liệu & Lý do',
        component: Step3DocumentAndReason,
        validation: handleStep3Complete
      }
    ],
    [handleStep1Complete, handleStep2Complete, handleStep3Complete]
  );

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Tạo yêu cầu chuyển chi nhánh"
        icon={<TransferIcon />}
        initialData={TRANSFER_DEFAULT_VALUES}
        stepProps={{
          children,
          branches,
          schools,
          studentLevels,
          isLoading,
          request: null // For new request creation, no existing request data
        }}
      />
    </Box>
  );
};

export default CreateTransferRequest;

