import React, { useCallback, useMemo, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Box, Typography, Autocomplete, TextField, Checkbox, ListItemText, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Business as BranchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StepperForm from '../../../../components/Common/StepperForm';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog';
import useLocationData from '../../../../hooks/useLocationData';
import branchService from '../../../../services/branch.service';
import benefitService from '../../../../services/benefit.service';
import schoolService from '../../../../services/school.service';
import studentLevelService from '../../../../services/studentLevel.service';
import { toast } from 'react-toastify';

// Branch Status Enum Values
const BRANCH_STATUS_OPTIONS = [
  { value: 'Active', label: 'Hoạt động' },
  { value: 'Inactive', label: 'Không hoạt động' },
  { value: 'UnderMaintenance', label: 'Đang bảo trì' },
  { value: 'Closed', label: 'Đã đóng' }
];

const Step1BranchInfo = forwardRef(({ data, updateData }, ref) => {
  const [branchName, setBranchName] = useState(data.branchName || '');
  useImperativeHandle(ref, () => ({
    async submit() {
      if (!branchName.trim()) {
        toast.error('Vui lòng nhập tên chi nhánh');
        return false;
      }
      updateData({ branchName: branchName.trim() });
      return true;
    }
  }));
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Thông tin chi nhánh</Typography>
      <input
        style={{ padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc' }}
        placeholder="Tên Chi Nhánh"
        value={branchName}
        onChange={(e) => setBranchName(e.target.value)}
      />
    </Box>
  );
});

const Step1AddressContact = forwardRef(({ data, updateData }, ref) => {
  const { provinces, fetchProvinces, handleProvinceChange, getProvinceOptions, getDistrictOptions, selectedProvinceId } = useLocationData();
  const [address, setAddress] = useState(data.address || '');
  const [phone, setPhone] = useState(data.phone || '');
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [status, setStatus] = useState(data.status || 'Active');

  useEffect(() => { fetchProvinces(); }, [fetchProvinces]);

  useImperativeHandle(ref, () => ({
    async submit() {
      if (!provinceId) { toast.error('Vui lòng chọn Tỉnh/Thành'); return false; }
      if (!districtId) { toast.error('Vui lòng chọn Quận/Huyện'); return false; }
      if (!address.trim()) { toast.error('Vui lòng nhập địa chỉ'); return false; }
      if (!phone.trim()) { toast.error('Vui lòng nhập số điện thoại'); return false; }
      updateData({ address: address.trim(), phone: phone.trim(), districtId, status });
      return true;
    }
  }));

  const provinceOptions = useMemo(() => getProvinceOptions(), [getProvinceOptions]);
  const districtOptions = useMemo(() => getDistrictOptions(), [getDistrictOptions]);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Địa chỉ & Liên hệ</Typography>

      <FormControl fullWidth required>
        <InputLabel>Tỉnh/Thành Phố</InputLabel>
        <Select
          label="Tỉnh/Thành Phố"
          value={provinceId}
          onChange={(e) => {
            setProvinceId(e.target.value);
            handleProvinceChange(e.target.value);
            setDistrictId('');
          }}
          MenuProps={{ disableScrollLock: true }}
        >
          <MenuItem value="">Chọn Tỉnh/Thành</MenuItem>
          {provinceOptions.map(p => (
            <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth required disabled={!provinceId}>
        <InputLabel>Quận/Huyện</InputLabel>
        <Select
          label="Quận/Huyện"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          MenuProps={{ disableScrollLock: true }}
        >
          <MenuItem value="">Chọn Quận/Huyện</MenuItem>
          {districtOptions.map(d => (
            <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        placeholder="Địa chỉ"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <TextField
        fullWidth
        placeholder="Số điện thoại"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <FormControl fullWidth required>
        <InputLabel>Trạng Thái</InputLabel>
        <Select
          label="Trạng Thái"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          MenuProps={{ disableScrollLock: true }}
        >
          {BRANCH_STATUS_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
});

const Step2AssignBenefits = forwardRef(({ data }, ref) => {
  const [loading, setLoading] = useState(true);
  const [availableBenefits, setAvailableBenefits] = useState([]);
  const [selectedBenefitIds, setSelectedBenefitIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const allBenefits = await benefitService.getAllBenefits();
        setAvailableBenefits(allBenefits || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useImperativeHandle(ref, () => ({
    async submit() {
      if (!data?.createdBranchId) {
        toast.error('Không tìm thấy chi nhánh vừa tạo');
        return false;
      }
      try {
        await benefitService.assignBenefitsToBranch({ branchId: data.createdBranchId, benefitIds: selectedBenefitIds });
        toast.success('Gán lợi ích thành công');
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Gán lợi ích thất bại');
        return false;
      }
    }
  }));

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Gán Lợi Ích cho Chi Nhánh</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <Autocomplete
          multiple
          options={availableBenefits}
          getOptionLabel={(option) => option.name}
          value={availableBenefits.filter(b => selectedBenefitIds.includes(b.id))}
          onChange={(event, newValue) => setSelectedBenefitIds(newValue.map(b => b.id))}
          disableCloseOnSelect
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Checkbox checked={selectedBenefitIds.includes(option.id)} />
              <ListItemText primary={option.name} secondary={option.description || 'Không có mô tả'} />
            </Box>
          )}
          renderInput={(params) => (
            <TextField {...params} placeholder="Tìm và chọn lợi ích..." />
          )}
        />
      )}
      <Typography variant="body2" color="text.secondary">Đã chọn: <b>{selectedBenefitIds.length}</b> lợi ích</Typography>
    </Box>
  );
});

const Step3AssignSchools = forwardRef(({ data }, ref) => {
  const [loading, setLoading] = useState(true);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const allSchools = await schoolService.getAllSchools();
        setAvailableSchools(allSchools || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useImperativeHandle(ref, () => ({
    async submit() {
      if (!data?.createdBranchId) {
        toast.error('Không tìm thấy chi nhánh vừa tạo');
        return false;
      }
      try {
        // Gán từng school một
        for (const schoolId of selectedSchoolIds) {
          if (schoolId) {
            await branchService.connectSchool({
              branchId: data.createdBranchId,
              schoolId: schoolId
            });
          }
        }
        if (selectedSchoolIds.length > 0) {
          toast.success('Gán trường thành công');
        }
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Gán trường thất bại');
        return false;
      }
    }
  }));

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Gán Trường cho Chi Nhánh</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <Autocomplete
          multiple
          options={availableSchools}
          getOptionLabel={(option) => option.name || option.schoolName || 'Không rõ tên'}
          getOptionKey={(option) => option.id || option.schoolId}
          value={availableSchools.filter(s => {
            const schoolId = s.id || s.schoolId;
            return schoolId && selectedSchoolIds.includes(schoolId);
          })}
          onChange={(event, newValue) => {
            const ids = newValue
              .map(s => s.id || s.schoolId)
              .filter(id => id != null && id !== '');
            setSelectedSchoolIds(ids);
          }}
          disableCloseOnSelect
          renderOption={(props, option) => {
            const schoolId = option.id || option.schoolId;
            const isSelected = schoolId && selectedSchoolIds.includes(schoolId);
            return (
              <Box component="li" {...props}>
                <Checkbox checked={isSelected} />
                <ListItemText
                  primary={option.name || option.schoolName || 'Không rõ tên'}
                  secondary={option.address || 'Không có địa chỉ'}
                />
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder="Tìm và chọn trường..." />
          )}
        />
      )}
      <Typography variant="body2" color="text.secondary">Đã chọn: <b>{selectedSchoolIds.length}</b> trường</Typography>
    </Box>
  );
});

const Step4AssignStudentLevels = forwardRef(({ data }, ref) => {
  const [loading, setLoading] = useState(true);
  const [availableStudentLevels, setAvailableStudentLevels] = useState([]);
  const [selectedStudentLevelIds, setSelectedStudentLevelIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const allStudentLevels = await studentLevelService.getAllStudentLevels();
        setAvailableStudentLevels(allStudentLevels || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useImperativeHandle(ref, () => ({
    async submit() {
      if (!data?.createdBranchId) {
        toast.error('Không tìm thấy chi nhánh vừa tạo');
        return false;
      }
      try {
        // Gán từng student level một
        for (const studentLevelId of selectedStudentLevelIds) {
          if (studentLevelId) {
            await branchService.addStudentLevel({
              branchId: data.createdBranchId,
              studentLevelId: studentLevelId
            });
          }
        }
        if (selectedStudentLevelIds.length > 0) {
          toast.success('Gán cấp độ học sinh thành công');
        }
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Gán cấp độ học sinh thất bại');
        return false;
      }
    }
  }));

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Gán Cấp Độ Học Sinh cho Chi Nhánh</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <Autocomplete
          multiple
          options={availableStudentLevels}
          getOptionLabel={(option) => option.name || option.levelName || 'Không rõ tên'}
          getOptionKey={(option) => option.id || option.studentLevelId}
          value={availableStudentLevels.filter(sl => {
            const levelId = sl.id || sl.studentLevelId;
            return levelId && selectedStudentLevelIds.includes(levelId);
          })}
          onChange={(event, newValue) => {
            const ids = newValue
              .map(sl => sl.id || sl.studentLevelId)
              .filter(id => id != null && id !== '');
            setSelectedStudentLevelIds(ids);
          }}
          disableCloseOnSelect
          renderOption={(props, option) => {
            const levelId = option.id || option.studentLevelId;
            const isSelected = levelId && selectedStudentLevelIds.includes(levelId);
            return (
              <Box component="li" {...props}>
                <Checkbox checked={isSelected} />
                <ListItemText
                  primary={option.name || option.levelName || 'Không rõ tên'}
                  secondary={option.description || option.desc || 'Không có mô tả'}
                />
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder="Tìm và chọn cấp độ học sinh..." />
          )}
        />
      )}
      <Typography variant="body2" color="text.secondary">Đã chọn: <b>{selectedStudentLevelIds.length}</b> cấp độ học sinh</Typography>
    </Box>
  );
});

const CreateBranch = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [stepCompletionDialog, setStepCompletionDialog] = useState({
    open: false,
    title: 'Hoàn thành tạo chi nhánh',
    description: 'Bạn đã hoàn thành tạo chi nhánh. Bạn có muốn tiếp tục gán lợi ích, trường và cấp độ học sinh không?',
    onConfirm: null
  });


  const handleStep1Create = useCallback(async (data) => {
    try {
      const created = await branchService.createBranch({
        branchName: data.branchName,
        address: data.address,
        phone: data.phone,
        districtId: data.districtId,
        status: data.status || 'Active'
      });
      setFormData(prev => ({ ...prev, createdBranchId: created.id }));
      toast.success('Tạo chi nhánh thành công');

      // Hiển thị dialog xác nhận ngay sau khi tạo chi nhánh thành công
      return new Promise((resolve) => {
        setStepCompletionDialog({
          open: true,
          title: 'Hoàn thành tạo chi nhánh',
          description: 'Bạn đã hoàn thành tạo chi nhánh. Bạn có muốn tiếp tục gán lợi ích, trường và cấp độ học sinh không?',
          onConfirm: () => {
            setStepCompletionDialog(prev => ({ ...prev, open: false }));
            resolve(true); // Tiếp tục sang bước tiếp theo
          }
        });
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Tạo chi nhánh thất bại');
      return false;
    }
  }, []);

  const handleComplete = useCallback(async () => {
    navigate('/admin/branches');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/admin/branches');
  }, [navigate]);

  const steps = useMemo(() => ([
    { label: 'Thông tin cơ bản', component: Step1BranchInfo },
    { label: 'Địa chỉ & Liên hệ', component: Step1AddressContact, validation: handleStep1Create },
    { label: 'Gán Lợi Ích', component: Step2AssignBenefits },
    { label: 'Gán Trường', component: Step3AssignSchools },
    { label: 'Gán Cấp Độ Học Sinh', component: Step4AssignStudentLevels }
  ]), [handleStep1Create]);

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Tạo Chi Nhánh"
        icon={<BranchIcon />}
        initialData={formData}
      />

      {/* Step Completion Dialog */}
      <ConfirmDialog
        open={stepCompletionDialog.open}
        onClose={() => {
          setStepCompletionDialog(prev => ({ ...prev, open: false }));
          // Khi đóng dialog mà không confirm, quay về trang danh sách
          navigate('/admin/branches');
        }}
        onConfirm={stepCompletionDialog.onConfirm}
        title={stepCompletionDialog.title}
        description={stepCompletionDialog.description}
        confirmText="Tiếp tục"
        cancelText="Trở về"
        confirmColor="primary"
      />
    </Box>
  );
};

export default CreateBranch;


