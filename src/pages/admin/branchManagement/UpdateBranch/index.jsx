import React, { useCallback, useMemo, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Business as BranchIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import StepperForm from '../../../../components/Common/StepperForm';
import useLocationData from '../../../../hooks/useLocationData';
import branchService from '../../../../services/branch.service';
import { toast } from 'react-toastify';

// Branch Status Enum Values
const BRANCH_STATUS_OPTIONS = [
  { value: 'Active', label: 'Hoạt động' },
  { value: 'Inactive', label: 'Không hoạt động' },
  { value: 'UnderMaintenance', label: 'Đang bảo trì' },
  { value: 'Closed', label: 'Đã đóng' }
];

// Convert numeric status or Vietnamese string from backend to string enum
const convertStatusToEnum = (status) => {
  const statusMap = {
    0: 'Active',
    1: 'Active',
    2: 'Inactive',
    3: 'UnderMaintenance',
    4: 'Closed',
    '0': 'Active',
    '1': 'Active',
    '2': 'Inactive',
    '3': 'UnderMaintenance',
    '4': 'Closed',
    'Active': 'Active',
    'Inactive': 'Inactive',
    'UnderMaintenance': 'UnderMaintenance',
    'Closed': 'Closed',
    // Map Vietnamese status strings from API
    'Hoạt động': 'Active',
    'Không hoạt động': 'Inactive',
    'Ngừng hoạt động': 'Inactive',
    'Đang bảo trì': 'UnderMaintenance',
    'Đã đóng': 'Closed'
  };
  
  // If already a string enum, return as is
  if (typeof status === 'string' && ['Active', 'Inactive', 'UnderMaintenance', 'Closed'].includes(status)) {
    return status;
  }
  
  // Check if status exists in map
  if (statusMap[status] !== undefined) {
    return statusMap[status];
  }
  
  // Try case-insensitive match for Vietnamese strings
  if (typeof status === 'string') {
    const statusLower = status.trim().toLowerCase();
    for (const [key, value] of Object.entries(statusMap)) {
      if (typeof key === 'string' && key.toLowerCase() === statusLower) {
        return value;
      }
    }
  }
  
  // Default to Active
  return 'Active';
};

const Step1BasicInfo = forwardRef(({ data, updateData }, ref) => {
  const [branchName, setBranchName] = useState(data.branchName || '');
  useEffect(() => { setBranchName(data.branchName || ''); }, [data.branchName]);
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
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Thông tin chi nhánh</Typography>
      <input
        style={{ padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc' }}
        placeholder="Tên Chi Nhánh"
        value={branchName}
        onChange={(e) => setBranchName(e.target.value)}
      />
    </Box>
  );
});

const Step2AddressContact = forwardRef(({ data, updateData }, ref) => {
  const { 
    fetchProvinces, 
    fetchDistricts,
    handleProvinceChange, 
    getProvinceOptions, 
    getDistrictOptions, 
    getProvinceById,
    provinces,
    selectedProvinceId 
  } = useLocationData();
  const [address, setAddress] = useState(data.address || '');
  const [phone, setPhone] = useState(data.phone || '');
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState(data.districtId || '');
  const [status, setStatus] = useState(data.status || 'Active');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Fetch provinces on mount
  useEffect(() => { 
    const loadProvinces = async () => {
      await fetchProvinces();
    };
    loadProvinces();
  }, [fetchProvinces]);

  // When data changes, update form fields
  useEffect(() => { 
    setAddress(data.address || ''); 
    setPhone(data.phone || ''); 
    setDistrictId(data.districtId || '');
    setStatus(convertStatusToEnum(data.status));
  }, [data.address, data.phone, data.districtId, data.status]);

  // Find and set provinceId when data is available
  useEffect(() => {
    const findProvinceId = async () => {
      if (!provinces.length) return;
      if (!data.provinceName && !data.districtId) return;
      
      setIsLoadingLocation(true);
      try {
        // First, try to find by provinceName if available
        if (data.provinceName) {
          const foundProvince = provinces.find(p => 
            p.name === data.provinceName || 
            p.name?.toLowerCase() === data.provinceName?.toLowerCase()
          );
          if (foundProvince) {
            setProvinceId(foundProvince.id);
            handleProvinceChange(foundProvince.id);
            setIsLoadingLocation(false);
            return;
          }
        }
        
        // If not found by name, try to find by districtId
        if (data.districtId) {
          // Try to find province that contains this district in cached data
          for (const province of provinces) {
            if (province.districts && Array.isArray(province.districts)) {
              const foundDistrict = province.districts.find(d => d.id === data.districtId);
              if (foundDistrict) {
                setProvinceId(province.id);
                handleProvinceChange(province.id);
                setIsLoadingLocation(false);
                return;
              }
            }
          }
          
          // If not found in cached districts, fetch districts for each province
          // This is a fallback if districts aren't included in province data
          for (const province of provinces) {
            try {
              const districts = await fetchDistricts(province.id);
              const foundDistrict = districts.find(d => d.id === data.districtId);
              if (foundDistrict) {
                setProvinceId(province.id);
                handleProvinceChange(province.id);
                setIsLoadingLocation(false);
                return;
              }
            } catch (err) {

            }
          }
        }
      } catch (err) {

      } finally {
        setIsLoadingLocation(false);
      }
    };

    if (provinces.length > 0 && (data.provinceName || data.districtId)) {
      findProvinceId();
    }
  }, [data.provinceName, data.districtId, provinces, fetchDistricts, handleProvinceChange]);

  useImperativeHandle(ref, () => ({
    async submit() {
      if (!provinceId && !selectedProvinceId) { toast.error('Vui lòng chọn Tỉnh/Thành'); return false; }
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
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Địa chỉ & Liên hệ</Typography>
      {isLoadingLocation && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Đang tải thông tin địa điểm...
        </Typography>
      )}
      <select
        style={{ padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc' }}
        value={provinceId || selectedProvinceId || ''}
        onChange={(e) => {
          const newProvinceId = e.target.value;
          setProvinceId(newProvinceId);
          handleProvinceChange(newProvinceId);
          setDistrictId('');
        }}
        disabled={isLoadingLocation}
      >
        <option value="">Chọn Tỉnh/Thành</option>
        {provinceOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <select
        style={{ padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc' }}
        value={districtId}
        onChange={(e) => setDistrictId(e.target.value)}
        disabled={!provinceId && !selectedProvinceId || isLoadingLocation}
      >
        <option value="">Chọn Quận/Huyện</option>
        {districtOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>
      <input
        style={{ padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc' }}
        placeholder="Địa chỉ"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <input
        style={{ padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc' }}
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

const UpdateBranch = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);


  useEffect(() => {
    const load = async () => {
      try {
        const branch = await branchService.getBranchById(id);
        setFormData({
          branchName: branch.branchName || '',
          address: branch.address || '',
          phone: branch.phone || '',
          districtId: branch.districtId || '',
          provinceName: branch.provinceName || '',
          districtName: branch.districtName || '',
          status: convertStatusToEnum(branch.status)
        });
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [id]);

  const handleComplete = useCallback(async (data) => {
    await branchService.updateBranch(id, {
      branchName: data.branchName,
      address: data.address,
      phone: data.phone,
      districtId: data.districtId,
      status: data.status || 'Active'
    });
    toast.success('Cập nhật chi nhánh thành công');
    navigate('/admin/branches');
  }, [navigate, id]);

  const handleCancel = useCallback(() => {
    navigate('/admin/branches');
  }, [navigate]);

  const steps = useMemo(() => ([
    { label: 'Thông tin cơ bản', component: Step1BasicInfo },
    { label: 'Địa chỉ & Liên hệ', component: Step2AddressContact }
  ]), []);

  if (initialLoading || !formData) {
    return (
      <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Đang tải dữ liệu chi nhánh...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title="Cập nhật Chi Nhánh"
        icon={<BranchIcon />}
        initialData={formData}
      />
    </Box>
  );
};

export default UpdateBranch;



