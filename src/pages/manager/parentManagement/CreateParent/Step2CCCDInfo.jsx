import React, { useImperativeHandle, useMemo } from 'react';
import { Box, Typography, Alert, Grid } from '@mui/material';
import Form from '../../../../components/Common/Form';
import ImageUpload from '../../../../components/Common/ImageUpload';
import { createParentCCCDInfoSchema, createParentCCCDInfoOCRSchema } from '../../../../utils/validationSchemas/parentSchemas';

const Step2CCCDInfo = React.forwardRef(
  ({ data, updateData, stepIndex, totalSteps, mode = 'manual' }, ref) => {
    const formRef = React.useRef(null);
    const dataRef = React.useRef({ avatarFile: data.avatarFile });

    // Update form values khi data thay đổi từ bên ngoài (không reset form)
    React.useEffect(() => {
      if (formRef.current && formRef.current.setValue) {
        // Chỉ update nếu có data từ OCR/external
        if (data.name && formRef.current.getValues) {
          const currentValues = formRef.current.getValues();
          // Chỉ update nếu value thực sự khác
          if (currentValues.name !== data.name) {
            formRef.current.setValue('name', data.name, { shouldValidate: false });
          }
          if (data.email && currentValues.email !== data.email) {
            formRef.current.setValue('email', data.email, { shouldValidate: false });
          }
          if (data.phoneNumber && currentValues.phoneNumber !== data.phoneNumber) {
            formRef.current.setValue('phoneNumber', data.phoneNumber, { shouldValidate: false });
          }
          if (data.identityCardNumber && currentValues.identityCardNumber !== data.identityCardNumber) {
            formRef.current.setValue('identityCardNumber', data.identityCardNumber, { shouldValidate: false });
          }
        }
      }
    }, [data.name, data.email, data.phoneNumber, data.identityCardNumber]);

    // Update data when form fields change
    const handleFieldChange = (formValues) => {
      updateData({
        ...data,
        ...formValues,
        avatarFile: dataRef.current.avatarFile // Preserve avatarFile from ref
      });
    };

    const fields = useMemo(
      () => {
        // Account fields are always available for editing in step 2
        const accountFields = [
          {
            name: 'name',
            label: 'Họ và Tên',
            type: 'text',
            required: mode === 'ocr', // Required for OCR, optional for manual
            placeholder: 'Ví dụ: Nguyễn Văn A',
            gridSize: mode === 'ocr' ? 12 : 6
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: mode === 'ocr', // Required for OCR, optional for manual
            placeholder: 'Ví dụ: email@example.com',
            gridSize: 6
          },
          {
            name: 'phoneNumber',
            label: 'Số điện thoại',
            type: 'tel',
            required: false,
            placeholder: 'Ví dụ: 0901234567',
            gridSize: 6
          }
        ];

        const cccdFields = [
          {
            section: 'Thông tin CCCD',
            sectionDescription: mode === 'ocr'
              ? 'Thông tin đã được trích xuất từ CCCD. Bạn có thể chỉnh sửa nếu cần.'
              : 'Nhập thông tin từ căn cước công dân. Tất cả các trường đều tùy chọn.',
            name: 'identityCardNumber',
            label: 'Số CCCD',
            type: 'text',
            required: false,
            placeholder: 'Ví dụ: 001234567890',
            gridSize: 6
          },
          {
            name: 'dateOfBirth',
            label: 'Ngày sinh',
            type: 'text',
            required: false,
            placeholder: 'dd/mm/yyyy',
            gridSize: 6,
            pattern: '^\\d{2}/\\d{2}/\\d{4}$'
          },
          {
            name: 'gender',
            label: 'Giới tính',
            type: 'select',
            required: false,
            options: [
              { value: 'Nam', label: 'Nam' },
              { value: 'Nữ', label: 'Nữ' },
              { value: 'Khác', label: 'Khác' }
            ],
            gridSize: 6
          },
          {
            name: 'address',
            label: 'Địa chỉ',
            type: 'text',
            required: false,
            placeholder: 'Ví dụ: 123 Đường ABC, Quận 1, TP.HCM',
            gridSize: 6
          },
          {
            name: 'issuedDate',
            label: 'Ngày cấp',
            type: 'text',
            required: false,
            placeholder: 'dd/mm/yyyy',
            gridSize: 6,
            pattern: '^\\d{2}/\\d{2}/\\d{4}$'
          },
          {
            name: 'issuedPlace',
            label: 'Nơi cấp',
            type: 'text',
            required: false,
            placeholder: 'Ví dụ: Công an TP.HCM',
            gridSize: 6
          }
        ];

        return [...accountFields, ...cccdFields];
      },
      [mode]
    );

    // Helper function to handle intelligent date input
    // Supports formats: ddmmyyyy, dd/mm/yyyy, dd-mm-yyyy, etc.
    // Also handles partial input gracefully
    const handleDateInput = (value) => {
      if (!value) return '';

      // Remove all non-digit characters to get raw input
      let cleaned = value.replace(/\D/g, '');

      // If user is still typing, allow incomplete input
      if (cleaned.length < 8) {
        // Format partial input as dd/mm/yyyy while typing
        if (cleaned.length <= 2) {
          return cleaned;
        } else if (cleaned.length <= 4) {
          return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        } else {
          return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
        }
      }

      // When user completes input (8 digits), format as dd/mm/yyyy
      if (cleaned.length >= 8) {
        const day = cleaned.slice(0, 2);
        const month = cleaned.slice(2, 4);
        const year = cleaned.slice(4, 8);

        // Validate ranges
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
          // Return what we have formatted, validation will catch this
          return `${day}/${month}/${year}`;
        }

        return `${day}/${month}/${year}`;
      }

      return cleaned;
    };

    // Helper function to format date to dd/mm/yyyy
    const formatDateToDDMMYYYY = (dateString) => {
      if (!dateString) return '';
      // If already in dd/mm/yyyy format, return as is
      if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
      }
      try {
        let date;
        // If in YYYY-MM-DD format (without time)
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const [year, month, day] = dateString.split('-');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        // If in ISO format (with T and time)
        else if (typeof dateString === 'string' && dateString.includes('T')) {
          // Remove time part and parse
          const dateOnly = dateString.split('T')[0];
          const [year, month, day] = dateOnly.split('-');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        // Otherwise try to parse as Date
        else {
          date = new Date(dateString);
        }
        if (isNaN(date.getTime())) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch {
        return '';
      }
    };

    // Initialize defaultValues ONCE để tránh Form bị reset mỗi lần data thay đổi
    const [defaultValues] = React.useState(() => ({
      // Account fields - luôn có cho cả OCR và manual
      name: data.name || '',
      email: data.email || '',
      phoneNumber: data.phoneNumber || '',
      avatarFile: data.avatarFile || null,
      // CCCD fields
      identityCardNumber: data.identityCardNumber || '',
      dateOfBirth: formatDateToDDMMYYYY(data.dateOfBirth) || '',
      gender: data.gender || '',
      address: data.address || '',
      issuedDate: formatDateToDDMMYYYY(data.issuedDate) || '',
      issuedPlace: data.issuedPlace || ''
    }));

    const handleSubmit = async (formValues) => {
      // Validate required fields for OCR mode only
      if (mode === 'ocr') {
        if (!formValues.name || !formValues.email) {
          return false;
        }
      }

      // Convert dd/mm/yyyy back to YYYY-MM-DD for storage
      const convertDDMMYYYYToYYYYMMDD = (dateString) => {
        if (!dateString) return '';
        if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
          const [day, month, year] = dateString.split('/');
          return `${year}-${month}-${day}`;
        }
        return dateString;
      };

      const convertedValues = {
        ...formValues,
        dateOfBirth: convertDDMMYYYYToYYYYMMDD(formValues.dateOfBirth),
        issuedDate: convertDDMMYYYYToYYYYMMDD(formValues.issuedDate),
        avatarFile: dataRef.current.avatarFile // Get from ref instead
      };

      updateData(convertedValues);

      return true;
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (formRef.current?.submit) {
          const result = await formRef.current.submit();
          return result;
        }
        return false;
      }
    }));

    const hasOCRData = data.identityCardPublicId || (data.name && data.identityCardNumber);

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0.75, fontWeight: 600, fontSize: '1.1rem' }}>
          Bước {stepIndex + 1}/{totalSteps}: Thông tin CCCD
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
          Nhập thông tin từ căn cước công dân. Tất cả các trường đều tùy chọn.
        </Typography>

        {hasOCRData && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Thông tin đã được tự động điền từ OCR. Vui lòng kiểm tra và chỉnh sửa nếu cần.
          </Alert>
        )}

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Form
            ref={formRef}
            schema={undefined}  // Tạm bỏ validation để form không bị block input
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onFieldChange={handleFieldChange}
            fields={fields}
            hideSubmitButton
          />
          
          {/* Image Upload Section - Only for OCR mode */}
          {mode === 'ocr' && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ImageUpload
                    value={data.avatarFile instanceof File ? data.avatarFile : null}
                    onChange={(file) => {
                      // Just store in ref, don't call updateData yet to avoid re-render
                      dataRef.current.avatarFile = file;
                      // Also update form value
                      if (formRef.current?.setValue) {
                        formRef.current.setValue('avatarFile', file, { shouldValidate: false });
                      }
                    }}
                    label="Ảnh đại diện (tùy chọn)"
                    helperText="Chọn file ảnh để tải lên (JPG, PNG, etc.) - Tối đa 5MB"
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
    );
  }
);

Step2CCCDInfo.displayName = 'CreateParentStep2CCCDInfo';

export default Step2CCCDInfo;

