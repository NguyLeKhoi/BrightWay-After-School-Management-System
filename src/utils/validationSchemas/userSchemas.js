import * as yup from 'yup';

// Schema for Admin creating Manager (POST /User/manager)
// Password is no longer required - users will set password via email confirmation
export const createManagerSchema = yup.object({
  name: yup
    .string()
    .required('Họ và tên là bắt buộc')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng'),
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
  phoneNumber: yup
    .string()
    .optional()
    .matches(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  branchId: yup
    .string()
    .optional()
});

// Schema for Manager creating Staff (POST /User/staff)
// Password is no longer required - users will set password via email confirmation
export const createStaffSchema = yup.object({
  name: yup
    .string()
    .required('Họ và tên là bắt buộc')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng'),
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
  phoneNumber: yup
    .string()
    .optional()
    .matches(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  gender: yup
    .string()
    .optional()
});

// Schema for updating user (Admin updates Manager, Manager updates Staff)
// Allows updating name, branchId, and isActive
export const updateUserSchema = yup.object({
  name: yup
    .string()
    .required('Họ và tên là bắt buộc')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được quá 100 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng'),
  branchId: yup
    .string()
    .optional()
    .nullable(),
  isActive: yup
    .boolean()
    .optional()
});

// Deprecated schemas for backward compatibility
export const createUserByAdminSchema = createManagerSchema;
export const createUserSchema = createStaffSchema;
export const updateManagerUserSchema = updateUserSchema;
