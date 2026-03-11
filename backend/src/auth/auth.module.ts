import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Customer } from '../database/models/customer.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { Package } from '../database/models/package.model.js';
import { UserPackage } from '../database/models/user-package.model.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    SequelizeModule.forFeature([User, Role, Customer, Doctor, Package, UserPackage]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule { }
