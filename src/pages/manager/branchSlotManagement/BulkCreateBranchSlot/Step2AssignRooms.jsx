import React, { useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Autocomplete,
  TextField
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const Step2AssignRooms = forwardRef(
  (
    {
      data,
      updateData,
      stepIndex,
      totalSteps,
      roomOptions = [],
      staffOptions = [],
      dependenciesLoading = false,
      actionLoading = false
    },
    ref
  ) => {
    const roomSelectOptions = useMemo(
      () =>
        roomOptions.map((room) => ({
          value: room.id,
          label: room.name
        })),
      [roomOptions]
    );

    const staffSelectOptions = useMemo(
      () =>
        staffOptions.map((staff) => ({
          value: staff.id,
          label: staff.name
        })),
      [staffOptions]
    );

    const handleAddRoomAssignment = () => {
      const currentAssignments = data.roomAssignments || [];
      updateData({ roomAssignments: [...currentAssignments, { roomId: '', staffId: '', staffName: '' }] });
    };

    const handleRemoveRoomAssignment = (index) => {
      const currentAssignments = data.roomAssignments || [];
      updateData({ roomAssignments: currentAssignments.filter((_, i) => i !== index) });
    };

    const handleRoomAssignmentChange = (index, field, value) => {
      const currentAssignments = [...(data.roomAssignments || [])];
      currentAssignments[index] = { ...currentAssignments[index], [field]: value };
      updateData({ roomAssignments: currentAssignments });
    };

    const handleSubmit = async () => {
      // Room assignments are optional, so always allow proceeding
      return true;
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit
    }));

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Gán Phòng & Nhân Viên (Tùy chọn)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Bạn có thể gán phòng và nhân viên cho các ca giữ trẻ hoặc để trống để gán sau
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddRoomAssignment}
              disabled={dependenciesLoading || actionLoading}
            >
              Thêm Phòng
            </Button>
          </Box>

          {(!data.roomAssignments || data.roomAssignments.length === 0) ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 'var(--radius-lg)',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Chưa gán phòng nào. Click "Thêm Phòng" để bắt đầu.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddRoomAssignment}
                disabled={dependenciesLoading || actionLoading}
              >
                Thêm Phòng Đầu Tiên
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data.roomAssignments.map((assignment, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Autocomplete
                        fullWidth
                        options={roomSelectOptions}
                        value={roomSelectOptions.find((r) => r.value === assignment.roomId) || null}
                        onChange={(e, newValue) =>
                          handleRoomAssignmentChange(index, 'roomId', newValue?.value || '')
                        }
                        getOptionLabel={(option) => option?.label || ''}
                        disabled={dependenciesLoading || actionLoading}
                        renderInput={(params) => (
                          <TextField {...params} label="Phòng *" placeholder="Chọn phòng" />
                        )}
                      />
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveRoomAssignment(index)}
                        disabled={dependenciesLoading || actionLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Autocomplete
                      fullWidth
                      options={staffSelectOptions}
                      value={
                        staffSelectOptions.find((s) => s.value === assignment.staffId) || null
                      }
                        onChange={(e, newValue) => {
                          // Always update both staffId and staffName in one go to avoid race condition
                          const currentAssignments = [...(data.roomAssignments || [])];
                          currentAssignments[index] = {
                            ...currentAssignments[index],
                            staffId: newValue?.value || '',
                            staffName: newValue?.label || ''
                          };
                          updateData({ roomAssignments: currentAssignments });
                        }}
                      getOptionLabel={(option) => option?.label || ''}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                      disabled={dependenciesLoading || actionLoading}
                      renderInput={(params) => (
                        <TextField {...params} label="Nhân viên" placeholder="Chọn nhân viên" />
                      )}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  }
);

Step2AssignRooms.displayName = 'Step2AssignRooms';

export default Step2AssignRooms;
