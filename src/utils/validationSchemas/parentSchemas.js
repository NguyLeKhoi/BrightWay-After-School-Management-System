import * as yup from 'yup';

// Schema for Step 1: Basic Info
export const createParentBasicInfoSchema = yup.object({
  name: yup
    .string()
    .required('Họ và tên là bắt buộc')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự'),
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
  phoneNumber: yup
    .string()
    .optional()
    .matches(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'),
  avatarFile: yup
    .mixed()
    .nullable()
    .notRequired()
    .test('is-file-or-null', 'Ảnh đại diện phải là file hợp lệ', (value) => {
      if (!value || value === '') return true; // null/undefined/empty string is allowed
      if (value instanceof File) {
        // Validate file type
        return value.type.startsWith('image/');
      }
      return false;
    })
});

// Schema for Step 2: CCCD Info (all optional for manual mode)
export const createParentCCCDInfoSchema = yup.object({
  name: yup
    .string()
    .optional()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự'),
  email: yup
    .string()
    .optional()
    .email('Email không hợp lệ'),
  phoneNumber: yup
    .string()
    .optional()
    .matches(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'),
  avatarFile: yup
    .mixed()
    .nullable()
    .notRequired()
    .test('fileSize', 'Kích thước file không được vượt quá 5MB', (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024; // 5MB
    })
    .test('fileType', 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)', (value) => {
      if (!value) return true;
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(value.type);
    }),
  identityCardNumber: yup
    .string()
    .optional(),
  dateOfBirth: yup
    .string()
    .optional()
    .matches(/^(\d{2}\/\d{2}\/\d{4}|)$/, 'Ngày sinh phải có định dạng dd/mm/yyyy'),
  gender: yup
    .string()
    .optional(),
  address: yup
    .string()
    .optional(),
  issuedDate: yup
    .string()
    .optional()
    .matches(/^(\d{2}\/\d{2}\/\d{4}|)$/, 'Ngày cấp phải có định dạng dd/mm/yyyy'),
  issuedPlace: yup
    .string()
    .optional()
});

// Schema for Step 2: CCCD Info in OCR mode (email & password required)
export const createParentCCCDInfoOCRSchema = yup.object({
  name: yup
    .string()
    .required('Họ và tên là bắt buộc')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự'),
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ')
    .max(256, 'Email không được quá 256 ký tự'),
  phoneNumber: yup
    .string()
    .optional()
    .matches(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'),
  avatarFile: yup
    .mixed()
    .nullable()
    .notRequired()
    .test('fileSize', 'Kích thước file không được vượt quá 5MB', (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024; // 5MB
    })
    .test('fileType', 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)', (value) => {
      if (!value) return true;
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(value.type);
    }),
  identityCardNumber: yup
    .string()
    .optional(),
  dateOfBirth: yup
    .string()
    .optional()
    .matches(/^(\d{2}\/\d{2}\/\d{4}|)$/, 'Ngày sinh phải có định dạng dd/mm/yyyy'),
  gender: yup
    .string()
    .optional(),
  address: yup
    .string()
    .optional(),
  issuedDate: yup
    .string()
    .optional()
    .matches(/^(\d{2}\/\d{2}\/\d{4}|)$/, 'Ngày cấp phải có định dạng dd/mm/yyyy'),
  issuedPlace: yup
    .string()
    .optional()
});

// Schema for creating parent with CCCD
export const createParentWithCCCDSchema = yup.object({
  name: yup
    .string()
    .required('Họ và tên là bắt buộc')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự'),
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ')
    .max(256, 'Email không được quá 256 ký tự'),
  identityCardNumber: yup
    .string()
    .optional(),
  dateOfBirth: yup
    .date()
    .nullable()
    .optional(),
  gender: yup
    .string()
    .optional(),
  address: yup
    .string()
    .optional(),
  issuedDate: yup
    .date()
    .nullable()
    .optional(),
  issuedPlace: yup
    .string()
    .optional(),
  identityCardPublicId: yup
    .string()
    .optional()
});

