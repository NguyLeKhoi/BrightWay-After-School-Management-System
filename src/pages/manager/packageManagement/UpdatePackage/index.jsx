import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { CardGiftcard as PackageIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import StepperForm from '../../../../components/Common/StepperForm';
import Step1BasicInfo from './Step1BasicInfo';
import Step2GeneralInfo from './Step2GeneralInfo';
import Step3Pricing from './Step2Pricing';
import Step4Benefits from './Step3Benefits';
import Step5AssignSlotTypes from './Step4AssignSlotTypes';
import useManagerPackageDependencies from '../../../../hooks/useManagerPackageDependencies';
import packageService from '../../../../services/package.service';
import { extractBenefitIds, normalizeBenefitIds, toNumber } from '../../../../utils/packageForm.utils';

const UpdatePackage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    templates,
    templateOptions,
    studentLevelOptions,
    benefitOptions,
    loading: dependenciesLoading,
    error: dependenciesError,
    fetchDependencies
  } = useManagerPackageDependencies();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [formData, setFormData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );


  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        navigate('/manager/packages');
        return;
      }

      try {
        setInitialLoading(true);
        await fetchDependencies();
        const pkg = await packageService.getPackageById(id);

        setSelectedTemplateId(
          pkg.packageTemplateId || pkg.packageTemplate?.id || ''
        );
        setFormData({
          packageTemplateId: pkg.packageTemplateId || pkg.packageTemplate?.id || '',
          name: pkg.name || '',
          desc: pkg.desc || '',
          studentLevelId: pkg.studentLevelId || pkg.studentLevel?.id || '',
          isActive: pkg.isActive ?? true,
          price: pkg.price ?? '',
          durationInMonths: pkg.durationInMonths ?? '',
          totalSlots: pkg.totalSlots ?? '',
          benefitIds: normalizeBenefitIds(extractBenefitIds(pkg)),
          slotTypeIds: (pkg.slotTypes || []).map(st => st.id).filter(Boolean)
        });
      } catch (err) {
        const message = err?.response?.data?.message || err.message || 'Không thể tải dữ liệu gói bán';
        toast.error(message, { position: 'top-right', autoClose: 4000 });
        navigate('/manager/packages');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [id, fetchDependencies, navigate]);

  const handleTemplateSelect = useCallback(
    (templateId) => {
      setSelectedTemplateId(templateId);
      setFormData((prev) => ({
        ...(prev || {}),
        packageTemplateId: templateId
      }));
    },
    []
  );

  const handleComplete = useCallback(
    async (latestData) => {
      if (!id) {
        toast.error('Không tìm thấy ID gói bán');
        return;
      }

      const finalData = latestData || formData;
      if (
        !finalData ||
        !finalData.packageTemplateId ||
        !finalData.name ||
        !finalData.studentLevelId ||
        !finalData.price ||
        !finalData.durationInMonths ||
        !finalData.totalSlots
      ) {
        toast.error('Vui lòng hoàn thành đầy đủ thông tin trước khi cập nhật');
        return;
      }

      const benefitIds =
        finalData.benefitIds && finalData.benefitIds.length > 0
          ? normalizeBenefitIds(finalData.benefitIds)
          : normalizeBenefitIds(extractBenefitIds(selectedTemplate));

      const payload = {
        name: finalData.name,
        desc: finalData.desc,
        studentLevelId: finalData.studentLevelId,
        isActive: finalData.isActive ?? true,
        packageTemplateId: finalData.packageTemplateId,
        price: toNumber(finalData.price),
        durationInMonths: toNumber(finalData.durationInMonths),
        totalSlots: toNumber(finalData.totalSlots),
        benefitIds
      };

      try {
        await packageService.updateMyBranchPackage(id, payload);
        
        // Assign slot types if any were selected
        const slotTypeIds = finalData.slotTypeIds && finalData.slotTypeIds.length > 0
          ? finalData.slotTypeIds
          : [];
        
        try {
          await packageService.assignSlotTypesToPackage(id, { slotTypeIds });
        } catch (slotTypeErr) {

          // Don't fail the whole operation if slot types assignment fails
          toast.warning('Gói đã được cập nhật nhưng có lỗi khi gán loại ca giữ trẻ', {
            position: 'top-right',
            autoClose: 4000
          });
        }
        
        toast.success('Cập nhật gói bán thành công!', { position: 'top-right', autoClose: 2000 });
        navigate('/manager/packages');
      } catch (err) {
        const message = err?.response?.data?.message || err.message || 'Không thể cập nhật gói bán';
        toast.error(message, { position: 'top-right', autoClose: 4000 });
      }
    },
    [id, selectedTemplate, navigate, formData]
  );

  const handleCancel = useCallback(() => {
    navigate('/manager/packages');
  }, [navigate]);

  const steps = useMemo(
    () => [
      {
        label: 'Chọn mẫu gói',
        component: Step1BasicInfo
      },
      {
        label: 'Thông tin chung',
        component: Step2GeneralInfo
      },
      {
        label: 'Giá & thời hạn',
        component: Step3Pricing
      },
      {
        label: 'Lợi ích',
        component: Step4Benefits
      },
      {
        label: 'Loại ca giữ trẻ',
        component: Step5AssignSlotTypes
      }
    ],
    []
  );

  if (initialLoading || !formData) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px - 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography>Đang tải dữ liệu gói bán...</Typography>
      </Box>
    );
  }

  if (dependenciesError) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px - 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography color="error">{dependenciesError}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Cập nhật gói bán"
        icon={<PackageIcon />}
        initialData={formData}
        stepProps={{
          templateOptions,
          templates,
          studentLevelOptions,
          benefitOptions,
          dependenciesLoading,
          selectedTemplateId,
          selectedTemplate,
          onTemplateSelect: handleTemplateSelect,
          packageId: id
        }}
      />
    </Box>
  );
};

export default UpdatePackage;



