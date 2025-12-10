import React, { useMemo, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Box } from '@mui/material';
import { DashboardCustomize as TemplateIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StepperForm from '../../../../components/Common/StepperForm';
import packageTemplateService from '../../../../services/packageTemplate.service';
import { createTemplateFormFields } from '../../../../definitions/package/formFields';
import Form from '../../../../components/Common/Form';
import { 
  packageTemplateSchema, 
  packageTemplateBasicSchema,
  packageTemplatePricingSchema,
  packageTemplateSlotsSchema
} from '../../../../utils/validationSchemas/packageSchemas';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { toast } from 'react-toastify';

// Step 1: Basic Info (only validate, don't create template yet)
const Step1TemplateBasic = forwardRef(({ data, updateData }, ref) => {
  const formRef = React.useRef(null);
  useImperativeHandle(ref, () => ({
    async submit() {
      // Only validate, don't submit to API yet
      if (formRef.current?.validate) {
        const isValid = await formRef.current.validate();
        if (isValid) {
          // Get form values and save to data
          const formValues = formRef.current.getValues();
          updateData({ templateForm: formValues });
          return true;
        }
        return false;
      }
      // Fallback: use submit method but override handleSubmit
      if (formRef.current?.submit) {
        // Trigger validation only
        const isValid = await formRef.current.validate();
        if (isValid) {
          const formValues = formRef.current.getValues();
          updateData({ templateForm: formValues });
          return true;
        }
        return false;
      }
      return false;
    }
  }));

  const handleSubmit = async (formValues) => {
    // Only save data, don't create template yet
    updateData({ templateForm: formValues });
      return true;
  };

  // Use basic fields including status
  const fields = useMemo(() => {
    const all = createTemplateFormFields({ templateActionLoading: false });
    const keep = new Set(['name', 'isActive', 'desc']);
    return all.filter(f => keep.has(f.name));
  }, []);

  return (
    <Box>
      <Form
        ref={formRef}
        key={`create-template-step`}
        schema={packageTemplateBasicSchema}
        defaultValues={{ isActive: true, ...(data.templateForm || {}) }}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={false}
        disabled={false}
        fields={fields}
      />
    </Box>
  );
});

// Step 2: Pricing & Duration (only validate and save data, don't submit API yet)
const Step2PricingDuration = forwardRef(({ data, updateData }, ref) => {
  const formRef = React.useRef(null);
  useImperativeHandle(ref, () => ({
    async submit() {
      // Only validate, don't submit to API yet
      if (formRef.current?.validate) {
        const isValid = await formRef.current.validate();
        if (isValid) {
          // Get form values and save to data
          const formValues = formRef.current.getValues();
          const payload = (({ minPrice, defaultPrice, maxPrice, minDurationInMonths, defaultDurationInMonths, maxDurationInMonths }) =>
            ({ minPrice, defaultPrice, maxPrice, minDurationInMonths, defaultDurationInMonths, maxDurationInMonths }))(formValues);
          updateData({ 
            templateForm: { ...(data.templateForm || {}), ...payload } 
          });
          return true;
        }
        return false;
      }
      // Fallback: use submit method but override handleSubmit
      if (formRef.current?.submit) {
        // Trigger validation only
        const isValid = await formRef.current.validate();
        if (isValid) {
          const formValues = formRef.current.getValues();
          const payload = (({ minPrice, defaultPrice, maxPrice, minDurationInMonths, defaultDurationInMonths, maxDurationInMonths }) =>
            ({ minPrice, defaultPrice, maxPrice, minDurationInMonths, defaultDurationInMonths, maxDurationInMonths }))(formValues);
          updateData({ 
            templateForm: { ...(data.templateForm || {}), ...payload } 
          });
          return true;
        }
        return false;
      }
      return false;
    }
  }));

  const handleSubmit = async (values) => {
    // Only save data, don't create template yet
      const payload = (({ minPrice, defaultPrice, maxPrice, minDurationInMonths, defaultDurationInMonths, maxDurationInMonths }) =>
        ({ minPrice, defaultPrice, maxPrice, minDurationInMonths, defaultDurationInMonths, maxDurationInMonths }))(values);
    updateData({ 
      templateForm: { ...(data.templateForm || {}), ...payload } 
    });
      return true;
  };

  const fields = useMemo(() => {
    const all = createTemplateFormFields({ templateActionLoading: false });
    const keep = new Set(['minPrice', 'defaultPrice', 'maxPrice', 'minDurationInMonths', 'defaultDurationInMonths', 'maxDurationInMonths']);
    return all.filter(f => keep.has(f.name));
  }, []);

  return (
    <Box>
      <Form
        ref={formRef}
        key={`template-pricing`}
        schema={packageTemplatePricingSchema}
        defaultValues={data.templateForm || {}}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={false}
        disabled={false}
        fields={fields}
      />
    </Box>
  );
});

// Step 3: Slot limits (create/update template here - final step)
const Step3Slots = forwardRef(({ data, updateData }, ref) => {
  const [loading, setLoading] = useState(false);
  const formRef = React.useRef(null);
  useImperativeHandle(ref, () => ({
    async submit() {
      if (formRef.current?.submit) {
        return await formRef.current.submit();
      }
      return false;
    }
  }));

  const handleSubmit = async (values) => {
    if (loading) return false;
    try {
      setLoading(true);
      const slotsPayload = (({ minSlots, defaultTotalSlots, maxSlots }) => ({ minSlots, defaultTotalSlots, maxSlots }))(values);
      
      // Combine all data from previous steps
      const templateForm = data.templateForm || {};
      const allData = { ...templateForm, ...slotsPayload };
      
      // If template not created yet, create it with all data (including status)
      if (!data?.createdTemplateId) {
        const created = await packageTemplateService.createTemplate(allData);
        updateData({ 
          createdTemplateId: created.id, 
          templateForm: allData 
        });
        toast.success('Tạo mẫu gói thành công');
      } else {
        // Update existing template with slots data; keep isActive from form
        await packageTemplateService.updateTemplate(data.createdTemplateId, allData);
        updateData({ templateForm: allData });
        toast.success('Cập nhật mẫu gói thành công');
      }
      return true;
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Lưu thất bại';
      toast.error(errorMessage, {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fields = useMemo(() => {
    const all = createTemplateFormFields({ templateActionLoading: loading });
    const keep = new Set(['minSlots', 'defaultTotalSlots', 'maxSlots']);
    return all.filter(f => keep.has(f.name));
  }, [loading]);

  return (
    <Box>
      <Form
        ref={formRef}
        key={`template-slots`}
        schema={packageTemplateSlotsSchema}
        defaultValues={data.templateForm || {}}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={loading}
        disabled={loading}
        fields={fields}
      />
    </Box>
  );
});

const CreateTemplate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});


  const steps = useMemo(() => ([
    { label: 'Thông tin cơ bản', component: Step1TemplateBasic },
    { label: 'Giá & Thời hạn', component: Step2PricingDuration },
    { label: 'Giới hạn slot', component: Step3Slots }
  ]), []);

  const handleComplete = useCallback(() => {
    navigate('/admin/packages');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/admin/packages');
  }, [navigate]);

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Tạo Mẫu Gói"
        icon={<TemplateIcon />}
        initialData={formData}
      />
    </Box>
  );
};

export default CreateTemplate;


