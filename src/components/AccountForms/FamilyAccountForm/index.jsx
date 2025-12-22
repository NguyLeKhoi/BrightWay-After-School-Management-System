import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Home as HomeIcon,
  FamilyRestroom as FamilyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { createFamilyAccountSchema } from '../../../utils/validationSchemas/familySchemas';

const FamilyAccountForm = ({ onSubmit, loading = false, defaultValues = null, isEditMode = false, onCancel = null }) => {
  const [parentCount, setParentCount] = useState(defaultValues?.parents?.length || 1);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    setValue,
    getValues
  } = useForm({
    resolver: yupResolver(createFamilyAccountSchema),
    defaultValues: defaultValues || {
      user: {
        fullName: '',
        email: '',
        phoneNumber: '',
        password: ''
      },
      family: {
        address: '',
        phone: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        note: ''
      },
      parents: [{
        parentName: '',
        email: '',
        address: '',
        phone: '',
        relationshipToStudent: 'father',
        note: ''
      }]
    }
  });

  const addParent = () => {
    if (parentCount < 5) { // Maximum 5 parents
      const newParentCount = parentCount + 1;
      setParentCount(newParentCount);

      // Add new parent to form data
      const currentParents = getValues('parents') || [];
      const newParents = [...currentParents, {
        parentName: '',
        email: '',
        address: '',
        phone: '',
        relationshipToStudent: 'father',
        note: ''
      }];
      setValue('parents', newParents);
      
      // Scroll to the add button to show the new parent was added
      setTimeout(() => {
        const addButtonElement = document.querySelector('[data-add-parent-button]');
        if (addButtonElement) {
          addButtonElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  };

  const removeParent = (index) => {
    if (parentCount > 1) { // Minimum 1 parent
      const newParentCount = parentCount - 1;
      setParentCount(newParentCount);
      
      // Remove parent from form data
      const currentParents = getValues('parents') || [];
      const newParents = currentParents.filter((_, i) => i !== index);
      setValue('parents', newParents);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {

    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Cancel Button */}
      {onCancel && (
        <Button
          onClick={onCancel}
          disabled={loading || isSubmitting}
          sx={{
            position: 'absolute',
            top: -60,
            right: 0,
            color: 'var(--text-secondary)',
            minWidth: 'auto',
            padding: '8px',
            zIndex: 1,
            '&:hover': {
              backgroundColor: 'var(--bg-tertiary)'
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
          Hủy
        </Button>
      )}
      
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* User Section */}
      <Card sx={{ mb: 4, p: 2 }}>
        <CardHeader
          avatar={<PersonIcon color="primary" />}
          title="Thông Tin Người Dùng"
          subheader="Thông tin tài khoản chính của gia đình"
          sx={{ backgroundColor: 'var(--bg-secondary)' }}
        />
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('user.fullName')}
                label="Họ và Tên Người Dùng"
                fullWidth
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                disabled={loading}
                error={!!errors.user?.fullName}
                helperText={errors.user?.fullName?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('user.email')}
                label="Email Người Dùng"
                type="email"
                fullWidth
                required
                placeholder="Ví dụ: email@example.com"
                disabled={loading}
                error={!!errors.user?.email}
                helperText={errors.user?.email?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('user.phoneNumber')}
                label="Số Điện Thoại Người Dùng"
                fullWidth
                required
                placeholder="Ví dụ: 0901234567"
                disabled={loading}
                error={!!errors.user?.phoneNumber}
                helperText={errors.user?.phoneNumber?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('user.password')}
                label="Mật Khẩu Người Dùng"
                type="password"
                fullWidth
                required
                placeholder="Nhập mật khẩu cho người dùng"
                disabled={loading}
                error={!!errors.user?.password}
                helperText={errors.user?.password?.message}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Family Section */}
      <Card sx={{ mb: 4, p: 2 }}>
        <CardHeader
          avatar={<HomeIcon color="success" />}
          title="Thông Tin Gia Đình"
          subheader="Thông tin chung về gia đình"
          sx={{ backgroundColor: 'var(--bg-secondary)' }}
        />
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                {...register('family.address')}
                label="Địa Chỉ Gia Đình"
                fullWidth
                required
                placeholder="Ví dụ: 123 Đường ABC, Quận 1, TP.HCM"
                disabled={loading}
                error={!!errors.family?.address}
                helperText={errors.family?.address?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('family.phone')}
                label="Số Điện Thoại Gia Đình"
                fullWidth
                required
                placeholder="Ví dụ: 0901234567"
                disabled={loading}
                error={!!errors.family?.phone}
                helperText={errors.family?.phone?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('family.emergencyContactName')}
                label="Tên Người Liên Hệ Khẩn Cấp"
                fullWidth
                required
                placeholder="Ví dụ: Nguyễn Văn B"
                disabled={loading}
                error={!!errors.family?.emergencyContactName}
                helperText={errors.family?.emergencyContactName?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('family.emergencyContactPhone')}
                label="SĐT Liên Hệ Khẩn Cấp"
                fullWidth
                required
                placeholder="Ví dụ: 0901234567"
                disabled={loading}
                error={!!errors.family?.emergencyContactPhone}
                helperText={errors.family?.emergencyContactPhone?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('family.note')}
                label="Ghi Chú Gia Đình"
                fullWidth
                multiline
                rows={3}
                placeholder="Ghi chú về gia đình (tùy chọn)"
                disabled={loading}
                error={!!errors.family?.note}
                helperText={errors.family?.note?.message}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Parents Section */}
      <Card sx={{ mb: 4, p: 2 }}>
        <CardHeader
          avatar={<FamilyIcon color="warning" />}
          title="Thông Tin Phụ Huynh"
          subheader="Thông tin chi tiết về phụ huynh"
          action={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 1,
              backgroundColor: parentCount >= 5 ? 'var(--color-error-light)' : 'var(--color-primary-50)',
              borderRadius: '20px',
              border: parentCount >= 5 ? `1px solid var(--color-error)` : `1px solid var(--color-primary)`
            }}>
              <Typography 
                variant="body2" 
                color={parentCount >= 5 ? 'error' : 'primary'}
                sx={{ fontWeight: 'bold' }}
              >
                {parentCount}/5 phụ huynh
              </Typography>
            </Box>
          }
          sx={{ backgroundColor: 'var(--bg-secondary)' }}
        />
        <CardContent sx={{ p: 3 }}>
          {parentCount >= 5 && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              backgroundColor: 'var(--color-warning-light)', 
              border: `1px solid var(--color-warning)`, 
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningIcon sx={{ fontSize: 18 }} />
                Đã đạt giới hạn tối đa 5 phụ huynh
              </Typography>
            </Box>
          )}
          {parentCount === 1 && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              backgroundColor: 'var(--color-success-light)', 
              border: `1px solid var(--color-success)`, 
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LightbulbIcon sx={{ fontSize: 18 }} />
                Bạn có thể thêm tối đa 4 phụ huynh nữa bằng cách nhấn nút "Thêm Phụ Huynh"
              </Typography>
            </Box>
          )}
          {Array.from({ length: parentCount }, (_, index) => (
            <Box 
              key={index} 
              data-parent-index={index}
              sx={{ 
                mb: 4, 
                p: 3, 
                border: `1px dashed var(--border-medium)`, 
                borderRadius: '12px', 
                backgroundColor: 'var(--bg-secondary)',
                transition: 'var(--transition-all)',
                '&:hover': {
                  borderColor: 'var(--color-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }
              }}
            >
              {index > 0 && <Divider sx={{ my: 3 }} />}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {index + 1}
                  </Box>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                    Phụ Huynh {index + 1}
                  </Typography>
                </Box>
                {parentCount > 1 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => removeParent(index)}
                    disabled={loading || parentCount <= 1}
                    size="small"
                    sx={{
                      borderRadius: '20px',
                      textTransform: 'none',
                      fontWeight: 'bold',
                      minWidth: '100px',
                      borderColor: 'var(--color-error)',
                      color: 'var(--color-error)',
                      '&:hover': {
                        backgroundColor: 'var(--color-error-light)',
                        borderColor: 'var(--color-error-dark)'
                      }
                    }}
                  >
                    Xóa
                  </Button>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register(`parents.${index}.parentName`)}
                    label="Tên Phụ Huynh"
                    fullWidth
                    required
                    placeholder="Ví dụ: Nguyễn Thị C"
                    disabled={loading}
                    error={!!errors.parents?.[index]?.parentName}
                    helperText={errors.parents?.[index]?.parentName?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register(`parents.${index}.email`)}
                    label="Email Phụ Huynh"
                    type="email"
                    fullWidth
                    required
                    placeholder="Ví dụ: parent@example.com"
                    disabled={loading}
                    error={!!errors.parents?.[index]?.email}
                    helperText={errors.parents?.[index]?.email?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    {...register(`parents.${index}.address`)}
                    label="Địa Chỉ Phụ Huynh"
                    fullWidth
                    required
                    placeholder="Ví dụ: 456 Đường XYZ, Quận 2, TP.HCM"
                    disabled={loading}
                    error={!!errors.parents?.[index]?.address}
                    helperText={errors.parents?.[index]?.address?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register(`parents.${index}.phone`)}
                    label="Số Điện Thoại Phụ Huynh"
                    fullWidth
                    required
                    placeholder="Ví dụ: 0901234567"
                    disabled={loading}
                    error={!!errors.parents?.[index]?.phone}
                    helperText={errors.parents?.[index]?.phone?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!errors.parents?.[index]?.relationshipToStudent}>
                    <InputLabel>Mối Quan Hệ Với Học Sinh</InputLabel>
                    <Controller
                      name={`parents.${index}.relationshipToStudent`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Mối Quan Hệ Với Học Sinh"
                          disabled={loading}
                        >
                          <MenuItem value="father">Cha</MenuItem>
                          <MenuItem value="mother">Mẹ</MenuItem>
                          <MenuItem value="guardian">Người Giám Hộ</MenuItem>
                          <MenuItem value="other">Khác</MenuItem>
                        </Select>
                      )}
                    />
                    {errors.parents?.[index]?.relationshipToStudent && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.parents[index].relationshipToStudent.message}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    {...register(`parents.${index}.note`)}
                    label="Ghi Chú Phụ Huynh"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Ghi chú về phụ huynh (tùy chọn)"
                    disabled={loading}
                    error={!!errors.parents?.[index]?.note}
                    helperText={errors.parents?.[index]?.note?.message}
                  />
                </Grid>
              </Grid>
            </Box>
          ))}
          
          {/* Add Parent Button at Bottom */}
          <Box sx={{ 
            mt: 3, 
            pt: 3, 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Button
              data-add-parent-button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addParent}
              disabled={loading || parentCount >= 5}
              size="large"
              sx={{
                borderRadius: '25px',
                textTransform: 'none',
                fontWeight: 'bold',
                minWidth: '200px',
                height: '48px',
                fontSize: '16px',
                boxShadow: parentCount >= 5 ? 'none' : '0 4px 12px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  boxShadow: parentCount >= 5 ? 'none' : '0 6px 16px rgba(33, 150, 243, 0.4)',
                  transform: parentCount >= 5 ? 'none' : 'translateY(-2px)'
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {parentCount >= 5 ? 'Đã đủ 5 phụ huynh' : `Thêm Phụ Huynh ${parentCount + 1}`}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, mt: 4, p: 3, backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || loading}
          size="large"
          sx={{ 
            minWidth: 250, 
            height: 48, 
            fontSize: '16px',
            backgroundColor: 'var(--color-secondary)',
            color: 'var(--text-primary)',
            '&:hover': {
              backgroundColor: 'var(--color-secondary-dark)'
            }
          }}
        >
          {isSubmitting || loading ? 
            (isEditMode ? 'Đang cập nhật...' : 'Đang tạo...') : 
            (isEditMode ? 'Cập Nhật Tài Khoản Gia Đình' : 'Tạo Tài Khoản Gia Đình')
          }
        </Button>
      </Box>
    </form>
    </Box>
  );
};

export default FamilyAccountForm;

