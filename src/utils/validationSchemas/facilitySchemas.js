import * as yup from 'yup';

// Branch validation schema
export const branchSchema = yup.object({
  branchName: yup
    .string()
    .required('Tên chi nhánh là bắt buộc')
    .min(2, 'Tên chi nhánh phải có ít nhất 2 ký tự')
    .max(100, 'Tên chi nhánh không được quá 100 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ0-9\s\-.,()]+$/, 'Tên chi nhánh chỉ được chứa chữ cái, số, khoảng trắng và ký tự đặc biệt cơ bản'),
  address: yup
    .string()
    .required('Địa chỉ là bắt buộc')
    .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
    .max(200, 'Địa chỉ không được quá 200 ký tự'),
  phone: yup
    .string()
    .required('Số điện thoại là bắt buộc')
    .matches(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ')
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .max(15, 'Số điện thoại không được quá 15 số'),
  districtId: yup
    .string()
    .required('Quận/Huyện là bắt buộc')
});

// Facility validation schema
export const facilitySchema = yup.object({
  facilityName: yup
    .string()
    .required('Tên cơ sở vật chất là bắt buộc')
    .min(2, 'Tên cơ sở vật chất phải có ít nhất 2 ký tự')
    .max(100, 'Tên cơ sở vật chất không được quá 100 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ0-9\s\-.,()]+$/, 'Tên cơ sở vật chất chỉ được chứa chữ cái, số, khoảng trắng và ký tự đặc biệt cơ bản'),
  description: yup
    .string()
    .required('Mô tả là bắt buộc')
    .min(10, 'Mô tả phải có ít nhất 10 ký tự')
    .max(500, 'Mô tả không được quá 500 ký tự')
});

// Room validation schema
export const roomSchema = yup.object({
  roomName: yup
    .string()
    .required('Tên phòng là bắt buộc')
    .min(2, 'Tên phòng phải có ít nhất 2 ký tự')
    .max(100, 'Tên phòng không được quá 100 ký tự'),
  facilityId: yup
    .string()
    .required('Cơ sở vật chất là bắt buộc'),
  branchId: yup
    .string()
    .required('Chi nhánh là bắt buộc'),
  capacity: yup
    .number()
    .required('Sức chứa là bắt buộc')
    .min(1, 'Sức chứa phải lớn hơn 0')
    .max(1000, 'Sức chứa không được quá 1000')
    .integer('Sức chứa phải là số nguyên'),
  status: yup
    .string()
    .required('Trạng thái là bắt buộc')
    .oneOf(['Active', 'Inactive', 'UnderMaintenance', 'Closed'], 'Trạng thái không hợp lệ')
});
