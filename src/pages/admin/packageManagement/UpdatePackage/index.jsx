import React, { useMemo, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Box, Typography, Autocomplete, TextField, Checkbox, ListItemText, CircularProgress } from '@mui/material';
import { ShoppingCart as PackageIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import StepperForm from '../../../../components/Common/StepperForm';
import benefitService from '../../../../services/benefit.service';
import packageService from '../../../../services/package.service';
import packageTemplateService from '../../../../services/packageTemplate.service';
import slotTypeService from '../../../../services/slotType.service';
import usePackageDependencies from '../../../../hooks/usePackageDependencies';
import useFacilityBranchData from '../../../../hooks/useFacilityBranchData';
import Form from '../../../../components/Common/Form';
import { createPackageFormFields } from '../../../../definitions/package/formFields';
import { packageSchema } from '../../../../utils/validationSchemas/packageSchemas';
import { toast } from 'react-toastify';

const Step1PackageBasic = forwardRef(({ data, updateData }, ref) => {
  const {
    studentLevelOptions,
    branchOptions,
    loading: dependenciesLoading,
    error: dependenciesError
  } = usePackageDependencies();
  const { templateOptions, loadingTemplates } = useFacilityBranchData();
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
    }).filter(f => ['name', 'isActive', 'desc'].includes(f.name));
  }, [loading, dependenciesLoading, loadingTemplates, templateSelectOptions, branchSelectOptions, studentLevelSelectOptions]);

  const handleSubmit = async (formValues) => {
    if (loading) return false;
    try {
      setLoading(true);
      // Only save to formData, don't call API yet (will be called in handleComplete with all data)
      updateData({ packageForm: { ...(data.packageForm || {}), ...formValues } });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lưu thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Form
        ref={formRef}
        key={`update-package-step-${data.packageId}`}
        schema={packageSchema}
        defaultValues={data.packageForm || {}}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={loading || dependenciesLoading || loadingTemplates}
        disabled={loading || dependenciesLoading || loadingTemplates}
        fields={fields}
      />
    </Box>
  );
});

const Step2Associations = forwardRef(({ data, updateData }, ref) => {
  const {
    studentLevelOptions,
    branchOptions,
    loading: dependenciesLoading,
    fetchDependencies
  } = usePackageDependencies();
  const [templateOptions, setTemplateOptions] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = React.useRef(null);
  
  // Fetch dependencies on mount
  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);
  
  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const templates = await packageTemplateService.getAllTemplates();
        setTemplateOptions(templates || []);
      } catch (err) {

        setTemplateOptions([]);
        toast.error('Không thể tải danh sách mẫu gói', {
          position: 'top-right',
          autoClose: 3000
        });
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
  // Fix: branchOptions from usePackageDependencies has { id, name } structure, not { id, branchName }
  const branchSelectOptions = useMemo(() => (branchOptions || []).map(b => ({ value: b.id, label: b.name || b.branchName })), [branchOptions]);
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
    }).filter(f => ['packageTemplateId', 'branchId', 'studentLevelId'].includes(f.name));
  }, [loading, dependenciesLoading, loadingTemplates, templateSelectOptions, branchSelectOptions, studentLevelSelectOptions]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Only save to formData, don't call API yet (will be called in handleComplete with all data)
      updateData({ packageForm: { ...(data.packageForm || {}), ...values } });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lưu thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Form
        ref={formRef}
        key={`package-assoc-${data.packageId}-${JSON.stringify(data.packageForm || {})}`}
        schema={packageSchema}
        defaultValues={data.packageForm || {}}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={loading || dependenciesLoading || loadingTemplates}
        disabled={loading || dependenciesLoading || loadingTemplates}
        fields={fields}
      />
    </Box>
  );
});

const Step3PricingSlots = forwardRef(({ data, updateData }, ref) => {
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

  const fields = useMemo(() => {
    return createPackageFormFields({
      packageActionLoading: loading,
      dependenciesLoading: false,
      loadingTemplates: false,
      templateSelectOptions: [],
      branchSelectOptions: [],
      studentLevelSelectOptions: [],
      benefitSelectOptions: []
    }).filter(f => ['price', 'durationInMonths', 'totalSlots'].includes(f.name));
  }, [loading]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Only save to formData, don't call API yet (will be called in handleComplete with all data)
      updateData({ packageForm: { ...(data.packageForm || {}), ...values } });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lưu thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Form
        ref={formRef}
        key={`package-pricing-${data.packageId}-${JSON.stringify(data.packageForm || {})}`}
        schema={packageSchema}
        defaultValues={data.packageForm || {}}
        onSubmit={handleSubmit}
        hideSubmitButton
        loading={loading}
        disabled={loading}
        fields={fields}
      />
    </Box>
  );
});

// Step 5: Assign slot types
const Step5AssignSlotTypes = forwardRef(({ data, updateData, packageId }, ref) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const slotTypes = await slotTypeService.getAllSlotTypes();
        setOptions(Array.isArray(slotTypes) ? slotTypes : []);
        
        // Load existing slot type IDs from package data
        const existing = (data.slotTypeIds || []).filter(Boolean);
        setSelected(existing);
      } catch (err) {

        toast.error('Không thể tải danh sách loại ca giữ trẻ', {
          position: 'top-right',
          autoClose: 3000
        });
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [data.slotTypeIds]);

  useImperativeHandle(ref, () => ({
    async submit() {
      if (!packageId) {
        toast.error('Không tìm thấy ID gói bán', {
          position: 'top-right',
          autoClose: 3000
        });
        return false;
      }

      try {
        await packageService.assignSlotTypesToPackage(packageId, { slotTypeIds: selected });
        toast.success('Cập nhật loại ca giữ trẻ cho gói thành công', {
          position: 'top-right',
          autoClose: 2000
        });
        if (updateData) {
          updateData({ slotTypeIds: selected });
        }
        return true;
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err.message || 'Cập nhật loại ca giữ trẻ thất bại';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 4000
        });
        return false;
      }
    }
  }));

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Gán Loại Ca Giữ Trẻ cho Gói Bán</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <Autocomplete
          multiple
          options={options}
          getOptionLabel={(option) => option.name || 'Chưa có tên'}
          value={options.filter(st => selected.includes(st.id))}
          onChange={(e, newVal) => setSelected(newVal.map(st => st.id))}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Checkbox checked={selected.includes(option.id)} />
              <ListItemText 
                primary={option.name || 'Chưa có tên'} 
                secondary={option.description || 'Không có mô tả'} 
              />
            </Box>
          )}
          renderInput={(params) => <TextField {...params} placeholder="Tìm và chọn loại ca giữ trẻ..." />}
        />
      )}
      <Typography variant="body2" color="text.secondary">Đã chọn: <b>{selected.length}</b> loại ca giữ trẻ</Typography>
      {selected.length === 0 && (
        <Typography variant="body2" color="warning.main" sx={{ fontStyle: 'italic' }}>
          ⚠️ Lưu ý: Nếu không chọn loại ca giữ trẻ nào, phụ huynh sẽ không thể đăng ký slot nào cho gói này.
        </Typography>
      )}
    </Box>
  );
});

const Step4AssignBenefits = forwardRef(({ data, updateData }, ref) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const benefits = await benefitService.getAllBenefits();
        setOptions(benefits || []);
        const existing = (data.packageForm?.benefitIds || data.benefitIds || []).filter(Boolean);
        setSelected(existing);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [data.packageForm, data.benefitIds]);

  useImperativeHandle(ref, () => ({
    async submit() {
      try {
        // Save selected benefit IDs into parent form data; actual assignment is handled by the update endpoint
        if (updateData) {
          updateData({ benefitIds: selected });
        }
        toast.success('Lưu lựa chọn lợi ích (sẽ được áp dụng khi cập nhật gói)');
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Lưu lựa chọn thất bại');
        return false;
      }
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

const UpdatePackage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);


  useEffect(() => {
    const load = async () => {
      try {
        const pkg = await packageService.getPackageById(id);
        setFormData({
          packageId: id,
          packageForm: {
            name: pkg.name || '',
            desc: pkg.desc || '',
            isActive: pkg.isActive ?? true,
            packageTemplateId: pkg.packageTemplateId || pkg.packageTemplate?.id || '',
            branchId: pkg.branchId || pkg.branch?.id || '',
            studentLevelId: pkg.studentLevelId || pkg.studentLevel?.id || '',
            price: pkg.price ?? '',
            durationInMonths: pkg.durationInMonths ?? '',
            totalSlots: pkg.totalSlots ?? ''
          },
          benefitIds: (pkg?.benefits || []).map(b => b.id).filter(Boolean),
          slotTypeIds: (pkg?.slotTypes || []).map(st => st.id).filter(Boolean)
        });
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [id]);

  const steps = useMemo(() => ([
    { label: 'Thông tin cơ bản', component: Step1PackageBasic },
    { label: 'Liên kết dữ liệu', component: Step2Associations },
    { label: 'Giá & Slot', component: Step3PricingSlots },
    { label: 'Gán lợi ích', component: Step4AssignBenefits },
    { label: 'Loại ca giữ trẻ', component: Step5AssignSlotTypes }
  ]), []);

  const handleComplete = useCallback(async (finalData) => {
    if (!id) {
      toast.error('Không tìm thấy ID gói bán');
      return;
    }

    try {
      const packageForm = finalData?.packageForm || formData?.packageForm;
      const benefitIds = finalData?.benefitIds || formData?.benefitIds || [];
      
      if (!packageForm) {
        toast.error('Không tìm thấy dữ liệu để cập nhật gói');
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

      // Update package with all collected data (including BenefitIds)
      const updatePayload = {
        ...packageForm,
        benefitIds: benefitIds.length > 0 ? benefitIds : (formData?.benefitIds || [])
      };

      await packageService.updatePackage(id, updatePayload);
      
      // Assign slot types if any were selected (step 5 already handles this, but ensure it's done)
      const slotTypeIds = finalData?.slotTypeIds || formData?.slotTypeIds || [];
      if (slotTypeIds.length > 0) {
        try {
          await packageService.assignSlotTypesToPackage(id, { slotTypeIds });
        } catch (slotTypeErr) {

          // Don't fail the whole operation if slot types assignment fails
          toast.warning('Gói đã được cập nhật nhưng có lỗi khi gán loại ca giữ trẻ');
        }
      }
      
      toast.success('Cập nhật gói bán thành công!');
      navigate('/admin/packages');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Cập nhật gói thất bại';
      toast.error(errorMessage, {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
    }
  }, [navigate, id, formData]);

  const handleCancel = useCallback(() => {
    navigate('/admin/packages');
  }, [navigate]);

  if (initialLoading || !formData) {
    return (
      <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Cập nhật Gói Bán"
        icon={<PackageIcon />}
        initialData={formData}
        stepProps={{
          packageId: id
        }}
      />
    </Box>
  );
};

export default UpdatePackage;



