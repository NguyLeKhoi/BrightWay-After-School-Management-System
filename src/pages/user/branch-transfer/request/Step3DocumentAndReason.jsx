import React, { useRef, forwardRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Button,
  Alert,
  Chip,
  FormHelperText
} from '@mui/material';
import { CloudUpload as UploadIcon, Description as DocumentIcon } from '@mui/icons-material';

const Step3DocumentAndReason = forwardRef(({
  data: formData = {},
  updateData = () => {},
  isLoading = false
}, ref) => {
  const fileInputRef = useRef(null);

  const handleReasonChange = (event) => {
    updateData({
      ...(formData || {}),
      requestReason: event.target.value
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file ảnh (JPEG, PNG) hoặc PDF');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Kích thước file không được vượt quá 10MB');
        return;
      }

      updateData({
        ...(formData || {}),
        documentFile: file
      });
    }
  };

  const handleRemoveFile = () => {
    updateData({
      ...(formData || {}),
      documentFile: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const needsDocument = formData.changeSchool || formData.changeLevel;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        Tài liệu hỗ trợ và lý do chuyển chi nhánh
      </Typography>

      {/* Document Upload */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <DocumentIcon color="primary" />
          <Typography variant="h6">Tài liệu hỗ trợ</Typography>
          {needsDocument && <Chip label="Bắt buộc" color="error" size="small" />}
        </Box>

        {needsDocument ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Vì bạn đã chọn thay đổi trường học hoặc cấp độ học sinh,
            vui lòng tải lên tài liệu chứng minh (học bạ, giấy chuyển trường, v.v.)
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Tài liệu hỗ trợ là tùy chọn nếu bạn chỉ chuyển chi nhánh mà không thay đổi trường học hoặc cấp độ.
          </Alert>
        )}

        {!formData.documentFile ? (
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              sx={{ mb: 1 }}
            >
              Chọn file tài liệu
            </Button>
            <FormHelperText>
              Chấp nhận: JPEG, PNG, PDF. Kích thước tối đa: 10MB
            </FormHelperText>
            {needsDocument && !formData.documentFile && formData.documentFile !== undefined && (
              <FormHelperText error sx={{ mt: 1 }}>
                Vui lòng tải lên tài liệu hỗ trợ
              </FormHelperText>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'success.main', borderRadius: 1, bgcolor: 'success.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DocumentIcon color="success" />
                <Box>
                  <Typography variant="body1" color="success.main">
                    {formData.documentFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(formData.documentFile.size)}
                  </Typography>
                </Box>
              </Box>
              <Button
                size="small"
                color="error"
                onClick={handleRemoveFile}
                disabled={isLoading}
              >
                Xóa
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Request Reason */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Lý do chuyển chi nhánh (tùy chọn)
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Hãy mô tả lý do bạn muốn chuyển chi nhánh cho con (ví dụ: chuyển nơi ở, điều kiện học tập, v.v.)"
          value={formData.requestReason || ''}
          onChange={handleReasonChange}
          disabled={isLoading}
          variant="outlined"
          helperText="Lý do sẽ giúp quản lý hiểu rõ hơn về yêu cầu của bạn"
        />
      </Paper>

      {/* Summary */}
      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom color="text.secondary">
          Tóm tắt yêu cầu
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2">
            • Chuyển chi nhánh: {formData.changeSchool || formData.changeLevel ? 'Có thay đổi bổ sung' : 'Chỉ chuyển chi nhánh'}
          </Typography>
          {formData.changeSchool && (
            <Typography variant="body2">
              • Thay đổi trường học: Có
            </Typography>
          )}
          {formData.changeLevel && (
            <Typography variant="body2">
              • Thay đổi cấp độ: Có
            </Typography>
          )}
          {formData.documentFile && (
            <Typography variant="body2">
              • Tài liệu: Đã tải lên ({formData.documentFile.name})
            </Typography>
          )}
          {formData.requestReason && (
            <Typography variant="body2">
              • Lý do: Đã cung cấp
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
});

Step3DocumentAndReason.displayName = 'Step3DocumentAndReason';

export default Step3DocumentAndReason;
