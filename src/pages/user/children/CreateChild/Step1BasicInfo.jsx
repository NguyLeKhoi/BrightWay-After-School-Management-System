import React, { useImperativeHandle, useMemo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import Form from '../../../../components/Common/Form';
import ImageUpload from '../../../../components/Common/ImageUpload';
import { userChildStep1Schema } from '../../../../utils/validationSchemas/userChildSchemas';

const Step1BasicInfo = React.forwardRef(
  ({ data, updateData, stepIndex, totalSteps, dependenciesLoading = false }, ref) => {
    const formRef = React.useRef(null);

    const fields = useMemo(
      () => [
        {
          section: 'Thông tin trẻ em',
          sectionDescription: 'Điền thông tin cơ bản của con bạn.',
          name: 'name',
          label: 'Họ và tên',
          type: 'text',
          required: true,
          placeholder: 'Ví dụ: Nguyễn Minh Anh',
          gridSize: 6,
          disabled: dependenciesLoading
        },
        {
          name: 'dateOfBirth',
          label: 'Ngày sinh',
          type: 'date',
          required: true,
          placeholder: 'Chọn ngày sinh',
          gridSize: 6,
          disabled: dependenciesLoading
        },
        {
          name: 'note',
          label: 'Ghi chú (tùy chọn)',
          type: 'textarea',
          placeholder: 'Nhập ghi chú cho con (nếu có)',
          rows: 4,
          gridSize: 12,
          disabled: dependenciesLoading
        }
      ],
      [dependenciesLoading]
    );

    const defaultValues = useMemo(
      () => ({
        name: data.name || '',
        dateOfBirth: data.dateOfBirth || '',
        note: data.note || '',
        image: data.image || ''
      }),
      [data]
    );

    const handleSubmit = async (formValues) => {
      // Merge image from data into formValues
      const mergedData = {
        ...formValues,
        image: data.image instanceof File ? data.image : (formValues.image || null)
      };
      updateData(mergedData);
      return true;
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (formRef.current?.submit) {
          // Ensure image is set in form before submitting
          if (data.image instanceof File && formRef.current?.setValue) {
            formRef.current.setValue('image', data.image, { shouldValidate: false });
          }
          return await formRef.current.submit();
        }
        return false;
      }
    }));

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Form
            ref={formRef}
            schema={userChildStep1Schema}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            fields={fields}
            hideSubmitButton
            disabled={dependenciesLoading}
          />
          
          {/* Image Upload Section */}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <ImageUpload
                  value={data.image instanceof File ? data.image : null}
                  onChange={(file) => {
                    // Get current form values to preserve them
                    const currentFormValues = formRef.current?.getValues ? formRef.current.getValues() : {};
                    // Important: Destructure to remove image field before spreading
                    const { image: _, ...otherFormValues } = currentFormValues;
                    // Update data with new image, preserving all other form values
                    updateData({ 
                      ...otherFormValues, // Use form values instead of old data
                      image: file 
                    });
                    // Also update form value
                    if (formRef.current?.setValue) {
                      formRef.current.setValue('image', file, { shouldValidate: false });
                    }
                  }}
                  label="Ảnh đại diện (tùy chọn)"
                  helperText="Chọn file ảnh để tải lên (JPG, PNG, etc.) - Tối đa 10MB"
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                  disabled={dependenciesLoading}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    );
  }
);

Step1BasicInfo.displayName = 'CreateChildStep1BasicInfo';

export default Step1BasicInfo;

