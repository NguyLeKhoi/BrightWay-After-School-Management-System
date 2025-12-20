import React, { useImperativeHandle, useMemo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import Form from '../../../../components/Common/Form';
import ImageUpload from '../../../../components/Common/ImageUpload';
import { createParentBasicInfoSchema } from '../../../../utils/validationSchemas/parentSchemas';

const Step1BasicInfo = React.forwardRef(
  ({ data, updateData, stepIndex, totalSteps }, ref) => {
    const formRef = React.useRef(null);

    const fields = useMemo(
      () => [
        {
          section: 'Thông tin cơ bản',
          sectionDescription: 'Nhập thông tin cơ bản của phụ huynh.',
          name: 'name',
          label: 'Họ và tên',
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
      ],
      []
    );

    const defaultValues = useMemo(
      () => ({
        name: data.name || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || ''
      }),
      [data]
    );

    const handleSubmit = async (formValues) => {
      // Merge avatarFile from data into formValues
      const mergedData = {
        ...formValues,
        avatarFile: data.avatarFile || formValues.avatarFile || null
      };
      updateData(mergedData);
      return true;
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (formRef.current?.submit) {
          // Ensure avatarFile is set in form before submitting
          if (data.avatarFile && formRef.current?.setValue) {
            formRef.current.setValue('avatarFile', data.avatarFile, { shouldValidate: false });
          }
          return await formRef.current.submit();
        }
        return false;
      }
    }));

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0.75, fontWeight: 600, fontSize: '1.1rem' }}>
          Bước {stepIndex + 1}/{totalSteps}: Thông tin cơ bản
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
          Nhập thông tin cơ bản của phụ huynh. Email và mật khẩu sẽ được dùng để đăng nhập.
        </Typography>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Form
            ref={formRef}
            schema={createParentBasicInfoSchema}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            fields={fields}
            hideSubmitButton
          />
          
          {/* Image Upload Section */}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <ImageUpload
                  value={data.avatarFile || null}
                  onChange={(file) => {
                    // Get current form values to preserve them
                    let currentFormValues = {};
                    if (formRef.current && typeof formRef.current.getValues === 'function') {
                      try {
                        currentFormValues = formRef.current.getValues();
                      } catch (err) {
                        // If getValues fails, use empty object
                        currentFormValues = {};
                      }
                    }
                    // Merge current form values with new avatarFile
                    updateData({ 
                      ...data, 
                      ...currentFormValues, // Preserve form values
                      avatarFile: file 
                    });
                    // Also update form value if formRef is available
                    if (formRef.current && typeof formRef.current.setValue === 'function') {
                      try {
                        formRef.current.setValue('avatarFile', file, { shouldValidate: false });
                      } catch (err) {
                        // If setValue fails, just continue without updating form
                      }
                    }
                  }}
                  label="Ảnh đại diện (tùy chọn)"
                  helperText="Chọn file ảnh để tải lên (JPG, PNG, etc.) - Tối đa 10MB"
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    );
  }
);

Step1BasicInfo.displayName = 'CreateParentStep1BasicInfo';

export default Step1BasicInfo;
export { Step1BasicInfo };






