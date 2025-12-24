export const createServiceFormFields = (actionLoading) => [
  {
    section: 'Thông tin dịch vụ',
    sectionDescription: 'Tên và mô tả sẽ hiển thị với khách hàng khi xem dịch vụ.',
    name: 'name',
    label: 'Tên Dịch Vụ',
    type: 'text',
    required: true,
    placeholder: 'Ví dụ: Bánh Ostar vị tảo biển',
    disabled: actionLoading,
    gridSize: 12
  },
  {
    name: 'description',
    label: 'Mô Tả',
    type: 'textarea',
    required: false,
    placeholder: 'Mô tả chi tiết về dịch vụ...',
    disabled: actionLoading,
    rows: 3,
    gridSize: 12
  },
  {
    name: 'price',
    label: 'Giá (VND)',
    type: 'number',
    required: true,
    placeholder: '0',
    disabled: actionLoading,
    gridSize: 6
  },
  
  {
    section: 'Hình ảnh',
    sectionDescription: 'Tải lên hình ảnh cho dịch vụ (tùy chọn). Kích thước tối đa 5MB.',
    name: 'imageFile',
    label: 'Hình Ảnh',
    type: 'imageupload',
    required: false,
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: actionLoading,
    helperText: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF). Kích thước tối đa 5MB.',
    gridSize: 12
  },
  {
    section: 'Trạng thái',
    sectionDescription: 'Bật để dịch vụ xuất hiện trong danh sách dịch vụ.',
    name: 'status',
    label: 'Trạng thái hoạt động',
    type: 'switch',
    required: false,
    disabled: actionLoading,
    gridSize: 12
  }
];

