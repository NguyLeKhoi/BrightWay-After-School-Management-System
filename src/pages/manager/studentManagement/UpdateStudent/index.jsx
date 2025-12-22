import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { School as StudentIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import StepperForm from '../../../../components/Common/StepperForm';
import Step1BasicInfo from './Step1BasicInfo';
import Step2Associations from './Step2Associations';
import Step3AdditionalInfo from './Step3AdditionalInfo';
import useStudentDependencies from '../../../../hooks/useStudentDependencies';
import studentService from '../../../../services/student.service';
import userService from '../../../../services/user.service';
import { STUDENT_DEFAULT_VALUES, transformStudentPayload } from '../../../../utils/studentForm.utils';

const UpdateStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    parentOptions,
    schoolOptions,
    studentLevelOptions,
    loading: dependenciesLoading,
    error: dependenciesError,
    fetchDependencies
  } = useStudentDependencies();

  const [branchInfo, setBranchInfo] = useState({
    id: '',
    name: 'Chi nhánh của bạn'
  });
  const [formData, setFormData] = useState(STUDENT_DEFAULT_VALUES);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const formDataRef = useRef(formData);


  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        navigate('/manager/students');
        return;
      }

      try {
        setInitialLoading(true);
        await fetchDependencies();
        const student = await studentService.getStudentById(id);

        // Handle userId - could be direct property or nested in user object
        const userId = student.userId || student.user?.id || '';

        const preparedData = {
          name: student.name || '',
          dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
          userId: userId,
          branchId: student.branchId || student.branch?.id || '',
          schoolId: student.schoolId || student.school?.id || '',
          studentLevelId: student.studentLevelId || student.studentLevel?.id || '',
          image: student.image || '',
          note: student.note || ''
        };

        setFormData(preparedData);
        setBranchInfo({
          id: student.branchId || '',
          name: student.branch?.branchName || 'Chi nhánh của bạn'
        });
      } catch (err) {

        const message = err?.response?.data?.message || err.message || 'Không thể tải dữ liệu học sinh';
        toast.error(message, { position: 'top-right', autoClose: 4000 });
        navigate('/manager/students');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [id, fetchDependencies, navigate]);

  useEffect(() => {
    const ensureBranchName = async () => {
      if (branchInfo.id && branchInfo.name && branchInfo.name !== 'Chi nhánh của bạn') {
        return;
      }

      try {
        const currentUser = await userService.getCurrentUser();
        const managerBranchName =
          currentUser?.managerProfile?.branchName ||
          currentUser?.branchName ||
          currentUser?.managerBranchName ||
          branchInfo.name;
        setBranchInfo((prev) => ({
          id: prev.id || currentUser?.managerProfile?.branchId || currentUser?.branchId || currentUser?.managerBranchId || '',
          name: managerBranchName
        }));
      } catch (err) {
      }
    };

    ensureBranchName();
  }, [branchInfo.id, branchInfo.name]);

  const handleStep1Complete = useCallback(async (data) => {
    if (!data.name?.trim() || !data.dateOfBirth) {
      toast.error('Vui lòng nhập đầy đủ thông tin học sinh');
      return false;
    }
    setFormData((prev) => ({ ...prev, ...data }));
    return true;
  }, []);

  const handleStep2Complete = useCallback(async (data) => {
    if (!data.userId || !data.schoolId || !data.studentLevelId) {
      toast.error('Vui lòng chọn phụ huynh, trường học và cấp độ');
      return false;
    }
    setFormData((prev) => ({ ...prev, ...data }));
    return true;
  }, []);

  const handleStep3Complete = useCallback(async (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    return true;
  }, []);

  const handleComplete = useCallback(async (latestData) => {
    if (!id) {
      toast.error('Không tìm thấy ID học sinh');
      return;
    }

    const finalData = latestData || formDataRef.current;
    if (!finalData.name || !finalData.dateOfBirth || !finalData.userId || !finalData.schoolId || !finalData.studentLevelId) {
      toast.error('Vui lòng hoàn thành đầy đủ thông tin trước khi cập nhật');
      return;
    }

    const payload = transformStudentPayload({
      ...finalData,
      branchId: finalData.branchId || branchInfo.id || null
    });

    setLoading(true);
    try {
      await studentService.updateStudent(id, payload);
      toast.success('Cập nhật học sinh thành công!', { position: 'top-right', autoClose: 2000 });
      navigate('/manager/students');
    } catch (err) {
      const message = err?.response?.data?.detail || err?.response?.data?.message || err.message || 'Không thể cập nhật học sinh';
      toast.error(message, { position: 'top-right', autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  }, [branchInfo.id, id, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/manager/students');
  }, [navigate]);

  const steps = useMemo(
    () => [
      {
        label: 'Thông tin học sinh',
        component: Step1BasicInfo,
        validation: handleStep1Complete
      },
      {
        label: 'Liên kết phụ huynh & trường',
        component: Step2Associations,
        validation: handleStep2Complete
      },
      {
        label: 'Thông tin bổ sung',
        component: Step3AdditionalInfo,
        validation: handleStep3Complete
      }
    ],
    [handleStep1Complete, handleStep2Complete, handleStep3Complete]
  );

  if (initialLoading) {
    return (
      <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Đang tải dữ liệu học sinh...</Typography>
      </Box>
    );
  }

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
        title="Cập nhật Học Sinh"
        icon={<StudentIcon />}
        initialData={formData}
        stepProps={{
          parentOptions,
          schoolOptions,
          studentLevelOptions,
          dependenciesLoading: dependenciesLoading || loading,
          branchInfo
        }}
      />
    </Box>
  );
};

export default UpdateStudent;



