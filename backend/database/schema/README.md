# Database Schema - Medical App (PostgreSQL)

Thiết kế database chuẩn system design cho Medical App. Chạy trên **PostgreSQL**.

## Thứ tự chạy migration

Chạy lần lượt theo thứ tự số:

```bash
# Kết nối vào PostgreSQL (ví dụ: database tên telemedicine)
export PGHOST=localhost PGPORT=5432 PGUSER=postgres PGPASSWORD=secret PGDATABASE=telemedicine

# Chạy từng file theo thứ tự
psql -f 01-users-auth.sql
psql -f 02-roles-permissions.sql
psql -f 03-hospitals-departments.sql
psql -f 04-doctors.sql
psql -f 05-patients.sql
psql -f 06-appointments-timeslots.sql
psql -f 07-medical-records-prescriptions.sql
psql -f 08-work-schedules.sql
psql -f 09-conversations-messages.sql
psql -f 10-news.sql
psql -f 11-subscriptions-payments.sql
psql -f 12-notifications-audit.sql
psql -f 13-seed-data.sql
```

Hoặc chạy một lệnh:

```bash
for f in 01-users-auth.sql 02-roles-permissions.sql 03-hospitals-departments.sql 04-doctors.sql 05-patients.sql 06-appointments-timeslots.sql 07-medical-records-prescriptions.sql 08-work-schedules.sql 09-conversations-messages.sql 10-news.sql 11-subscriptions-payments.sql 12-notifications-audit.sql 13-seed-data.sql; do
  psql -f "$f" || exit 1
done
```

## Tạo database

```sql
CREATE DATABASE telemedicine
  WITH ENCODING 'UTF8'
       LC_COLLATE = 'en_US.UTF-8'
       LC_CTYPE = 'en_US.UTF-8';
```

## Cấu trúc chính

| Nhóm | Bảng |
|------|------|
| Users & Auth | users, user_profiles, sessions, password_resets |
| Roles | roles, permissions, role_permissions, user_roles |
| Hospitals | hospitals, departments, positions, specialties |
| Doctors | doctors |
| Patients | patients |
| Appointments | appointments, time_slots |
| Medical | medical_records, prescriptions |
| Schedules | work_schedules, schedule_requests |
| Chat | conversations, conversation_participants, messages, message_reads, video_calls |
| News | news, news_comments |
| Payments | subscription_plans, user_subscriptions, payment_methods, payments, invoices |
| Notifications | notifications, notification_settings, notification_schedules |
| Audit | audit_logs, api_logs, login_history |

## Lưu ý

- Tất cả primary key dùng **UUID** (`gen_random_uuid()`).
- **appointments** phải được tạo trước **medical_records** (FK appointment_id).
- Backend hiện tại dùng MySQL + Sequelize; khi chuyển sang PostgreSQL cần cập nhật config và có thể cần thêm Sequelize models tương ứng bảng mới (users, user_profiles, patients, ...).
