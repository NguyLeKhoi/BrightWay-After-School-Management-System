import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const CreatePackage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get('templateId') || '';

  const {
    templates,
    templateOptions,
    studentLevelOptions,
    benefitOptions,
    loading: dependenciesLoading,
    error: dependenciesError,
    fetchDependencies
  } = useManagerPackageDependencies();

  const [selectedTemplateId, setSelectedTemplateId] = useState(templateParam);
  const [formData, setFormData] = useState({
    packageTemplateId: templateParam || '',
    name: '',
    desc: '',
    studentLevelId: '',
    isActive: true,
    price: '',
    durationInMonths: '',
    totalSlots: '',
    benefitIds: [],
    slotTypeIds: []
  });


  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => String(template.id) === String(selectedTemplateId)) || null,
    [templates, selectedTemplateId]
  );

  useEffect(() => {
    if (templateParam && templates.length > 0 && !selectedTemplateId) {
      const exists = templates.find((template) => String(template.id) === String(templateParam));
      if (exists) {
        setSelectedTemplateId(templateParam);
        setFormData((prev) => ({ ...prev, packageTemplateId: templateParam }));
      }
    }
  }, [templateParam, templates, selectedTemplateId]);

  useEffect(() => {
    if (selectedTemplate) {
      setFormData((prev) => {
        const next = { ...prev, packageTemplateId: selectedTemplate.id };
        if (!prev.price) {
          next.price = selectedTemplate.defaultPrice ?? '';
        }
        if (!prev.durationInMonths) {
          next.durationInMonths = selectedTemplate.defaultDurationInMonths ?? '';
        }
        if (!prev.totalSlots) {
          next.totalSlots = selectedTemplate.defaultTotalSlots ?? '';
        }
        if (!prev.benefitIds || prev.benefitIds.length === 0) {
          next.benefitIds = normalizeBenefitIds(extractBenefitIds(selectedTemplate));
        }
        return next;
      });
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = useCallback(
    (templateId) => {
      setSelectedTemplateId(templateId);
      const template = templates.find((item) => String(item.id) === String(templateId));
      if (template) {
        const templateBenefitIds = normalizeBenefitIds(extractBenefitIds(template));
        setFormData((prev) => ({
          ...prev,
          packageTemplateId: templateId,
          price: prev.price || template.defaultPrice || '',
          durationInMonths: prev.durationInMonths || template.defaultDurationInMonths || '',
          totalSlots: prev.totalSlots || template.defaultTotalSlots || '',
          benefitIds:
            prev.benefitIds && prev.benefitIds.length > 0 ? prev.benefitIds : templateBenefitIds
        }));
      } else {
        setFormData((prev) => ({ ...prev, packageTemplateId: templateId }));
      }
    },
    [templates]
  );

  const handleComplete = useCallback(
    async (latestData) => {
      const finalData = latestData || formData;

      if (
        !finalData.packageTemplateId ||
        !finalData.name ||
        !finalData.studentLevelId ||
        !finalData.price ||
        !finalData.durationInMonths ||
        !finalData.totalSlots
      ) {
        toast.error('Vui lòng hoàn thành đầy đủ thông tin trước khi tạo gói');
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
        const created = await packageService.createMyBranchPackage(payload);
        
        // Assign slot types if any were selected
        const slotTypeIds = finalData.slotTypeIds && finalData.slotTypeIds.length > 0
          ? finalData.slotTypeIds
          : [];
        
        if (slotTypeIds.length > 0) {
          try {
            await packageService.assignSlotTypesToPackage(created.id, { slotTypeIds });
          } catch (slotTypeErr) {

            // Don't fail the whole operation if slot types assignment fails
            toast.warning('Gói đã được tạo nhưng có lỗi khi gán loại ca giữ trẻ', {
              position: 'top-right',
              autoClose: 4000
            });
          }
        }
        
        toast.success('Tạo gói bán thành công!', { position: 'top-right', autoClose: 2000 });
        navigate('/manager/packages');
      } catch (err) {
        const message = err?.response?.data?.message || err.message || 'Không thể tạo gói bán';
        toast.error(message, { position: 'top-right', autoClose: 4000 });
      }
    },
    [navigate, selectedTemplate]
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

  // Skip step 1 (chọn mẫu gói) if template is already selected from dialog
  const shouldSkipStep1 = !!templateParam;
  const initialStep = shouldSkipStep1 ? 1 : 0;
  const skipSteps = shouldSkipStep1 ? [0] : [];

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Tạo gói bán"
        icon={<PackageIcon />}
        initialData={formData}
        initialStep={initialStep}
        skipSteps={skipSteps}
        stepProps={{
          templateOptions,
          templates,
          studentLevelOptions,
          benefitOptions,
          dependenciesLoading,
          selectedTemplateId,
          selectedTemplate,
          onTemplateSelect: handleTemplateSelect,
          isTemplatePreSelected: !!templateParam
        }}
      />
    </Box>
  );
};

export default CreatePackage;



