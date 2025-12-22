import React, { useEffect, useState, useMemo, forwardRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  Avatar,
  Chip
} from '@mui/material';
import { ChildCare as ChildIcon, Business as BranchIcon } from '@mui/icons-material';

const Step1ChildAndBranch = forwardRef(({
  data: formData = {},
  updateData = () => {},
  children = [],
  branches = [],
  isLoading = false
}, ref) => {
  const selectedChild = formData.studentId ? children.find(c => c.id === formData.studentId) : null;

  const handleStudentChange = (event) => {
    const studentId = event.target.value;
    updateData({
      ...(formData || {}),
      studentId,
      targetBranchId: '' // Reset branch selection when changing child
    });
  };

  const handleBranchChange = (event) => {
    updateData({
      ...(formData || {}),
      targetBranchId: event.target.value
    });
  };

  const currentBranch = useMemo(() => {
    if (!selectedChild) return null;
    // First try to get branch info directly from child data
    const branchNameFromChild = selectedChild.branchName || selectedChild.branch?.branchName;
    const branchIdFromChild = selectedChild.branchId || selectedChild.branch?.id;
    
    // If we have branch info from child, return it as is
    if (branchNameFromChild && branchIdFromChild) {
      return {
        id: branchIdFromChild,
        branchName: branchNameFromChild,
        address: selectedChild.branch?.address
      };
    }
    
    // Otherwise, try to find in branches array
    const branchId = selectedChild.branchId || selectedChild.branch?.id;
    return branchId ? branches.find(b => b.id === branchId) : null;
  }, [selectedChild?.branchId, selectedChild?.branch?.id, selectedChild?.branchName, selectedChild?.branch?.branchName, branches]);

  const targetBranch = useMemo(() => 
    formData.targetBranchId ? branches.find(b => b.id === formData.targetBranchId) : null,
    [formData.targetBranchId, branches]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        Chọn con và chi nhánh đích
      </Typography>

      {/* Child Selection */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ChildIcon color="primary" />
          <Typography variant="h6">Chọn con</Typography>
        </Box>

        <FormControl fullWidth required>
          <InputLabel>Chọn con</InputLabel>
          <Select
            value={formData.studentId || ''}
            onChange={handleStudentChange}
            disabled={isLoading}
            label="Chọn con"
          >
            {children.map((child) => (
              <MenuItem key={child.id} value={child.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {child.name?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">{child.name || child.userName || 'Chưa có tên'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {child.branchName || child.branch?.branchName || 'Chi nhánh chưa xác định'}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
          {/* Validation will be handled by StepperForm on submit */}
        </FormControl>

        {selectedChild && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Thông tin chi nhánh hiện tại:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BranchIcon fontSize="small" color="action" />
              <Chip
                label={currentBranch?.branchName || 'Chưa xác định'}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Branch Selection */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <BranchIcon color="primary" />
          <Typography variant="h6">Chọn chi nhánh đích</Typography>
        </Box>

        <FormControl fullWidth required>
          <InputLabel>Chi nhánh đích</InputLabel>
          <Select
            value={formData.targetBranchId || ''}
            onChange={handleBranchChange}
            disabled={isLoading || !selectedChild}
            label="Chi nhánh đích"
          >
            {branches
              .filter(branch => branch.id !== selectedChild?.branchId) // Exclude current branch
              .map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  <Box>
                    <Typography variant="body1">{branch.branchName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {branch.address || 'Địa chỉ chưa cập nhật'}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
          </Select>
          {/* Validation will be handled by StepperForm on submit */}
          {selectedChild && formData.targetBranchId && currentBranch && targetBranch && (
            <FormHelperText sx={{ color: 'success.main' }}>
              ✓ Chuyển từ {currentBranch.branchName} sang {targetBranch.branchName}
            </FormHelperText>
          )}
        </FormControl>

        {targetBranch && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom color="success.main">
              Chi nhánh đích đã chọn:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BranchIcon fontSize="small" color="success" />
              <Typography variant="body2">{targetBranch.branchName}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {targetBranch.address}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
});

Step1ChildAndBranch.displayName = 'Step1ChildAndBranch';

export default Step1ChildAndBranch;
