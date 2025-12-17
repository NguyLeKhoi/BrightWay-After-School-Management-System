import React, { useMemo, useImperativeHandle, forwardRef, useState } from 'react';
import { Box, Typography, Checkbox, FormControlLabel, FormGroup, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Form from '../../../../components/Common/Form';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog';
import { bulkCreateBranchSlotDateSchema } from '../../../../utils/validationSchemas/bulkCreateBranchSlotSchemas';

const WEEK_DAYS = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'Chủ nhật' }
];

const Step1DateSelection = forwardRef(
  (
    {
      data,
      updateData,
      stepIndex,
      totalSteps,
      timeframeOptions = [],
      slotTypeOptions = [],
      dependenciesLoading = false,
      actionLoading = false
    },
    ref
  ) => {
    const [showWarningDialog, setShowWarningDialog] = useState(false);

    const timeframeSelectOptions = useMemo(
      () => [
        { value: '', label: 'Chọn khung giờ' },
        ...timeframeOptions.map((tf) => ({
          value: tf.id,
          label: `${tf.name} (${tf.startTime} - ${tf.endTime})`
        }))
      ],
      [timeframeOptions]
    );

    const slotTypeSelectOptions = useMemo(
      () => [
        { value: '', label: 'Chọn loại ca giữ trẻ' },
        ...slotTypeOptions.map((st) => ({
          value: st.id,
          label: st.name
        }))
      ],
      [slotTypeOptions]
    );

    const formFields = useMemo(
      () => [
        {
          name: 'timeframeId',
          label: 'Khung giờ',
          type: 'select',
          required: true,
          options: timeframeSelectOptions,
          gridSize: 6,
          disabled: dependenciesLoading || actionLoading || timeframeSelectOptions.length === 0
        },
        {
          name: 'slotTypeId',
          label: 'Loại ca giữ trẻ',
          type: 'select',
          required: true,
          options: slotTypeSelectOptions,
          gridSize: 6,
          disabled: dependenciesLoading || actionLoading || slotTypeSelectOptions.length === 0
        },
        {
          name: 'startDate',
          label: 'Ngày bắt đầu',
          type: 'date',
          required: true,
          gridSize: 6,
          disabled: actionLoading
        },
        {
          name: 'endDate',
          label: 'Ngày kết thúc',
          type: 'date',
          required: true,
          gridSize: 6,
          disabled: actionLoading
        },
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          required: true,
          options: [
            { value: 'Available', label: 'Có sẵn' },
            { value: 'Full', label: 'Đầy' },
            { value: 'Cancelled', label: 'Đã hủy' }
          ],
          gridSize: 6,
          disabled: actionLoading
        }
      ],
      [timeframeSelectOptions, slotTypeSelectOptions, dependenciesLoading, actionLoading]
    );

    const defaultValues = useMemo(
      () => ({
        timeframeId: data.timeframeId || '',
        slotTypeId: data.slotTypeId || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        status: data.status || 'Available'
      }),
      [data.timeframeId, data.slotTypeId, data.startDate, data.endDate, data.status]
    );

    const formRef = React.useRef(null);

    const generateDates = (startDate, endDate, selectedWeekDays) => {
      if (!startDate || !endDate || selectedWeekDays.length === 0) {
        return [];
      }

      const dates = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        if (selectedWeekDays.includes(dayOfWeek)) {
          dates.push(new Date(date));
        }
      }

      return dates;
    };

    const estimatedSlots = useMemo(() => {
      const dates = generateDates(data.startDate, data.endDate, data.selectedWeekDays || []);
      return dates.length;
    }, [data.startDate, data.endDate, data.selectedWeekDays]);

    const hasWeekdayMatch = useMemo(() => {
      if (!data.startDate || !data.endDate || !data.selectedWeekDays || data.selectedWeekDays.length === 0) {
        return true; // Only evaluate when all inputs are provided
      }
      return generateDates(data.startDate, data.endDate, data.selectedWeekDays).length > 0;
    }, [data.startDate, data.endDate, data.selectedWeekDays]);

    const handleWeekDayToggle = (weekDay) => {
      const currentSelection = data.selectedWeekDays || [];
      const isSelected = currentSelection.includes(weekDay);
      const newSelection = isSelected
        ? currentSelection.filter((d) => d !== weekDay)
        : [...currentSelection, weekDay];

      // Check if new selection matches with date range
      if (data.startDate && data.endDate && newSelection.length > 0) {
        const matchedDates = generateDates(data.startDate, data.endDate, newSelection);
        if (matchedDates.length === 0) {
          setShowWarningDialog(true);
          return; // Don't update if no match
        }
      }

      updateData({ selectedWeekDays: newSelection });
    };

    const handleFormFieldChange = (formValues) => {
      // Auto-update data when form fields change
      updateData({
        timeframeId: formValues.timeframeId,
        slotTypeId: formValues.slotTypeId,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        status: formValues.status
      });
    };

    const handleSubmit = async (formData) => {
      if (!data.selectedWeekDays || data.selectedWeekDays.length === 0) {
        throw new Error('Vui lòng chọn ít nhất một ngày trong tuần');
      }

      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        throw new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
      }

      const matchedDates = generateDates(formData.startDate, formData.endDate, data.selectedWeekDays);
      if (matchedDates.length === 0) {
        throw new Error('Các ngày trong tuần đã chọn không trùng với khoảng ngày đã chọn');
      }

      updateData({
        timeframeId: formData.timeframeId,
        slotTypeId: formData.slotTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        selectedWeekDays: data.selectedWeekDays
      });
      return true;
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (formRef.current && formRef.current.submit) {
          return await formRef.current.submit();
        }
        return false;
      }
    }));

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
          <Form
            ref={formRef}
            schema={bulkCreateBranchSlotDateSchema}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onFieldChange={handleFormFieldChange}
            fields={formFields}
            hideSubmitButton={true}
            disabled={dependenciesLoading || actionLoading}
          />

          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Chọn các ngày trong tuần *
            </Typography>
            <FormGroup>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {WEEK_DAYS.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={(data.selectedWeekDays || []).includes(day.value)}
                        onChange={() => handleWeekDayToggle(day.value)}
                        disabled={actionLoading}
                      />
                    }
                    label={day.label}
                  />
                ))}
              </Box>
            </FormGroup>
            {(!data.selectedWeekDays || data.selectedWeekDays.length === 0) && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                Vui lòng chọn ít nhất một ngày trong tuần
              </Typography>
            )}

            {data.startDate && data.endDate && data.selectedWeekDays && data.selectedWeekDays.length > 0 && !hasWeekdayMatch && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                Các ngày trong tuần đã chọn không trùng với khoảng ngày đã chọn
              </Typography>
            )}
          </Box>

          {estimatedSlots > 0 && (
            <Alert severity="info" icon={<AddIcon />}>
              <Typography variant="body2">
                Sẽ tạo <strong>{estimatedSlots}</strong> ca giữ trẻ dựa trên lựa chọn của bạn
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Warning Dialog */}
        <ConfirmDialog
          open={showWarningDialog}
          onClose={() => setShowWarningDialog(false)}
          onConfirm={() => setShowWarningDialog(false)}
          title="Cảnh báo"
          description={`Các ngày trong tuần đã chọn không trùng với khoảng ngày từ ngày bắt đầu đến ngày kết thúc. Vui lòng chọn ngày trong tuần khác hoặc thay đổi khoảng ngày.`}
          confirmText="Hiểu rồi"
          cancelText="Đóng"
          confirmColor="warning"
        />
      </Box>
    );
  }
);

Step1DateSelection.displayName = 'Step1DateSelection';

export default Step1DateSelection;
