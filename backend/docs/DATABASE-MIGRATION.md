# Database Migration - Từ MySQL sang PostgreSQL (schema mới)

## Tổng quan

- **Schema cũ:** MySQL, Sequelize models trong `src/database/models/` (users, customers, doctors, appointments, medical_records, ...) với ID integer.
- **Schema mới:** Thiết kế chuẩn system design, PostgreSQL, UUID, bảng `users`, `user_profiles`, `patients`, `doctors`, `appointments`, `medical_records`, `prescriptions`, `conversations`, `messages`, v.v. (xem `database/schema/`).

## Bước 1: Chạy schema PostgreSQL

1. Khởi động Postgres (Docker):

```bash
docker compose up -d postgres
```

2. Tạo database (nếu chưa có):

```bash
docker exec -it yt-medical-postgres-1 psql -U postgres -c "CREATE DATABASE telemedicine;"
# hoặc tên container có thể khác, kiểm tra bằng: docker compose ps
```

3. Chạy các file SQL theo thứ tự (từ thư mục repo):

```bash
cd backend/database/schema
for f in 01-users-auth.sql 02-roles-permissions.sql 03-hospitals-departments.sql 04-doctors.sql 05-patients.sql 06-appointments-timeslots.sql 07-medical-records-prescriptions.sql 08-work-schedules.sql 09-conversations-messages.sql 10-news.sql 11-subscriptions-payments.sql 12-notifications-audit.sql 13-seed-data.sql; do
  psql "postgresql://postgres:secret@localhost:5432/telemedicine" -f "$f" || exit 1
done
```

Hoặc dùng GUI (pgAdmin, DBeaver) kết nối tới `localhost:5432`, database `telemedicine`, rồi chạy lần lượt từng file.

## Bước 2: Cấu hình backend dùng PostgreSQL (tùy chọn)

Trong `.env` backend:

```env
DB_DRIVER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_DATABASE=telemedicine
```

**Lưu ý:** Hiện tại NestJS vẫn đang dùng **các Sequelize models cũ** (User, Customer, Doctor, Appointment, ...) với bảng MySQL (integer ID). Chỉ khi **đổi sang bộ models mới** tương ứng schema PostgreSQL (users UUID, user_profiles, patients, doctors mới, appointments mới, ...) thì backend mới thực sự dùng schema mới.

## Bước 3: Hướng migration backend (khi muốn chuyển hẳn)

1. **Tạo Sequelize models mới** trong `src/database/models/` (hoặc thư mục `models-v2/`) map đúng bảng PostgreSQL:
   - User → bảng `users` (UUID, password_hash, role, status, ...)
   - UserProfile → `user_profiles`
   - Patient → `patients`
   - Doctor → `doctors` (FK user_id, hospital_id, specialty_id, ...)
   - Appointment → `appointments`
   - MedicalRecord → `medical_records`
   - Prescription → `prescriptions`
   - v.v.

2. **Đổi Auth:** Đăng nhập/đăng ký đọc/ghi `users` + `user_profiles`, JWT payload dùng `user.id` (UUID).

3. **Đổi từng module:** Patients, Doctors, Appointments, MedicalRecords, Notifications, … dùng model mới và quan hệ mới (patient_id, doctor_id là UUID).

4. **Seed dữ liệu:** Viết script chuyển dữ liệu từ MySQL sang PostgreSQL (map old id → new UUID) nếu cần giữ dữ liệu cũ.

## Tạm thời chạy song song

- Giữ backend trỏ MySQL (schema cũ) cho đến khi sẵn sàng chuyển.
- PostgreSQL dùng cho: chạy schema mới, kiểm thử, hoặc script ETL/migration. Khi đã chuyển xong logic sang models mới, tắt MySQL và chỉ dùng PostgreSQL.
