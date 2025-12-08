import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { PersonAdd as AddChildIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import StepperForm from '../../../../components/Common/StepperForm';
import Step1BasicInfo from './Step1BasicInfo';
import Step2Associations from './Step2Associations';
import useUserChildDependencies from '../../../../hooks/useUserChildDependencies';
import studentService from '../../../../services/student.service';

const CHILD_DEFAULT_VALUES = {
  name: '',
  dateOfBirth: '',
  note: '',
  image: '',
  branchId: '',
  schoolId: '',
  studentLevelId: ''
};

const CreateChild = () => {
  const navigate = useNavigate();

  const {
    branchOptions,
    schoolOptions,
    studentLevelOptions,
    loading: dependenciesLoading,
    error: dependenciesError,
    fetchDependencies
  } = useUserChildDependencies();

  const [formData, setFormData] = useState(CHILD_DEFAULT_VALUES);
  const [loading, setLoading] = useState(false);

  const formDataRef = useRef(formData);


  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const handleStep1Complete = useCallback(
    async (data) => {
      if (!data.name?.trim() || !data.dateOfBirth) {
        toast.error('Vui lòng nhập đầy đủ tên và ngày sinh');
        return false;
      }
      setFormData((prev) => ({ ...prev, ...data }));
      return true;
    },
    []
  );

  const handleStep2Complete = useCallback(
    async (data) => {
      // Ensure branchId, schoolId, and studentLevelId are strings
      const normalizedData = {
        ...data,
        branchId: data.branchId ? String(data.branchId) : '',
        schoolId: data.schoolId ? String(data.schoolId) : '',
        studentLevelId: data.studentLevelId ? String(data.studentLevelId) : ''
      };
      
      // User must manually select branch, school, and student level
      if (!normalizedData.branchId || !normalizedData.schoolId || !normalizedData.studentLevelId) {
        toast.error('Vui lòng chọn đầy đủ chi nhánh, trường học và cấp độ');
        return false;
      }
      setFormData((prev) => ({ ...prev, ...normalizedData }));
      return true;
    },
    []
  );

  const handleComplete = useCallback(async (latestData) => {
    const finalData = latestData || formDataRef.current;
    
    // Ensure all IDs are strings
    const normalizedBranchId = finalData.branchId ? String(finalData.branchId) : '';
    const normalizedSchoolId = finalData.schoolId ? String(finalData.schoolId) : '';
    const normalizedStudentLevelId = finalData.studentLevelId ? String(finalData.studentLevelId) : '';
    
    if (!finalData.name || !finalData.dateOfBirth || !normalizedBranchId || !normalizedSchoolId || !normalizedStudentLevelId) {
      toast.error('Vui lòng hoàn thành đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      // Basic info (required)
      formDataToSend.append('Name', finalData.name);
      
      // Format DateOfBirth to YYYY-MM-DD
      let dateOfBirth;
      if (finalData.dateOfBirth instanceof Date) {
        const year = finalData.dateOfBirth.getFullYear();
        const month = String(finalData.dateOfBirth.getMonth() + 1).padStart(2, '0');
        const day = String(finalData.dateOfBirth.getDate()).padStart(2, '0');
        dateOfBirth = `${year}-${month}-${day}`;
      } else if (typeof finalData.dateOfBirth === 'string') {
        // If already a string, extract date part only
        dateOfBirth = finalData.dateOfBirth.split('T')[0];
      } else if (finalData.dateOfBirth) {
        // Fallback: try to parse as Date
        const d = new Date(finalData.dateOfBirth);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateOfBirth = `${year}-${month}-${day}`;
      }
      
      console.log('DateOfBirth being sent:', dateOfBirth); // Debug log
      if (dateOfBirth) {
        formDataToSend.append('DateOfBirth', dateOfBirth);
      }
      
      // Optional fields
      if (finalData.note) {
        formDataToSend.append('Note', finalData.note);
      }
      
      // ImageFile (optional) - if image is a File object, append it; if it's a URL string, skip
      if (finalData.image) {
        if (finalData.image instanceof File) {
          formDataToSend.append('ImageFile', finalData.image);
        }
        // If image is a URL string, we don't send it as ImageFile
        // Backend expects ImageFile to be a file, not a URL
      }
      
      // Associations (required) - ensure all are strings
      formDataToSend.append('BranchId', normalizedBranchId);
      formDataToSend.append('SchoolId', normalizedSchoolId);
      formDataToSend.append('StudentLevelId', normalizedStudentLevelId);
      
      // Document fields are NOT included - user requested to remove document section

      await studentService.registerChild(formDataToSend);
      toast.success('Đăng ký con thành công! Hồ sơ sẽ được xem xét và duyệt bởi quản lý.', {
        position: 'top-right',
        autoClose: 3000
      });
      navigate('/user/management/children');
    } catch (err) {
      const message = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Không thể đăng ký con';
      toast.error(message, { position: 'top-right', autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/user/management/children');
  }, [navigate]);

  const steps = useMemo(
    () => [
      {
        label: 'Thông tin cơ bản',
        component: Step1BasicInfo,
        validation: handleStep1Complete
      },
      {
        label: 'Chi nhánh & Trường học',
        component: Step2Associations,
        validation: handleStep2Complete
      }
    ],
    [handleStep1Complete, handleStep2Complete]
  );

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      {dependenciesError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {dependenciesError}
        </Typography>
      )}
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Đăng ký con"
        icon={<AddChildIcon />}
        initialData={formData}
        stepProps={{
          branchOptions,
          schoolOptions,
          studentLevelOptions,
          dependenciesLoading: dependenciesLoading || loading
        }}
      />
    </Box>
  );
};

export default CreateChild;

