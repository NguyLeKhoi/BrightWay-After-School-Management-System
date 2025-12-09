import * as yup from 'yup';

// Login validation schema
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
  password: yup
    .string()
    .required('Mật khẩu là bắt buộc')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

// Generic validation helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9+\-\s()]+$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Forgot password (send reset code) validation schema
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ')
});

// Reset code validation schema
export const resetCodeSchema = yup.object({
  code: yup
    .string()
    .required('Mã xác nhận là bắt buộc')
    .length(5, 'Mã xác nhận phải có đúng 5 ký tự')
    .matches(/^[A-Z0-9]+$/, 'Mã xác nhận chỉ chứa chữ cái in hoa và số')
});

// Reset password with code validation schema
export const resetPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
  code: yup
    .string()
    .required('Mã xác nhận là bắt buộc')
    .length(5, 'Mã xác nhận phải có đúng 5 ký tự')
    .matches(/^[A-Z0-9]+$/, 'Mã xác nhận chỉ chứa chữ cái in hoa và số'),
  newPassword: yup
    .string()
    .required('Mật khẩu mới là bắt buộc')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    ),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp')
});

// Set password for new account (first time password setup)
// Must match backend regex: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$
export const setPasswordSchema = yup.object({
  password: yup
    .string()
    .required('Mật khẩu là bắt buộc')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
      'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và chỉ chứa các ký tự hợp lệ (a-z, A-Z, 0-9, @$!%*?&)'
    )
});