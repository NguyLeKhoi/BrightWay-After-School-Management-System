import React, { useMemo, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Box, Typography, Autocomplete, TextField, Checkbox, ListItemText, CircularProgress, Button, Alert } from '@mui/material';
import { ShoppingCart as PackageIcon, Info as InfoIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StepperForm from '../../../../components/Common/StepperForm';
import benefitService from '../../../../services/benefit.service';
import packageService from '../../../../services/package.service';
import packageTemplateService from '../../../../services/packageTemplate.service';
import usePackageDependencies from '../../../../hooks/usePackageDependencies';
import Form from '../../../../components/Common/Form';
import { createPackageFormFields } from '../../../../definitions/package/formFields';
import { 
  packageSchema, 
  packageStep1BasicSchema, 
  packageStep2AssociationsSchema, 
  packageStep3PricingSchema 
} from '../../../../utils/validationSchemas/packageSchemas';
import Step5AssignSlotTypes from './Step5AssignSlotTypes';
import { toast } from 'react-toastify';

// Step 1: Basic info (no benefits here)
const Step1PackageBasic = forwardRef(({ data, updateData }, ref) => {
  const {
    studentLevelOptions,
    branchOptions,
    loading: dependenciesLoading,
    error: dependenciesError
  } = usePackageDependencies();
  const [templateOptions, setTemplateOptions] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = React.useRef(null);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const templates = await packageTemplateService.getAllTemplates();
        setTemplateOptions(templates || []);
      } catch (err) {

        setTemplateOptions([]);
        toast.error('Không thể tải danh sách mẫu gói');
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  useImperativeHandle(ref, () => ({
    async submit() {
      if (formRef.current?.submit) {
        return await formRef.current.submit();
      }
      return false;
    }
  }));

  const templateSelectOptions = useMemo(() => (templateOptions || []).map(t => ({ value: t.id, label: t.name })), [templateOptions]);
  const branchSelectOptions = useMemo(() => (branchOptions || []).map(b => ({ value: b.id, label: b.branchName })), [branchOptions]);
  const studentLevelSelectOptions = useMemo(() => (studentLevelOptions || []).map(s => ({ value: s.id, label: s.name })), [studentLevelOptions]);
  const fields = useMemo(() => {
    return createPackageFormFields({
      packageActionLoading: loading,
      dependenciesLoading,
      loadingTemplates,
      templateSelectOptions,
      branchSelectOptions,
      studentLevelSelectOptions,
      benefitSelectOptions: []
    }).filter(f => ['name', 'isActive', 'desc', 'packageTemplateId'].includes(f.name));
  }, [loading, dependenciesLoading, loadingTemplates, templateSelectOptions, branchSelectOptions, studentLevelSelectOptions]);

  const handleSubmit = async (formValues) => {
    if (loading) return false;
    try {
      setLoading(true);
      // Only save to formData, don't call API yet
      updateData({ packageForm: formValues });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lưu thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const defaultValues = useMemo(() => ({
    ...(data.packageForm || {}),
    // default to active if not set
    isActive: data.packageForm?.isActive ?? true
  }), [data.packageForm]);

  return (
    <Box>
      <Form
        ref={formRef}
        key={`create-package-step`}
        schema={packageStep1BasicSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={loading || dependenciesLoading || loadingTemplates}
        disabled={loading || dependenciesLoading || loadingTemplates}
        fields={fields}
      />
    </Box>
  );
});

// Step 2: Associations
const Step2Associations = forwardRef(({ data, updateData }, ref) => {
  const {
    studentLevelOptions,
    branchOptions,
    loading: dependenciesLoading,
    error: dependenciesError,
    fetchDependencies
  } = usePackageDependencies();
  const [loading, setLoading] = useState(false);
  const formRef = React.useRef(null);

  // Fetch dependencies on mount
  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useImperativeHandle(ref, () => ({
    async submit() {
      if (formRef.current?.submit) {
        return await formRef.current.submit();
      }
      return false;
    }
  }));

  const branchSelectOptions = useMemo(() => (branchOptions || []).map(b => ({ value: b.id, label: b.name || b.branchName })), [branchOptions]);
  const studentLevelSelectOptions = useMemo(() => (studentLevelOptions || []).map(s => ({ value: s.id, label: s.name })), [studentLevelOptions]);
  const fields = useMemo(() => {
    return createPackageFormFields({
      packageActionLoading: loading,
      dependenciesLoading,
      loadingTemplates: false,
      templateSelectOptions: [],
      branchSelectOptions,
      studentLevelSelectOptions,
      benefitSelectOptions: []
    }).filter(f => ['branchId', 'studentLevelId'].includes(f.name));
  }, [loading, dependenciesLoading, branchSelectOptions, studentLevelSelectOptions]);

  const handleSubmit = async (values) => {
    // just carry forward associations
    updateData({ packageForm: { ...(data.packageForm || {}), ...values } });
    return true;
  };

  // Show error if dependencies failed to load
  if (dependenciesError) {
    return (
      <Box>
        <Typography color="error" sx={{ mb: 2 }}>
          {dependenciesError}
        </Typography>
        <Button variant="outlined" onClick={fetchDependencies}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Form
        ref={formRef}
        key={`package-assoc`}
        schema={packageStep2AssociationsSchema}
        defaultValues={data.packageForm || {}}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={loading || dependenciesLoading}
        disabled={loading || dependenciesLoading}
        fields={fields}
      />
    </Box>
  );
});

// Step 3: Pricing & Slots (create package here)
const Step3PricingSlots = forwardRef(({ data, updateData }, ref) => {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const formRef = React.useRef(null);
  
  // Fetch template details when component mounts
  useEffect(() => {
    const fetchTemplate = async () => {
      const templateId = data?.packageForm?.packageTemplateId;
      if (templateId) {
        try {
          const template = await packageTemplateService.getTemplateById(templateId);
          setSelectedTemplate(template);
        } catch (err) {

        }
      }
    };
    fetchTemplate();
  }, [data?.packageForm?.packageTemplateId]);
  
  useImperativeHandle(ref, () => ({
    async submit() {
      if (formRef.current?.submit) {
        return await formRef.current.submit();
      }
      return false;
    }
  }));

  const fields = useMemo(() => {
    const baseFields = createPackageFormFields({
      packageActionLoading: loading,
      dependenciesLoading: false,
      loadingTemplates: false,
      templateSelectOptions: [],
      branchSelectOptions: [],
      studentLevelSelectOptions: [],
      benefitSelectOptions: []
    }).filter(f => ['price', 'durationInMonths', 'totalSlots'].includes(f.name));
    
    // Add helperText showing allowed ranges if template is selected
    if (selectedTemplate) {
      return baseFields.map(field => {
        if (field.name === 'price') {
          return {
            ...field,
            helperText: `Khoảng cho phép: ${selectedTemplate.minPrice?.toLocaleString('vi-VN') ?? '-'} - ${selectedTemplate.maxPrice?.toLocaleString('vi-VN') ?? '-'} VNĐ`
          };
        }
        if (field.name === 'durationInMonths') {
          return {
            ...field,
            helperText: `Khoảng cho phép: ${selectedTemplate.minDurationInMonths ?? '-'} - ${selectedTemplate.maxDurationInMonths ?? '-'} tháng`
          };
        }
        if (field.name === 'totalSlots') {
          return {
            ...field,
            helperText: `Khoảng cho phép: ${selectedTemplate.minSlots ?? '-'} - ${selectedTemplate.maxSlots ?? '-'} slot`
          };
        }
        return field;
      });
    }
    return baseFields;
  }, [loading, selectedTemplate]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Only save to formData, don't call API yet
      updateData({ packageForm: { ...(data.packageForm || {}), ...values } });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lưu thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Set default values from template when template is loaded
  const defaultValues = useMemo(() => {
    const formValues = data.packageForm || {};
    if (selectedTemplate) {
      return {
        price: formValues.price ?? selectedTemplate.defaultPrice ?? '',
        durationInMonths: formValues.durationInMonths ?? selectedTemplate.defaultDurationInMonths ?? '',
        totalSlots: formValues.totalSlots ?? selectedTemplate.defaultTotalSlots ?? ''
      };
    }
    return formValues;
  }, [data.packageForm, selectedTemplate]);

  return (
    <Box>
      {selectedTemplate && (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Khoảng giá trị cho phép theo mẫu gói "{selectedTemplate.name}":
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Giá:</strong> {selectedTemplate.minPrice?.toLocaleString('vi-VN') ?? '-'} - {selectedTemplate.maxPrice?.toLocaleString('vi-VN') ?? '-'} VNĐ
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Thời hạn:</strong> {selectedTemplate.minDurationInMonths ?? '-'} - {selectedTemplate.maxDurationInMonths ?? '-'} tháng
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Số slot:</strong> {selectedTemplate.minSlots ?? '-'} - {selectedTemplate.maxSlots ?? '-'} slot
              </Typography>
            </li>
          </Box>
        </Alert>
      )}
      <Form
        ref={formRef}
        key={`package-pricing-${selectedTemplate?.id || 'default'}`}
        schema={packageStep3PricingSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={loading}
        disabled={loading}
        fields={fields}
      />
    </Box>
  );
});

// Step 4: Assign benefits
const Step4AssignBenefits = forwardRef(({ data, updateData }, ref) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const benefits = await benefitService.getAllBenefits();
        setOptions(benefits || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useImperativeHandle(ref, () => ({
    async submit() {
      // Only save benefitIds to formData, will be assigned in handleComplete
      if (updateData) {
        updateData({ benefitIds: selected });
      }
      return true;
    }
  }));

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Gán Lợi Ích cho Gói Bán</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <Autocomplete
          multiple
          options={options}
          getOptionLabel={(option) => option.name}
          value={options.filter(b => selected.includes(b.id))}
          onChange={(e, newVal) => setSelected(newVal.map(b => b.id))}
          disableCloseOnSelect={true}
          renderOption={(props, option, { selected: isSelected }) => (
            <Box component="li" {...props}>
              <Checkbox checked={isSelected} />
              <ListItemText primary={option.name} secondary={option.description || 'Không có mô tả'} />
            </Box>
          )}
          renderInput={(params) => <TextField {...params} placeholder="Tìm và chọn lợi ích..." />}
        />
      )}
      <Typography variant="body2" color="text.secondary">Đã chọn: <b>{selected.length}</b> lợi ích</Typography>
    </Box>
  );
});

const CreatePackage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});

  const steps = useMemo(() => ([
    { label: 'Thông tin cơ bản', component: Step1PackageBasic },
    { label: 'Liên kết dữ liệu', component: Step2Associations },
    { label: 'Giá & Slot', component: Step3PricingSlots },
    { label: 'Gán lợi ích', component: Step4AssignBenefits },
    { label: 'Loại ca giữ trẻ', component: Step5AssignSlotTypes }
  ]), []);

  const handleComplete = useCallback(async (finalData) => {
    try {
      const packageForm = finalData?.packageForm || formData?.packageForm;
      const benefitIds = finalData?.benefitIds || [];
      
      if (!packageForm) {
        toast.error('Không tìm thấy dữ liệu để tạo gói');
        return;
      }

      // Validate required fields
      if (!packageForm.packageTemplateId) {
        toast.error('Vui lòng chọn mẫu gói');
        return;
      }
      if (!packageForm.branchId) {
        toast.error('Vui lòng chọn chi nhánh');
        return;
      }
      if (!packageForm.studentLevelId) {
        toast.error('Vui lòng chọn cấp độ học sinh');
        return;
      }
      if (!packageForm.name || packageForm.name.trim() === '') {
        toast.error('Tên gói không được để trống');
        return;
      }

      // Call API create once with all collected data
      const created = await packageService.createPackage(packageForm);
      
      // Assign benefits if any were selected
      if (benefitIds && benefitIds.length > 0) {
        try {
          await packageService.assignBenefitsToPackage({ 
            packageId: created.id, 
            benefitIds: benefitIds 
          });
        } catch (benefitErr) {

          // Don't fail the whole operation if benefits assignment fails
          toast.warning('Gói đã được tạo nhưng có lỗi khi gán lợi ích');
        }
      }
      
      // Assign slot types if any were selected
      const slotTypeIds = finalData?.slotTypeIds || [];
      if (slotTypeIds.length > 0) {
        try {
          await packageService.assignSlotTypesToPackage(created.id, { slotTypeIds });
        } catch (slotTypeErr) {

          // Don't fail the whole operation if slot types assignment fails
          toast.warning('Gói đã được tạo nhưng có lỗi khi gán loại ca giữ trẻ');
        }
      }
      
      toast.success('Tạo gói bán thành công!');
      navigate('/admin/packages');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Tạo gói thất bại';
      toast.error(errorMessage, {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
    }
  }, [navigate, formData]);

  const handleCancel = useCallback(() => {
    navigate('/admin/packages');
  }, [navigate]);

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Tạo Gói Bán"
        icon={<PackageIcon />}
        initialData={formData}
      />
    </Box>
  );
};

export default CreatePackage;

