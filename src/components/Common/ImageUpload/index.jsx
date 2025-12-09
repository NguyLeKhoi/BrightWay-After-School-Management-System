import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import imageCompression from 'browser-image-compression';

const ImageUpload = ({
  value = null,
  onChange,
  label = 'Ảnh đại diện',
  helperText = 'Chọn file ảnh để tải lên (JPG, PNG, etc.)',
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  error = false,
  required = false,
  maxSizeMB = 1, // Max size after compression (1MB)
  maxWidthOrHeight = 1920 // Max width/height
}) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const currentFileRef = useRef(null);

  useEffect(() => {
    // Cleanup previous preview URL if it was created with createObjectURL
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [preview]);

  useEffect(() => {
    // Handle no value - clear everything
    if (!value) {
      setPreview(null);
      currentFileRef.current = null;
      return;
    }
    
    // Handle string URL (from server)
    if (typeof value === 'string') {
      setPreview(value);
      currentFileRef.current = null;
      return;
    }
    
    // Handle File object - DO NOT create preview here, let handleFileSelect do it
    // This useEffect only runs when value changes from parent
    // If we already have the same file, keep the preview
    if (value instanceof File && currentFileRef.current === value) {
      // Same file reference, keep current preview
      return;
    }
  }, [value]);

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > maxSize) {
      alert(`Kích thước file không được vượt quá ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
      return;
    }

    // Always compress images
    try {
      setIsCompressing(true);
      
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: maxWidthOrHeight,
        useWebWorker: true,
        fileType: file.type,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Create preview immediately after compression
      const previewUrl = URL.createObjectURL(compressedFile);
      previewUrlRef.current = previewUrl;
      currentFileRef.current = compressedFile;
      setPreview(previewUrl);
      
      // Call onChange to pass compressed file to parent
      onChange(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Lỗi khi nén ảnh. Vui lòng thử lại.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    handleFileSelect(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    
    // Cleanup preview URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    
    setPreview(null);
    currentFileRef.current = null;
    onChange(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <Box>
      <Typography
        variant="body2"
        sx={{
          mb: 1,
          fontWeight: 500,
          color: error ? 'error.main' : 'text.primary'
        }}
      >
        {label}
        {required && <span style={{ color: 'red', marginLeft: 4 }}>*</span>}
      </Typography>

      <Paper
        elevation={0}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: error
            ? 'error.main'
            : dragActive
            ? 'primary.main'
            : preview
            ? 'success.main'
            : 'grey.300',
          borderRadius: 2,
          backgroundColor: preview
            ? 'success.50'
            : dragActive
            ? 'primary.50'
            : 'grey.50',
          transition: 'all 0.3s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          position: 'relative',
          '&:hover': {
            borderColor: disabled ? 'grey.300' : preview ? 'success.main' : 'primary.main',
            backgroundColor: disabled
              ? 'grey.50'
              : preview
              ? 'success.50'
              : 'primary.50'
          }
        }}
        onClick={disabled ? undefined : handleUploadClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        <Stack spacing={2} alignItems="center">
          {isCompressing ? (
            <>
              <CircularProgress size={60} />
              <Typography variant="body2" color="text.secondary">
                Đang nén ảnh...
              </Typography>
            </>
          ) : !preview ? (
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
                  {dragActive ? 'Thả ảnh vào đây' : 'Kéo thả ảnh hoặc nhấn để chọn'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {helperText}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick();
                  }}
                  disabled={disabled}
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
                  maxWidth: 300,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: 'success.main'
                }}
              >
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: 300,
                    objectFit: 'contain'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'success.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick();
                  }}
                  disabled={disabled}
                >
                  Chọn ảnh khác
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>

      {helperText && !preview && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUpload;

