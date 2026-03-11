/**
 * Template file: generates dummy data arrays (100 items per table where applicable).
 * Used by seed-full.ts to populate the database.
 */

const COUNT = 100;

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Hall', 'Allen', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner', 'Torres'];
const hospitalNames = () => Array.from({ length: COUNT }, (_, i) => `Hospital ${i + 1}`);
const departmentNames = () => Array.from({ length: COUNT }, (_, i) => `Department ${i + 1}`);
const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Park Blvd', 'Health Way', 'Medical Center Dr', 'Care Cir'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().slice(0, 10);
}

export function getRoleNames() {
  return ['superadmin', 'admin', 'doctor', 'staff', 'customer'];
}

export function getPermissionNames() {
  return [
    'manage_users', 'view_users', 'manage_hospitals', 'view_hospitals',
    'manage_departments', 'view_departments', 'manage_packages', 'view_packages',
    'view_reports', 'manage_roles', 'view_logs',
    'manage_appointments', 'view_appointments', 'view_patients',
    'manage_schedule', 'prescribe_medication', 'view_medical_records', 'manage_availability',
    'view_own_appointments', 'view_own_records', 'book_appointments', 'view_doctors', 'manage_family',
    'manage_news',
  ];
}

export function getSpecializationNames() {
  return ['General Practice', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Psychiatry', 'Orthopedics', 'Ophthalmology', 'Gynecology', 'Urology', 'Endocrinology', 'Oncology'];
}

export function generateUsers(roleIds: number[]) {
  return Array.from({ length: COUNT }, (_, i) => ({
    email: `user${i + 1}@telemedicine.com`,
    password: '$2b$10$rQZ8K9Y5Y5Y5Y5Y5Y5Y5YuO8K9Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', // bcrypt hash of 'password123'
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    phone: `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
    roleId: roleIds[i % roleIds.length],
    isActive: true,
  }));
}

export function generateHospitals() {
  const names = hospitalNames();
  return names.map((name, i) => ({
    name,
    address: `${randomInt(1, 9999)} ${pick(streets)}, ${pick(cities)}`,
    phone: `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
    email: `contact${i + 1}@hospital${i + 1}.com`,
    description: `Description for ${name}`,
    isActive: true,
  }));
}

export function generateDepartments(hospitalIds: number[]) {
  const names = departmentNames();
  return names.map((name, i) => ({
    name,
    hospitalId: hospitalIds[i % hospitalIds.length],
    description: `Department ${name}`,
    isActive: true,
  }));
}

export function generatePackages() {
  const plans = ['Basic', 'Standard', 'Premium', 'Family', 'Annual', 'Monthly', 'Trial', 'Pro', 'Care', 'Health'];
  return Array.from({ length: COUNT }, (_, i) => ({
    name: `${plans[i % plans.length]} Plan ${Math.floor(i / plans.length) + 1}`,
    description: `Package description ${i + 1}`,
    price: [0, 9.99, 19.99, 29.99, 49.99, 99.99, 199.99][i % 7],
    durationDays: [30, 60, 90, 180, 365][i % 5],
    maxConsultations: i % 3 === 0 ? null : randomInt(5, 50),
    isActive: true,
  }));
}

export function generateAppointments(patientIds: number[], doctorIds: number[], slotIds: number[]) {
  const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  const types = ['video', 'in_person'];
  const start = new Date(2024, 0, 1);
  const end = new Date(2025, 11, 31);
  return Array.from({ length: COUNT }, (_, i) => ({
    patientId: patientIds[i % patientIds.length],
    doctorId: doctorIds[i % doctorIds.length],
    slotId: slotIds[i % slotIds.length] ?? null,
    status: statuses[i % statuses.length],
    scheduledAt: randomDate(start, end),
    startTime: `${10 + (i % 8)}:00`,
    endTime: `${11 + (i % 8)}:00`,
    type: types[i % 2],
    notes: i % 4 === 0 ? `Notes for appointment ${i + 1}` : null,
    cancelReason: null,
  }));
}

export function generateNotifications(userIds: number[]) {
  const types = ['appointment', 'payment', 'system', 'chat'];
  const titles = ['Appointment Reminder', 'Payment Received', 'System Update', 'New Message', 'Booking Confirmed'];
  return Array.from({ length: COUNT }, (_, i) => ({
    userId: userIds[i % userIds.length],
    type: types[i % types.length],
    title: titles[i % titles.length],
    body: `Notification body ${i + 1}`,
    readAt: i % 3 === 0 ? new Date() : null,
  }));
}

export function generateMedicalRecords(patientIds: number[], doctorIds: number[]) {
  const start = new Date(2023, 0, 1);
  const end = new Date();
  return Array.from({ length: COUNT }, (_, i) => ({
    patientId: patientIds[i % patientIds.length],
    doctorId: doctorIds[i % doctorIds.length],
    title: `Record ${i + 1}`,
    description: `Description ${i + 1}`,
    recordDate: randomDate(start, end),
  }));
}

export function generateFamilyMembers(customerIds: number[]) {
  const relationships = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];
  return Array.from({ length: COUNT }, (_, i) => ({
    customerId: customerIds[i % customerIds.length],
    firstName: firstNames[(i + 10) % firstNames.length],
    lastName: lastNames[(i + 10) % lastNames.length],
    relationship: relationships[i % relationships.length],
    dateOfBirth: randomDate(new Date(1950, 0, 1), new Date(2020, 0, 1)),
    gender: ['male', 'female'][i % 2],
    bloodType: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][i % 8],
    statusNotes: i % 5 === 0 ? 'Vaccination due' : i % 7 === 0 ? 'Chronic: Hypertension' : null,
  }));
}

export function generatePaymentMethods(userIds: number[]) {
  const types = ['credit_card', 'paypal', 'vnpay'];
  return Array.from({ length: COUNT }, (_, i) => ({
    userId: userIds[i % userIds.length],
    type: types[i % types.length],
    provider: ['stripe', 'paypal', 'vnpay'][i % 3],
    last4: `${randomInt(1000, 9999)}`,
    isDefault: i % 5 === 0,
  }));
}

export function generateTransactions(userIds: number[], appointmentIds: number[], packageIds: number[]) {
  const types = ['consultation', 'package', 'tip', 'refund'];
  const statuses = ['pending', 'completed', 'failed', 'refunded'];
  return Array.from({ length: COUNT }, (_, i) => ({
    userId: userIds[i % userIds.length],
    appointmentId: i % 2 === 0 ? appointmentIds[i % appointmentIds.length] : null,
    packageId: i % 2 === 1 ? packageIds[i % packageIds.length] : null,
    amount: randomInt(10, 500) + 0.99,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    paymentMethodId: null,
    providerTransactionId: `txn_${i + 1}`,
  }));
}

export function generateReviews(appointmentIds: number[], patientIds: number[], doctorIds: number[]) {
  return Array.from({ length: Math.min(COUNT, appointmentIds.length) }, (_, i) => ({
    appointmentId: appointmentIds[i],
    patientId: patientIds[i % patientIds.length],
    doctorId: doctorIds[i % doctorIds.length],
    rating: randomInt(1, 5),
    comment: i % 3 === 0 ? `Review comment ${i + 1}` : null,
  }));
}

export function generateFeedback(userIds: number[]) {
  const statuses = ['open', 'resolved', 'closed'];
  return Array.from({ length: COUNT }, (_, i) => ({
    userId: userIds[i % userIds.length],
    subject: `Feedback subject ${i + 1}`,
    body: `Feedback body ${i + 1}`,
    status: statuses[i % statuses.length],
  }));
}

export function generateActivityLogs(userIds: number[]) {
  const actions = ['login', 'create', 'update', 'delete', 'view'];
  const resources = ['appointment', 'user', 'record', 'profile', 'payment'];
  return Array.from({ length: COUNT }, (_, i) => ({
    userId: userIds[i % userIds.length],
    action: actions[i % actions.length],
    resource: resources[i % resources.length],
    resourceId: randomInt(1, 100),
    details: `Details ${i + 1}`,
    ipAddress: `192.168.1.${(i % 255) + 1}`,
  }));
}

export function generateChatMessages(appointmentIds: number[], senderIds: number[]) {
  return Array.from({ length: COUNT }, (_, i) => ({
    appointmentId: appointmentIds[i % appointmentIds.length],
    senderId: senderIds[i % senderIds.length],
    message: `Message content ${i + 1}`,
  }));
}

export function generatePatientStatus(patientIds: number[], doctorIds: number[]) {
  return Array.from({ length: COUNT }, (_, i) => ({
    patientId: patientIds[i % patientIds.length],
    doctorId: doctorIds[i % doctorIds.length],
    status: ['Stable', 'Monitoring', 'Follow-up', 'Recovered'][i % 4],
    notes: `Status notes ${i + 1}`,
  }));
}

export { COUNT };
