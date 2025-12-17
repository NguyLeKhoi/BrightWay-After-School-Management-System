import * as Yup from 'yup';

export const bulkCreateBranchSlotDateSchema = Yup.object().shape({
  timeframeId: Yup.string().required('Vui lòng chọn khung giờ'),
  slotTypeId: Yup.string().required('Vui lòng chọn loại ca giữ trẻ'),
  startDate: Yup.date().required('Vui lòng chọn ngày bắt đầu').typeError('Ngày bắt đầu không hợp lệ'),
  endDate: Yup.date().required('Vui lòng chọn ngày kết thúc').typeError('Ngày kết thúc không hợp lệ'),
  status: Yup.string().required('Vui lòng chọn trạng thái')
});

export const bulkCreateBranchSlotRoomSchema = Yup.object().shape({});
