import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import type { Dialect } from 'sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';

import { databaseConfig, redisConfig, jwtConfig, spacesConfig } from './config/index.js';

import { Role } from './database/models/role.model.js';
import { Permission } from './database/models/permission.model.js';
import { RolePermission } from './database/models/role-permission.model.js';
import { User } from './database/models/user.model.js';
import { Customer } from './database/models/customer.model.js';
import { Doctor } from './database/models/doctor.model.js';
import { Staff } from './database/models/staff.model.js';
import { Hospital } from './database/models/hospital.model.js';
import { Department } from './database/models/department.model.js';
import { DoctorDepartment } from './database/models/doctor-department.model.js';
import { DoctorQualification } from './database/models/doctor-qualification.model.js';
import { DoctorCertificate } from './database/models/doctor-certificate.model.js';
import { Specialization } from './database/models/specialization.model.js';
import { DoctorSpecialization } from './database/models/doctor-specialization.model.js';
import { Schedule } from './database/models/schedule.model.js';
import { AvailabilitySlot } from './database/models/availability-slot.model.js';
import { FamilyMember } from './database/models/family-member.model.js';
import { Appointment } from './database/models/appointment.model.js';
import { MedicalRecord } from './database/models/medical-record.model.js';
import { Prescription } from './database/models/prescription.model.js';
import { PatientStatus } from './database/models/patient-status.model.js';
import { PaymentMethod } from './database/models/payment-method.model.js';
import { Package } from './database/models/package.model.js';
import { UserPackage } from './database/models/user-package.model.js';
import { Transaction } from './database/models/transaction.model.js';
import { Tip } from './database/models/tip.model.js';
import { Notification } from './database/models/notification.model.js';
import { Review } from './database/models/review.model.js';
import { Feedback } from './database/models/feedback.model.js';
import { ChatMessage } from './database/models/chat-message.model.js';
import { ActivityLog } from './database/models/activity-log.model.js';
import { NewsArticle } from './database/models/news-article.model.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { HospitalsModule } from './hospitals/hospitals.module.js';
import { DepartmentsModule } from './departments/departments.module.js';
import { DoctorsModule } from './doctors/doctors.module.js';
import { PatientsModule } from './patients/patients.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { MedicalRecordsModule } from './medical-records/medical-records.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { LogsModule } from './logs/logs.module.js';
import { RolesModule } from './roles/roles.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { SearchModule } from './search/search.module.js';
import { FeedbackModule } from './feedback/feedback.module.js';
import { StaffModule } from './staff/staff.module.js';
import { ApprovalsModule } from './approvals/approvals.module.js';
import { NewsModule } from './news/news.module.js';
import { ProductsModule } from './products/products.module.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig, redisConfig, jwtConfig, spacesConfig] }),

    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dialect = (config.get<string>('database.dialect') ?? 'mysql') as Dialect;
        return {
          dialect,
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.username'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.database'),
          models: [
            Role, Permission, RolePermission, User, Customer, Doctor, Staff,
            Hospital, Department, DoctorDepartment, DoctorQualification, DoctorCertificate,
            Specialization, DoctorSpecialization, Schedule, AvailabilitySlot,
            FamilyMember, Appointment, MedicalRecord, Prescription, PatientStatus,
            PaymentMethod, Package, UserPackage, Transaction, Tip,
            Notification, Review, Feedback, ChatMessage, ActivityLog,
            NewsArticle,
          ],
          autoLoadModels: true,
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('NODE_ENV') === 'development' ? console.log : false,
        };
      },
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI', 'mongodb://localhost:27017/telemedicine'),
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
      }),
    }),

    AuthModule,
    HospitalsModule,
    UsersModule,
    DepartmentsModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    PaymentsModule,
    NotificationsModule,
    ReviewsModule,
    LogsModule,
    RolesModule,
    GatewayModule,
    SearchModule,
    FeedbackModule,
    StaffModule,
    ApprovalsModule,
    NewsModule,
    ProductsModule,
    ConversationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
