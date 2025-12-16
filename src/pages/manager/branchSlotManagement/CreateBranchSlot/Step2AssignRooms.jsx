import React, { useMemo, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Chip, FormHelperText, Checkbox, ListItemText, Button, IconButton, Divider, TextField } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const Step2AssignRooms = forwardRef(
  ({ data, updateData, stepIndex, totalSteps, roomOptions = [], staffOptions = [], dependenciesLoading = false, actionLoading = false }, ref) => {
    const [selectedRoomIds, setSelectedRoomIds] = useState(() => {
      const ids = data.roomIds || [];
      return Array.isArray(ids) ? ids : [];
    });

    const [staffAssignments, setStaffAssignments] = useState(() => {
      const assignments = data.staffAssignments || [];
      return Array.isArray(assignments) ? assignments : [];
    });

    useEffect(() => {
      const ids = data.roomIds || [];
      setSelectedRoomIds(Array.isArray(ids) ? ids : []);
    }, [data.roomIds]);

    useEffect(() => {
      const assignments = data.staffAssignments || [];
      setStaffAssignments(Array.isArray(assignments) ? assignments : []);
    }, [data.staffAssignments]);

    const roomSelectOptions = useMemo(
      () =>
        roomOptions
          .filter((room) => room && room.id) // Chỉ lấy các room có id hợp lệ
          .map((room) => ({
            value: room.id,
            label: room.facilityName 
              ? `${room.name || 'N/A'} - ${room.facilityName}` 
              : room.name || 'N/A'
          })),
      [roomOptions]
    );

    const handleRoomChange = (event) => {
      const value = event.target.value;
      // Material-UI Select multiple returns an array
      const newRoomIds = typeof value === 'string' ? value.split(',') : Array.isArray(value) ? value : [];
      setSelectedRoomIds(newRoomIds);
      updateData({ roomIds: newRoomIds });
    };

    const handleChipDelete = (roomIdToDelete) => {
      const newRoomIds = selectedRoomIds.filter((id) => id !== roomIdToDelete);
      setSelectedRoomIds(newRoomIds);
      updateData({ roomIds: newRoomIds });
    };

    const handleAddStaff = () => {
      const newAssignment = {
        userId: '',
        roomId: '',
        name: ''
      };
      const newAssignments = [...staffAssignments, newAssignment];
      setStaffAssignments(newAssignments);
      updateData({ staffAssignments: newAssignments });
    };

    const handleRemoveStaff = (index) => {
      const newAssignments = staffAssignments.filter((_, i) => i !== index);
      setStaffAssignments(newAssignments);
      updateData({ staffAssignments: newAssignments });
    };

    const handleStaffChange = (index, field, value) => {
      const newAssignments = staffAssignments.map((assignment, i) => {
        if (i === index) {
          return { ...assignment, [field]: value };
        }
        return assignment;
      });
      setStaffAssignments(newAssignments);
      updateData({ staffAssignments: newAssignments });
    };

    // Function to get room options for a specific staff index
    // Excludes rooms already selected by other staff members
    const getRoomSelectOptionsForStaff = useCallback((currentIndex) => {
      const options = [{ value: '', label: 'Không chọn phòng (tùy chọn)' }];
      const selectedRooms = roomOptions.filter((room) => selectedRoomIds.includes(room.id));
      
      // Get all room IDs that are already assigned to other staff (excluding current staff)
      // Only count rooms that have a valid roomId (not empty, null, or undefined)
      const assignedRoomIds = new Set(
        staffAssignments
          .map((assignment, idx) => {
            // Skip current staff's assignment
            if (idx === currentIndex) return null;
            // Only count if roomId exists and is not empty
            const roomId = assignment.roomId;
            return roomId && roomId !== '' ? roomId : null;
          })
          .filter(roomId => roomId !== null && roomId !== undefined && roomId !== '')
      );
      
      // Filter out rooms that are already assigned to other staff
      const availableRooms = selectedRooms.filter(room => !assignedRoomIds.has(room.id));
      
      options.push(...availableRooms.map((room) => ({
        value: room.id,
        label: room.facilityName 
          ? `${room.name || 'N/A'} - ${room.facilityName}` 
          : room.name || 'N/A'
      })));
      return options;
    }, [roomOptions, selectedRoomIds, staffAssignments]);

    const staffSelectOptions = useMemo(
      () => {
        const options = [{ value: '', label: 'Chọn nhân viên' }];
        // Get all assigned staff IDs
        const assignedStaffIds = new Set(staffAssignments.map(a => a.userId).filter(Boolean));
        // Filter out already assigned staff
        const availableStaff = staffOptions.filter(staff => !assignedStaffIds.has(staff.id));
        options.push(...availableStaff.map((staff) => ({
          value: staff.id,
          label: `${staff.name}${staff.email ? ` (${staff.email})` : ''}`
        })));
        return options;
      },
      [staffOptions, staffAssignments]
    );

    useImperativeHandle(
      ref,
      () => ({
        submit: async () => true
      }),
      []
    );

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 1.5, fontWeight: 600 }}>
          Bước {stepIndex + 1}/{totalSteps}: Gán phòng và nhân viên
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chọn phòng và gán nhân viên cho ca giữ trẻ này. Bạn có thể bỏ qua và gán sau.
        </Typography>

        {/* Phần gán phòng */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Gán phòng
          </Typography>
          <FormControl
            fullWidth
            sx={{ mb: 2 }}
            disabled={dependenciesLoading || actionLoading || roomOptions.length === 0}
          >
            <InputLabel id="rooms-select-label">Chọn phòng</InputLabel>
            <Select
              labelId="rooms-select-label"
              id="rooms-select"
              multiple
              value={selectedRoomIds || []}
              onChange={handleRoomChange}
              label="Chọn phòng"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((roomId) => {
                    const room = roomOptions.find((r) => r.id === roomId);
                    const label = room?.facilityName 
                      ? `${room.name || roomId} - ${room.facilityName}` 
                      : room?.name || roomId;
                    return (
                      <Chip
                        key={roomId}
                        label={label}
                        size="small"
                        onDelete={() => handleChipDelete(roomId)}
                        deleteIcon={<Box sx={{ fontSize: '18px' }}>×</Box>}
                      />
                    );
                  })}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              {roomSelectOptions.map((option) => {
                const isSelected = selectedRoomIds.includes(option.value);
                return (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox checked={isSelected} />
                    <ListItemText primary={option.label} />
                  </MenuItem>
                );
              })}
            </Select>
            <FormHelperText>
              {selectedRoomIds.length > 0 ? `Đã chọn ${selectedRoomIds.length} phòng` : 'Có thể bỏ qua và gán phòng sau'}
            </FormHelperText>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Phần gán nhân viên */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Gán nhân viên
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddStaff}
              disabled={dependenciesLoading || actionLoading || staffOptions.length === 0}
            >
              Thêm nhân viên
            </Button>
          </Box>

          {staffAssignments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              Chưa có nhân viên nào được gán. Nhấn "Thêm nhân viên" để bắt đầu.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {staffAssignments.map((assignment, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Nhân viên #{index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveStaff(index)}
                      disabled={actionLoading}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`staff-select-label-${index}`}>Nhân viên *</InputLabel>
                      <Select
                        labelId={`staff-select-label-${index}`}
                        id={`staff-select-${index}`}
                        value={assignment.userId || ''}
                        onChange={(e) => handleStaffChange(index, 'userId', e.target.value)}
                        label="Nhân viên *"
                        disabled={dependenciesLoading || actionLoading || staffSelectOptions.length === 0}
                        renderValue={(value) => {
                          if (!value) return '';
                          // Tìm từ staffOptions gốc thay vì staffSelectOptions đã bị filter
                          const selectedStaff = staffOptions.find(staff => staff.id === value);
                          if (selectedStaff) {
                            return `${selectedStaff.name}${selectedStaff.email ? ` (${selectedStaff.email})` : ''}`;
                          }
                          // Fallback: tìm từ staffSelectOptions nếu không tìm thấy
                          const selectedOption = staffSelectOptions.find(opt => opt.value === value);
                          return selectedOption ? selectedOption.label : '';
                        }}
                      >
                        {staffSelectOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {staffSelectOptions.length === 0 ? 'Không có nhân viên khả dụng' : 'Chọn nhân viên để gán'}
                      </FormHelperText>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel id={`room-select-label-${index}`}>Phòng (tùy chọn)</InputLabel>
                      <Select
                        labelId={`room-select-label-${index}`}
                        id={`room-select-${index}`}
                        value={assignment.roomId || ''}
                        onChange={(e) => handleStaffChange(index, 'roomId', e.target.value)}
                        label="Phòng (tùy chọn)"
                        disabled={dependenciesLoading || actionLoading || selectedRoomIds.length === 0}
                        renderValue={(value) => {
                          if (!value) return '';
                          // Tìm từ roomOptions gốc để hiển thị tên phòng đã chọn
                          const selectedRoom = roomOptions.find(room => room.id === value);
                          if (selectedRoom) {
                            return selectedRoom.facilityName 
                              ? `${selectedRoom.name || 'N/A'} - ${selectedRoom.facilityName}` 
                              : selectedRoom.name || 'N/A';
                          }
                          return '';
                        }}
                      >
                        {getRoomSelectOptionsForStaff(index).map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {selectedRoomIds.length === 0 
                          ? 'Vui lòng chọn phòng ở trên trước' 
                          : 'Chọn phòng nếu nhân viên làm việc tại phòng cụ thể. Mỗi phòng chỉ được chọn một lần.'}
                      </FormHelperText>
                    </FormControl>

                    <TextField
                      fullWidth
                      size="small"
                      label="Tên vai trò (tùy chọn)"
                      placeholder="Ví dụ: Nhân viên chăm sóc chính, Nhân viên hỗ trợ..."
                      value={assignment.name || ''}
                      onChange={(e) => handleStaffChange(index, 'name', e.target.value)}
                      disabled={actionLoading}
                    />
                  </Box>
                </Box>
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

