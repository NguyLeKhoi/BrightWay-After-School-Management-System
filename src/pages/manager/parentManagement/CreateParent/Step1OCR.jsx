import React, { useImperativeHandle, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import imageCompression from 'browser-image-compression';
import ocrService from '../../../../services/ocr.service';

const Step1OCR = React.forwardRef(
  ({ data, updateData, stepIndex, totalSteps }, ref) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSensitiveImageError, setHasSensitiveImageError] = useState(false);
    const fileInputRef = useRef(null);
    const previewUrlRef = useRef(null);

    // Cleanup preview URL on unmount
    React.useEffect(() => {
      return () => {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
      };
    }, []);

    const handleFileSelect = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 10MB');
        return;
      }

      setError(null);
      setHasSensitiveImageError(false);

      // Compress image before processing
      let processedFile = file;
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: file.type,
        };
        
        processedFile = await imageCompression(file, options);
      } catch (err) {

        // If compression fails, use original file
        processedFile = file;
      }

      setSelectedFile(processedFile);

      // Cleanup old preview URL before creating new one
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      // Show preview BEFORE starting OCR
      const previewUrl = URL.createObjectURL(processedFile);
      previewUrlRef.current = previewUrl;
      setPreview(previewUrl);

      // Auto extract OCR immediately after file is selected
      setLoading(true);
      try {
        const ocrData = await ocrService.extractAndStoreCCCD(processedFile);
        
        // Reset sensitive image error if successful
        setHasSensitiveImageError(false);
        
        // Helper function to convert date to dd/mm/yyyy format
        const formatDateToDDMMYYYY = (dateString) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          } catch {
            return '';
          }
        };
        
        // Auto-fill data from OCR
        // Map fullName to name (API returns fullName but we use name in form)
        updateData({
          ...data,
          name: ocrData.fullName || ocrData.name || data.name || '',
          identityCardNumber: ocrData.identityCardNumber || data.identityCardNumber || '',
          dateOfBirth: formatDateToDDMMYYYY(ocrData.dateOfBirth) || data.dateOfBirth || '',
          gender: ocrData.gender || data.gender || '',
          address: ocrData.address || data.address || '',
          identityCardPublicId: ocrData.identityCardPublicId || data.identityCardPublicId || '',
          issuedDate: formatDateToDDMMYYYY(ocrData.issuedDate) || data.issuedDate || '',
          issuedPlace: ocrData.issuedPlace || data.issuedPlace || ''
        });
      } catch (err) {
        // Check if it's a 500 error about sensitive image
        const errorDetail = err.response?.data?.detail || '';
        const errorMessage = err.response?.data?.message || err.message || '';
        const isSensitiveImageError = 
          err.response?.status === 500 && 
          (errorDetail.toLowerCase().includes('nhạy cảm') ||
           errorDetail.toLowerCase().includes('inappropriate') ||
           errorDetail.toLowerCase().includes('sensitive') ||
           errorMessage.toLowerCase().includes('nhạy cảm') ||
           errorMessage.toLowerCase().includes('inappropriate') ||
           errorMessage.toLowerCase().includes('sensitive'));
        
        if (isSensitiveImageError) {
          setHasSensitiveImageError(true);
          const sensitiveErrorMessage = errorDetail || errorMessage || 'Ảnh không phù hợp. Vui lòng chọn ảnh CCCD hợp lệ.';
          setError(sensitiveErrorMessage);
          // Clear identityCardPublicId to prevent proceeding
          updateData({
            ...data,
            identityCardPublicId: ''
          });
        } else {
          setHasSensitiveImageError(false);
          const genericErrorMessage = errorMessage || errorDetail || 'Có lỗi xảy ra khi trích xuất thông tin từ CCCD';
          setError(genericErrorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };


    const handleReset = () => {
      // Cleanup preview URL
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      
      setSelectedFile(null);
      setPreview(null);
      setError(null);
      setHasSensitiveImageError(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Clear identityCardPublicId when resetting
      updateData({
        ...data,
        identityCardPublicId: ''
      });
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        // Block if there's a sensitive image error
        if (hasSensitiveImageError) {
          setError('Vui lòng chọn ảnh CCCD hợp lệ. Ảnh hiện tại không phù hợp.');
          return false;
        }
        if (!data.identityCardPublicId && !data.name) {
          setError('Vui lòng trích xuất thông tin từ ảnh CCCD trước khi tiếp tục');
          return false;
        }
        return true;
      }
    }));

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0.75, fontWeight: 600, fontSize: '1.1rem' }}>
          Bước {stepIndex + 1}/{totalSteps}: Chụp ảnh CCCD
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
          Chụp hoặc tải ảnh CCCD, hệ thống sẽ tự động trích xuất thông tin ngay sau khi chọn ảnh.
        </Typography>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '2px dashed',
              borderColor: data.identityCardPublicId ? 'success.main' : (selectedFile ? 'primary.main' : 'grey.300'),
              borderRadius: 2,
              backgroundColor: data.identityCardPublicId ? 'success.50' : (selectedFile ? 'primary.50' : 'grey.50'),
              transition: 'all 0.3s ease'
            }}
          >
            <Stack spacing={3} alignItems="center">
              {!preview ? (
                <>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: 'primary.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main'
                    }}
                  >
                    <PhotoCameraIcon sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Chụp hoặc tải ảnh CCCD
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Hệ thống sẽ tự động trích xuất thông tin từ ảnh CCCD
                    </Typography>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={handleUploadClick}
                      disabled={loading}
                    >
                      Chọn ảnh
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 400,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: data.identityCardPublicId ? 'success.main' : 'primary.main'
                    }}
                  >
                    <img
                      src={preview}
                      alt="CCCD preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                    {data.identityCardPublicId && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'success.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CheckCircleIcon />
                      </Box>
                    )}
                  </Box>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      Chọn lại
                    </Button>
                    {loading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                          Đang trích xuất thông tin...
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2,
                ...(hasSensitiveImageError && {
                  backgroundColor: 'error.50',
                  border: '2px solid',
                  borderColor: 'error.main',
                  fontWeight: 600
                })
              }}
            >
              {error}
              {hasSensitiveImageError && (
                <Box sx={{ mt: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                  Vui lòng chọn lại ảnh CCCD hợp lệ để tiếp tục.
                </Box>
              )}
            </Alert>
          )}

          {data.identityCardPublicId && !hasSensitiveImageError && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Đã trích xuất thông tin thành công! Vui lòng kiểm tra và chỉnh sửa ở các bước tiếp theo nếu cần.
            </Alert>
          )}
        </Box>
      </Box>
    );
  }
);

Step1OCR.displayName = 'CreateParentStep1OCR';

export default Step1OCR;


