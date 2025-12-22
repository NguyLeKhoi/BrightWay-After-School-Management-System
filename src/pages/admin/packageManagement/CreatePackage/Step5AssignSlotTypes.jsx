import React, { useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { Box, Typography, Autocomplete, TextField, Checkbox, ListItemText, CircularProgress } from '@mui/material';
import slotTypeService from '../../../../services/slotType.service';
import { toast } from 'react-toastify';

const Step5AssignSlotTypes = React.forwardRef(
  ({ data, updateData, stepIndex, totalSteps }, ref) => {
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState([]);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
      const load = async () => {
        try {
          const slotTypes = await slotTypeService.getAllSlotTypes();
          setOptions(Array.isArray(slotTypes) ? slotTypes : []);
          
          // Load existing slot type IDs if available
          const existing = (data.slotTypeIds || []).filter(Boolean);
          setSelected(existing);
        } catch (err) {

          toast.error('Không thể tải danh sách loại ca giữ trẻ', {
            position: 'top-right',
            autoClose: 3000
          });
          setOptions([]);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [data.slotTypeIds]);

    useImperativeHandle(ref, () => ({
      submit: async () => {
        // Only save slotTypeIds to formData, will be assigned in handleComplete
        if (updateData) {
          updateData({ slotTypeIds: selected });
        }
        return true;
      }
    }));

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0.75, fontWeight: 600, fontSize: '1.1rem' }}>
          Bước {stepIndex + 1}/{totalSteps}: Gán loại ca giữ trẻ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
          Chọn các loại ca giữ trẻ được phép sử dụng với gói này. Phụ huynh chỉ có thể đăng ký các slot có loại ca giữ trẻ đã được gán.
        </Typography>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Autocomplete
                multiple
                options={options}
                getOptionLabel={(option) => option.name || 'Chưa có tên'}
                value={options.filter(st => selected.includes(st.id))}
                onChange={(e, newVal) => setSelected(newVal.map(st => st.id))}
                disableCloseOnSelect={true}
                renderOption={(props, option, { selected: isSelected }) => (
                  <Box component="li" {...props}>
                    <Checkbox checked={isSelected} />
                    <ListItemText 
                      primary={option.name || 'Chưa có tên'} 
                      secondary={option.description || 'Không có mô tả'} 
                    />
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    placeholder="Tìm và chọn loại ca giữ trẻ..." 
                    variant="standard"
                  />
                )}
                sx={{
                  '& .MuiInput-underline:before': { borderBottomColor: 'var(--color-primary)' },
                  '& .MuiInput-underline:hover:before': { borderBottomColor: 'var(--color-primary-dark)' },
                  '& .MuiInput-underline:after': { borderBottomColor: 'var(--color-primary)' },
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Đã chọn: <b>{selected.length}</b> loại ca giữ trẻ
              </Typography>
              {selected.length === 0 && (
                <Typography variant="body2" color="warning.main" sx={{ fontStyle: 'italic' }}>
                  ⚠️ Lưu ý: Nếu không chọn loại ca giữ trẻ nào, phụ huynh sẽ không thể đăng ký slot nào cho gói này.
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>
    );
  }
);

Step5AssignSlotTypes.displayName = 'Step5AssignSlotTypes';

export default Step5AssignSlotTypes;


