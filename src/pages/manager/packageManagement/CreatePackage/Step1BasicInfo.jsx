import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Box, Typography, Autocomplete, TextField, Alert } from '@mui/material';
import { toast } from 'react-toastify';

const Step1BasicInfo = React.forwardRef(
  (
    {
      data,
      updateData,
      stepIndex,
      totalSteps,
      templateOptions = [],
      templates = [],
      dependenciesLoading = false,
      onTemplateSelect,
      isTemplatePreSelected = false
    },
    ref
  ) => {
    const [currentTemplateId, setCurrentTemplateId] = useState(data.packageTemplateId || '');

    useEffect(() => {
      if (data.packageTemplateId && data.packageTemplateId !== currentTemplateId) {
        setCurrentTemplateId(data.packageTemplateId);
      }
    }, [data.packageTemplateId, currentTemplateId]);

    const selectedTemplate = useMemo(
      () => templates.find((template) => String(template.id) === String(currentTemplateId)) || null,
      [templates, currentTemplateId]
    );

    const handleTemplateChange = (_, option) => {
      const newTemplateId = option?.value || '';
      setCurrentTemplateId(newTemplateId);
      updateData({ packageTemplateId: newTemplateId });
      if (onTemplateSelect) {
        onTemplateSelect(newTemplateId);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (!currentTemplateId) {
          toast.error('Vui lòng chọn một mẫu gói trước khi tiếp tục');
          return false;
        }
        return true;
      }
    }));

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0.75, fontWeight: 600, fontSize: '1.1rem' }}>
          Bước {stepIndex + 1}/{totalSteps}: Chọn mẫu & thông tin cơ bản
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
          Chọn mẫu gói phù hợp và nhập tên, mô tả cùng cấp độ học sinh áp dụng.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Mẫu gói áp dụng
          </Typography>
          {isTemplatePreSelected && currentTemplateId && (
            <Alert severity="success" sx={{ mb: 1 }}>
              Mẫu gói đã được chọn từ danh sách mẫu gói.
            </Alert>
          )}
          <Autocomplete
            disableClearable
            options={templateOptions}
            value={templateOptions.find((option) => String(option.value) === String(currentTemplateId)) || null}
            onChange={handleTemplateChange}
            loading={dependenciesLoading}
            disabled={isTemplatePreSelected && currentTemplateId}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={isTemplatePreSelected && currentTemplateId ? "Mẫu gói đã được chọn" : "Chọn mẫu gói"}
                size="small"
                disabled={dependenciesLoading || templateOptions.length === 0 || (isTemplatePreSelected && currentTemplateId)}
              />
            )}
          />
          {isTemplatePreSelected && currentTemplateId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Mẫu gói đã được chọn từ danh sách. Bạn có thể bỏ disabled để thay đổi nếu cần.
            </Typography>
          )}
          {!currentTemplateId && !isTemplatePreSelected && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Vui lòng chọn mẫu gói để sử dụng các thông số gợi ý (giá, thời hạn, slot, lợi ích).
            </Alert>
          )}
        </Box>

        {selectedTemplate && (
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1.5,
              p: 1.5,
              mb: 2,
              backgroundColor: '#fafafa'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {selectedTemplate.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {selectedTemplate.desc || 'Không có mô tả'}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 1
              }}
            >
              <Box sx={{ p: 1, borderRadius: 1, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
                <Typography variant="caption" color="text.secondary">
                  Khoảng giá (VNĐ)
                </Typography>
                <Typography variant="subtitle2">
                  {selectedTemplate.minPrice?.toLocaleString('vi-VN') ?? '-'} -{' '}
                  {selectedTemplate.maxPrice?.toLocaleString('vi-VN') ?? '-'}
                </Typography>
              </Box>
              <Box sx={{ p: 1, borderRadius: 1, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
                <Typography variant="caption" color="text.secondary">
                  Thời hạn (tháng)
                </Typography>
                <Typography variant="subtitle2">
                  {selectedTemplate.minDurationInMonths ?? '-'} - {selectedTemplate.maxDurationInMonths ?? '-'}
                </Typography>
              </Box>
              <Box sx={{ p: 1, borderRadius: 1, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
                <Typography variant="caption" color="text.secondary">
                  Slots
                </Typography>
                <Typography variant="subtitle2">
                  {selectedTemplate.minSlots ?? '-'} - {selectedTemplate.maxSlots ?? '-'}
                </Typography>
              </Box>
            </Box>

          </Box>
        )}

        <Box sx={{ flex: 1 }} />
      </Box>
    );
  }
);

Step1BasicInfo.displayName = 'PackageStep1BasicInfo';

export default Step1BasicInfo;


