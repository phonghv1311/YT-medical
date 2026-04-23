-- Part 13: Seed data - Roles, Permissions, Specialties, Subscription Plans
-- Run after 01-12. Safe to run multiple times (INSERT ... ON CONFLICT or skip if exists).

-- Roles
INSERT INTO roles (id, name, display_name, description, is_system, is_default, level) VALUES
(gen_random_uuid(), 'superadmin', 'Super Admin', 'Full system access', TRUE, FALSE, 100),
(gen_random_uuid(), 'admin', 'Admin', 'Hospital admin management', TRUE, FALSE, 80),
(gen_random_uuid(), 'doctor', 'Doctor', 'Medical professional', TRUE, FALSE, 50),
(gen_random_uuid(), 'customer', 'Customer', 'Patient/Customer', TRUE, TRUE, 10)
ON CONFLICT (name) DO NOTHING;

-- Specialties (insert only if table is empty)
INSERT INTO specialties (id, name, name_en, icon)
SELECT gen_random_uuid(), 'Nội khoa', 'Internal Medicine', 'stethoscope' WHERE NOT EXISTS (SELECT 1 FROM specialties LIMIT 1);
INSERT INTO specialties (name, name_en, icon) SELECT 'Ngoại khoa', 'Surgery', 'scissors' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Ngoại khoa');
INSERT INTO specialties (name, name_en, icon) SELECT 'Nhi khoa', 'Pediatrics', 'baby' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Nhi khoa');
INSERT INTO specialties (name, name_en, icon) SELECT 'Sản phụ khoa', 'Obstetrics & Gynecology', 'pregnant' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Sản phụ khoa');
INSERT INTO specialties (name, name_en, icon) SELECT 'Tim mạch', 'Cardiology', 'heart' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Tim mạch');
INSERT INTO specialties (name, name_en, icon) SELECT 'Da liễu', 'Dermatology', 'skin' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Da liễu');
INSERT INTO specialties (name, name_en, icon) SELECT 'Thần kinh', 'Neurology', 'brain' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Thần kinh');
INSERT INTO specialties (name, name_en, icon) SELECT 'Cơ xương khớp', 'Orthopedics', 'bone' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Cơ xương khớp');
INSERT INTO specialties (name, name_en, icon) SELECT 'Mắt', 'Ophthalmology', 'eye' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Mắt');
INSERT INTO specialties (name, name_en, icon) SELECT 'Tai mũi họng', 'ENT', 'ear' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Tai mũi họng');
INSERT INTO specialties (name, name_en, icon) SELECT 'Hô hấp', 'Pulmonology', 'lungs' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Hô hấp');
INSERT INTO specialties (name, name_en, icon) SELECT 'Tiêu hóa', 'Gastroenterology', 'stomach' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Tiêu hóa');
INSERT INTO specialties (name, name_en, icon) SELECT 'Thận', 'Nephrology', 'kidney' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Thận');
INSERT INTO specialties (name, name_en, icon) SELECT 'Nội tiết', 'Endocrinology', 'gland' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Nội tiết');
INSERT INTO specialties (name, name_en, icon) SELECT 'Ung bướu', 'Oncology', 'cancer' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Ung bướu');
INSERT INTO specialties (name, name_en, icon) SELECT 'Tâm thần', 'Psychiatry', 'mind' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Tâm thần');
INSERT INTO specialties (name, name_en, icon) SELECT 'Dị ứng', 'Allergy', 'allergy' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Dị ứng');
INSERT INTO specialties (name, name_en, icon) SELECT 'Truyền nhiễm', 'Infectious Disease', 'virus' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Truyền nhiễm');
INSERT INTO specialties (name, name_en, icon) SELECT 'Cấp cứu', 'Emergency', 'emergency' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Cấp cứu');
INSERT INTO specialties (name, name_en, icon) SELECT 'Chẩn đoán hình ảnh', 'Radiology', 'xray' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Chẩn đoán hình ảnh');

-- Subscription plans
INSERT INTO subscription_plans (id, name, name_en, slug, description, price, duration_months, is_free, is_popular, features) VALUES
(gen_random_uuid(), 'Miễn phí', 'Free', 'free', 'Dành cho người mới', 0, 2, TRUE, FALSE, '["Đặt lịch khám", "Xem lịch sử khám", "Chat với bác sĩ", "1 lần gọi video/tháng"]'),
(gen_random_uuid(), 'Premium', 'Premium', 'premium', 'Trải nghiệm đầy đủ', 199000, 1, FALSE, TRUE, '["Tất cả tính năng Free", "Gọi video không giới hạn", "Đặt lịch ưu tiên", "Xem kết quả xét nghiệm", "Nhắc nhở uống thuốc", "Hỗ trợ 24/7"]'),
(gen_random_uuid(), 'VIP', 'VIP', 'vip', 'Dịch vụ cao cấp', 399000, 1, FALSE, FALSE, '["Tất cả tính năng Premium", "Khám bác sĩ chuyên khoa", "Tư vấn y khoa cá nhân", "Gói bảo hiểm sức khỏe", "Giảm 50% phí dịch vụ", "Quà tặng sức khỏe hàng tháng"]')
ON CONFLICT (slug) DO NOTHING;
