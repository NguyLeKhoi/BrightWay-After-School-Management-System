import React, { useImperativeHandle, useMemo } from 'react';
import { Box, Typography, Alert, Grid } from '@mui/material';
import Form from '../../../../components/Common/Form';
import ImageUpload from '../../../../components/Common/ImageUpload';
import { createParentCCCDInfoSchema, createParentCCCDInfoOCRSchema } from '../../../../utils/validationSchemas/parentSchemas';

const Step2CCCDInfo = React.forwardRef(
  ({ data, updateData, stepIndex, totalSteps, mode = 'manual' }, ref) => {
    const formRef = React.useRef(null);
    const dataRef = React.useRef({ avatarFile: data.avatarFile });

    const fields = useMemo(
      () => {
        const accountFields = mode === 'ocr' ? [
          {
            name: 'name',
            label: 'Họ và Tên',
            type: 'text',
            required: true,
            placeholder: 'Ví dụ: Nguyễn Văn A',
            gridSize: 12
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
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
        ] : [];

        const cccdFields = [
          {
            section: mode === 'ocr' ? undefined : 'Thông tin CCCD',
            sectionDescription: mode === 'ocr' ? undefined : 'Nhập thông tin từ căn cước công dân (tùy chọn).',
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

    const defaultValues = useMemo(
      () => {
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

        return {
          ...(mode === 'ocr' ? {
            name: data.name || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            avatarFile: data.avatarFile || null
          } : {}),
          identityCardNumber: data.identityCardNumber || '',
          dateOfBirth: formatDateToDDMMYYYY(data.dateOfBirth) || '',
          gender: data.gender || '',
          address: data.address || '',
          issuedDate: formatDateToDDMMYYYY(data.issuedDate) || '',
          issuedPlace: data.issuedPlace || ''
        };
      },
      [data, mode]
    );

    const handleSubmit = async (formValues) => {
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
            key={`step2-ocr-${data.name || ''}-${data.phoneNumber || ''}-${data.avatarFile?.name || ''}-${data.identityCardNumber || ''}-${data.dateOfBirth || ''}-${data.gender || ''}-${data.address || ''}-${data.issuedDate || ''}-${data.issuedPlace || ''}`}
            ref={formRef}
            schema={mode === 'ocr' ? createParentCCCDInfoOCRSchema : createParentCCCDInfoSchema}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
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

