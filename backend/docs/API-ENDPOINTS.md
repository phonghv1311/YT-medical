# API Endpoints - Medical App

Base URL: `http://localhost:3000/api/v1` (hoặc theo cấu hình `API_URL`).

Tổng quan: **212 endpoints** (Auth, Users, Roles, Superadmin, Admin, Doctor, Customer, Common, Hospitals, Search, Reports).

---

## 1. Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Đăng ký tài khoản mới |
| POST | `/auth/login` | Đăng nhập bằng email/password |
| POST | `/auth/login/otp` | Đăng nhập bằng OTP |
| POST | `/auth/forgot-password` | Gửi OTP quên mật khẩu |
| POST | `/auth/verify-otp` | Xác minh OTP |
| POST | `/auth/reset-password` | Đặt lại mật khẩu |
| POST | `/auth/refresh-token` | Làm mới access token |
| POST | `/auth/logout` | Đăng xuất |
| GET | `/auth/me` | Lấy thông tin user hiện tại |
| POST | `/auth/resend-otp` | Gửi lại OTP |
| GET | `/auth/sessions` | Danh sách phiên đăng nhập |
| DELETE | `/auth/sessions/:id` | Xóa phiên đăng nhập |
| DELETE | `/auth/sessions/all` | Xóa tất cả phiên (đăng xuất mọi nơi) |

---

## 2. User & Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Danh sách users (phân trang, lọc) |
| GET | `/users/:id` | Chi tiết user |
| POST | `/users` | Tạo user mới |
| PUT | `/users/:id` | Cập nhật user |
| DELETE | `/users/:id` | Xóa user |
| PUT | `/users/:id/status` | Kích hoạt/vô hiệu user |
| GET | `/users/:id/profile` | Lấy profile user |
| PUT | `/users/:id/profile` | Cập nhật profile |
| POST | `/users/:id/avatar` | Upload avatar |
| PUT | `/users/:id/change-password` | Đổi mật khẩu |
| GET | `/users/search` | Tìm kiếm users |
| POST | `/users/:id/assign-role` | Gán role cho user |

---

## 3. Roles & Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles` | Danh sách roles |
| GET | `/roles/:id` | Chi tiết role |
| POST | `/roles` | Tạo role mới |
| PUT | `/roles/:id` | Cập nhật role |
| DELETE | `/roles/:id` | Xóa role |
| GET | `/roles/:id/permissions` | Lấy permissions của role |
| PUT | `/roles/:id/permissions` | Cập nhật permissions |
| GET | `/permissions` | Danh sách tất cả permissions |
| GET | `/my/permissions` | Permissions của user hiện tại |

---

## 4. Superadmin

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/dashboard/stats` | Thống kê tổng quan |
| GET | `/superadmin/dashboard/users-chart` | Biểu đồ users theo tháng |
| GET | `/superadmin/dashboard/revenue-chart` | Biểu đồ doanh thu |
| GET | `/superadmin/dashboard/activities` | Hoạt động gần đây |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/users` | Danh sách tất cả users |
| POST | `/superadmin/users` | Tạo user mới |
| GET | `/superadmin/users/:id` | Chi tiết user |
| PUT | `/superadmin/users/:id` | Cập nhật user |
| DELETE | `/superadmin/users/:id` | Xóa user |
| PUT | `/superadmin/users/:id/role` | Gán role |
| PUT | `/superadmin/users/:id/status` | Thay đổi trạng thái |

### Role Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/roles` | Danh sách roles |
| POST | `/superadmin/roles` | Tạo role |
| PUT | `/superadmin/roles/:id` | Cập nhật role |
| DELETE | `/superadmin/roles/:id` | Xóa role |
| PUT | `/superadmin/roles/:id/permissions` | Phân quyền |

### Account Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/accounts` | Danh sách tài khoản |
| POST | `/superadmin/accounts/reset-password` | Reset password |
| PUT | `/superadmin/accounts/:id/toggle` | Kích hoạt/vô hiệu |
| GET | `/superadmin/accounts/:id/sessions` | Phiên đăng nhập |

### Hospital Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/hospitals` | Danh sách bệnh viện |
| POST | `/superadmin/hospitals` | Tạo bệnh viện |
| GET | `/superadmin/hospitals/:id` | Chi tiết bệnh viện |
| PUT | `/superadmin/hospitals/:id` | Cập nhật bệnh viện |
| DELETE | `/superadmin/hospitals/:id` | Xóa bệnh viện |
| PUT | `/superadmin/hospitals/:id/admin` | Gán admin |
| PUT | `/superadmin/hospitals/:id/status` | Thay đổi trạng thái |

---

## 5. Admin

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard/stats` | Thống kê admin |
| GET | `/admin/dashboard/appointments-chart` | Biểu đồ lịch hẹn |
| GET | `/admin/dashboard/activities` | Hoạt động gần đây |

### Doctor Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/doctors` | Danh sách bác sĩ |
| POST | `/admin/doctors` | Tạo tài khoản bác sĩ |
| GET | `/admin/doctors/:id` | Chi tiết bác sĩ |
| PUT | `/admin/doctors/:id` | Cập nhật bác sĩ |
| DELETE | `/admin/doctors/:id` | Xóa bác sĩ |
| PUT | `/admin/doctors/:id/approve` | Duyệt bác sĩ |
| PUT | `/admin/doctors/:id/reject` | Từ chối bác sĩ |
| GET | `/admin/doctors/pending` | Danh sách chờ duyệt |

### News Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/news` | Danh sách tin tức |
| POST | `/admin/news` | Tạo tin tức |
| GET | `/admin/news/:id` | Chi tiết tin tức |
| PUT | `/admin/news/:id` | Cập nhật tin tức |
| DELETE | `/admin/news/:id` | Xóa tin tức |
| PUT | `/admin/news/:id/publish` | Xuất bản tin tức |
| PUT | `/admin/news/:id/draft` | Lưu nháp tin tức |
| POST | `/admin/news/:id/image` | Upload ảnh tin tức |

### Department Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/departments` | Danh sách khoa |
| POST | `/admin/departments` | Tạo khoa |
| GET | `/admin/departments/:id` | Chi tiết khoa |
| PUT | `/admin/departments/:id` | Cập nhật khoa |
| DELETE | `/admin/departments/:id` | Xóa khoa |

### Position Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/positions` | Danh sách chức vụ |
| POST | `/admin/positions` | Tạo chức vụ |
| GET | `/admin/positions/:id` | Chi tiết chức vụ |
| PUT | `/admin/positions/:id` | Cập nhật chức vụ |
| DELETE | `/admin/positions/:id` | Xóa chức vụ |

### Work Schedule Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/schedules` | Danh sách lịch làm việc |
| POST | `/admin/schedules` | Tạo lịch làm việc |
| GET | `/admin/schedules/:id` | Chi tiết lịch |
| PUT | `/admin/schedules/:id` | Cập nhật lịch |
| DELETE | `/admin/schedules/:id` | Xóa lịch |
| GET | `/admin/schedules/calendar` | Calendar view |
| POST | `/admin/schedules/bulk` | Tạo nhiều lịch |

---

## 6. Doctor

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/dashboard` | Dashboard bác sĩ |
| GET | `/doctor/dashboard/today-schedule` | Lịch hẹn hôm nay |
| GET | `/doctor/dashboard/waiting-patients` | Bệnh nhân chờ khám |
| GET | `/doctor/dashboard/recent-patients` | Bệnh nhân gần đây |

### Patient Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/patients` | Danh sách bệnh nhân |
| GET | `/doctor/patients/:id` | Chi tiết bệnh nhân |
| POST | `/doctor/patients` | Thêm bệnh nhân mới |
| PUT | `/doctor/patients/:id` | Cập nhật bệnh nhân |
| GET | `/doctor/patients/:id/records` | Bệnh án bệnh nhân |
| GET | `/doctor/patients/:id/prescriptions` | Đơn thuốc bệnh nhân |
| GET | `/doctor/patients/:id/appointments` | Lịch sử khám |

### Medical Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/records` | Danh sách bệnh án |
| GET | `/doctor/records/:id` | Chi tiết bệnh án |
| POST | `/doctor/records` | Tạo bệnh án mới |
| PUT | `/doctor/records/:id` | Cập nhật bệnh án |
| DELETE | `/doctor/records/:id` | Xóa bệnh án |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/appointments` | Danh sách lịch hẹn |
| GET | `/doctor/appointments/:id` | Chi tiết lịch hẹn |
| POST | `/doctor/appointments` | Tạo lịch hẹn |
| PUT | `/doctor/appointments/:id/confirm` | Xác nhận lịch |
| PUT | `/doctor/appointments/:id/start` | Bắt đầu khám |
| PUT | `/doctor/appointments/:id/complete` | Hoàn thành lịch |
| PUT | `/doctor/appointments/:id/cancel` | Hủy lịch |
| POST | `/doctor/appointments/:id/reschedule` | Đổi lịch |
| GET | `/doctor/appointments/pending` | Lịch chờ xác nhận |
| GET | `/doctor/appointments/today` | Lịch hôm nay |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/prescriptions` | Danh sách đơn thuốc |
| GET | `/doctor/prescriptions/:id` | Chi tiết đơn thuốc |
| POST | `/doctor/prescriptions` | Kê đơn thuốc |
| PUT | `/doctor/prescriptions/:id` | Cập nhật đơn thuốc |
| DELETE | `/doctor/prescriptions/:id` | Xóa đơn thuốc |
| POST | `/doctor/prescriptions/:id/print` | In đơn thuốc |

### My Schedule
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/my-schedule` | Lịch làm việc cá nhân |
| GET | `/doctor/my-schedule/today` | Lịch hôm nay |
| GET | `/doctor/my-schedule/week` | Lịch tuần này |
| POST | `/doctor/my-schedule/request` | Yêu cầu đổi lịch |
| GET | `/doctor/my-schedule/requests` | Danh sách yêu cầu |
| PUT | `/doctor/my-schedule/requests/:id/cancel` | Hủy yêu cầu |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/conversations` | Danh sách hội thoại |
| GET | `/doctor/conversations/:id` | Chi tiết hội thoại |
| GET | `/doctor/conversations/:id/messages` | Tin nhắn trong hội thoại |
| POST | `/doctor/messages` | Gửi tin nhắn |
| PUT | `/doctor/messages/:id/read` | Đánh dấu đã đọc |
| GET | `/doctor/conversations/unread` | Hội thoại có tin chưa đọc |

### Video Call
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/doctor/video-call/start` | Bắt đầu gọi video |
| POST | `/doctor/video-call/:id/end` | Kết thúc gọi video |
| GET | `/doctor/video-call/history` | Lịch sử gọi video |
| GET | `/doctor/video-call/pending` | Cuộc gọi chờ |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/payments` | Lịch sử thanh toán |
| GET | `/doctor/payments/:id` | Chi tiết thanh toán |
| GET | `/doctor/payments/summary` | Tổng quan doanh thu |

---

## 7. Customer (Patient)

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/dashboard` | Dashboard bệnh nhân |
| GET | `/customer/dashboard/upcoming` | Lịch hẹn sắp tới |
| GET | `/customer/dashboard/recent` | Lịch sử gần đây |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/profile` | Lấy hồ sơ |
| PUT | `/customer/profile` | Cập nhật hồ sơ |
| POST | `/customer/profile/avatar` | Upload avatar |
| PUT | `/customer/profile/medical` | Cập nhật thông tin y tế |

### Account
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/account` | Thông tin tài khoản |
| PUT | `/customer/account/email` | Đổi email |
| PUT | `/customer/account/phone` | Đổi số điện thoại |
| PUT | `/customer/account/password` | Đổi mật khẩu |
| DELETE | `/customer/account` | Xóa tài khoản |

### Find Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/doctors` | Tìm bác sĩ |
| GET | `/customer/doctors/:id` | Chi tiết bác sĩ |
| GET | `/customer/doctors/:id/schedule` | Lịch làm việc bác sĩ |
| GET | `/customer/doctors/:id/slots` | Khung giờ trống |
| GET | `/customer/doctors/:id/reviews` | Đánh giá bác sĩ |
| GET | `/customer/doctors/featured` | Bác sĩ nổi bật |
| GET | `/customer/doctors/by-specialty/:id` | Bác sĩ theo chuyên khoa |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/appointments` | Danh sách lịch hẹn |
| GET | `/customer/appointments/:id` | Chi tiết lịch hẹn |
| POST | `/customer/appointments` | Đặt lịch hẹn |
| PUT | `/customer/appointments/:id/cancel` | Hủy lịch hẹn |
| POST | `/customer/appointments/:id/reschedule` | Đổi lịch hẹn |
| GET | `/customer/appointments/upcoming` | Lịch hẹn sắp tới |
| GET | `/customer/appointments/history` | Lịch sử lịch hẹn |
| GET | `/customer/appointments/:id/qr` | Lấy QR code check-in |

### Video Call
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/customer/video-call/request` | Yêu cầu gọi video |
| GET | `/customer/video-call/history` | Lịch sử gọi video |
| POST | `/customer/video-call/:id/join` | Tham gia gọi video |

### Medical Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/records` | Danh sách bệnh án |
| GET | `/customer/records/:id` | Chi tiết bệnh án |
| GET | `/customer/records/:id/pdf` | Tải PDF bệnh án |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/prescriptions` | Danh sách đơn thuốc |
| GET | `/customer/prescriptions/:id` | Chi tiết đơn thuốc |
| GET | `/customer/prescriptions/:id/pdf` | Tải PDF đơn thuốc |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/conversations` | Danh sách hội thoại |
| GET | `/customer/conversations/:id` | Chi tiết hội thoại |
| GET | `/customer/conversations/:id/messages` | Tin nhắn |
| POST | `/customer/messages` | Gửi tin nhắn |
| PUT | `/customer/messages/:id/read` | Đánh dấu đã đọc |
| GET | `/customer/conversations/unread` | Tin chưa đọc |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/subscriptions/plans` | Danh sách gói |
| GET | `/customer/subscriptions/current` | Gói hiện tại |
| POST | `/customer/subscriptions/select` | Chọn gói |
| POST | `/customer/subscriptions/cancel` | Hủy gói |
| POST | `/customer/subscriptions/renew` | Gia hạn |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/payment-methods` | Danh sách thẻ |
| POST | `/customer/payment-methods` | Thêm thẻ |
| DELETE | `/customer/payment-methods/:id` | Xóa thẻ |
| PUT | `/customer/payment-methods/:id/default` | Đặt mặc định |
| GET | `/customer/payments` | Lịch sử thanh toán |
| GET | `/customer/payments/:id` | Chi tiết thanh toán |
| POST | `/customer/payments/process` | Thanh toán |
| POST | `/customer/payments/skip` | Thanh toán sau |
| POST | `/customer/payments/:id/refund` | Yêu cầu hoàn tiền |

---

## 8. Common (All Roles)

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Danh sách thông báo |
| GET | `/notifications/:id` | Chi tiết thông báo |
| PUT | `/notifications/:id/read` | Đánh dấu đã đọc |
| PUT | `/notifications/read-all` | Đánh dấu tất cả đã đọc |
| DELETE | `/notifications/:id` | Xóa thông báo |
| DELETE | `/notifications/clear` | Xóa tất cả |
| GET | `/notifications/unread-count` | Số thông báo chưa đọc |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings/profile` | Lấy profile |
| PUT | `/settings/profile` | Cập nhật profile |
| PUT | `/settings/password` | Đổi mật khẩu |
| PUT | `/settings/notifications` | Cập nhật thông báo |
| PUT | `/settings/language` | Cập nhật ngôn ngữ |
| GET | `/settings/notification-preferences` | Tùy chọn thông báo |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/image` | Upload ảnh |
| POST | `/upload/file` | Upload file |
| DELETE | `/upload/:id` | Xóa file |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/system/config` | Lấy cấu hình hệ thống |
| GET | `/system/time` | Thời gian server |
| GET | `/health` | Health check |

---

## 9. Hospital & Department

### Hospitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hospitals` | Danh sách bệnh viện |
| GET | `/hospitals/:id` | Chi tiết bệnh viện |
| GET | `/hospitals/:id/doctors` | Danh sách bác sĩ |
| GET | `/hospitals/:id/departments` | Danh sách khoa |
| GET | `/hospitals/nearby` | Bệnh viện gần đây |
| GET | `/hospitals/search` | Tìm kiếm bệnh viện |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | Danh sách khoa |
| GET | `/departments/:id` | Chi tiết khoa |
| GET | `/departments/:id/doctors` | Bác sĩ trong khoa |

### Specialties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/specialties` | Danh sách chuyên khoa |
| GET | `/specialties/:id` | Chi tiết chuyên khoa |
| GET | `/specialties/:id/doctors` | Bác sĩ theo chuyên khoa |

---

## 10. Search & Filter

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search/global` | Tìm kiếm toàn cục |
| GET | `/search/doctors` | Tìm bác sĩ |
| GET | `/search/hospitals` | Tìm bệnh viện |
| GET | `/search/departments` | Tìm khoa |

---

## 11. Report & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/appointments` | Báo cáo lịch hẹn |
| GET | `/reports/revenue` | Báo cáo doanh thu |
| GET | `/reports/users` | Báo cáo users |
| GET | `/reports/doctors` | Báo cáo bác sĩ |
| GET | `/reports/patients` | Báo cáo bệnh nhân |

---

## Tổng kết

| Module | Số API |
|--------|--------|
| Authentication | 13 |
| User & Profile | 12 |
| Roles & Permissions | 9 |
| Superadmin | 24 |
| Admin | 27 |
| Doctor | 40 |
| Customer | 48 |
| Common | 18 |
| Hospital & Department | 12 |
| Search | 4 |
| Reports | 5 |
| **Tổng** | **212** |

---

*Postman collection: import file `API-Medical-App.postman_collection.json` trong cùng thư mục.*
