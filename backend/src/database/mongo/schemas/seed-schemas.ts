/** Seed-only schema exports for mongo migrate and seed scripts (avoids loading app log schemas in ts-node). */
export { SeedUser, SeedUserSchema } from './seed-user.schema';
export { SeedDoctor, SeedDoctorSchema } from './seed-doctor.schema';
export { SeedAppointment, SeedAppointmentSchema } from './seed-appointment.schema';
export { SeedNotification, SeedNotificationSchema } from './seed-notification.schema';
export { SeedPackage, SeedPackageSchema } from './seed-package.schema';
