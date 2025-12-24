import * as yup from 'yup';

// Service validation schema
export const serviceSchema = yup.object({
  name: yup
    .string()
    .required('Tên dịch vụ là bắt buộc')
    .min(2, 'Tên dịch vụ phải có ít nhất 2 ký tự')
    .max(100, 'Tên dịch vụ không được quá 100 ký tự'),
  description: yup
    .string()
    .max(500, 'Mô tả không được quá 500 ký tự'),
  price: yup
    .number()
    .required('Giá là bắt buộc')
    .min(0, 'Giá phải lớn hơn hoặc bằng 0')
    .typeError('Giá phải là số'),
  status: yup
    .boolean()
    .default(true),
  imageFile: yup
    .mixed()
    .nullable()
    .test('fileSize', 'Kích thước file không được vượt quá 5MB', (value) => {
      if (!value || !(value instanceof File)) return true;
      return value.size <= 5 * 1024 * 1024; // 5MB
    })
    .test('fileType', 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)', (value) => {
      if (!value || !(value instanceof File)) return true;
      const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      return acceptedTypes.includes(value.type);
    })
});

