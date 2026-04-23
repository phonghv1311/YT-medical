import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Customer } from '../database/models/customer.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { Package } from '../database/models/package.model.js';
import { UserPackage } from '../database/models/user-package.model.js';
import { RegisterDto, LoginDto } from './dto/index.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    @InjectModel(Package) private readonly packageModel: typeof Package,
    @InjectModel(UserPackage) private readonly userPackageModel: typeof UserPackage,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const roleName = dto.role || 'customer';
    const role = await this.roleModel.findOne({ where: { name: roleName } });
    if (!role) throw new ConflictException('Invalid role');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      roleId: role.id,
    } as Partial<User>);

    if (roleName === 'customer') {
      await this.customerModel.create({ userId: user.id } as Partial<Customer>);
      if (dto.packageId) {
        const pkg = await this.packageModel.findByPk(dto.packageId);
        if (pkg && pkg.isActive) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + Number(pkg.durationDays));
          await this.userPackageModel.create({
            userId: user.id,
            packageId: pkg.id,
            startDate: startDate.toISOString().slice(0, 10),
            endDate: endDate.toISOString().slice(0, 10),
          } as Partial<UserPackage>);
        }
      }
    } else if (roleName === 'doctor') {
      await this.doctorModel.create({ userId: user.id } as Partial<Doctor>);
    }

    const tokens = await this.generateTokens(user.id, user.email, roleName);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitizeUser(user, roleName), ...tokens };
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.userModel.findOne({
        where: { email: dto.email },
        include: [{ model: Role }],
      });
      if (!user) throw new UnauthorizedException('Invalid credentials');

      if (!user.password) {
        console.error('[AuthService.login] User has no password set:', user.email);
        throw new UnauthorizedException('Invalid credentials');
      }
      const valid = await bcrypt.compare(dto.password, user.password);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
      if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

      const roleName = (user as any).role?.name ?? (user as any).Role?.name ?? 'customer';
      const tokens = await this.generateTokens(user.id, user.email, roleName);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return { user: this.sanitizeUser(user, roleName), ...tokens };
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('[AuthService.login]', err?.message ?? err);
      throw new InternalServerErrorException(
        process.env.NODE_ENV === 'production' ? 'Login failed' : err?.message ?? 'Login failed',
      );
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
      const user = await this.userModel.findByPk(payload.sub, { include: [{ model: Role }] });
      if (!user || !user.refreshToken) throw new UnauthorizedException();

      const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!tokenMatch) throw new UnauthorizedException();

      const roleName = user.role?.name || 'customer';
      const tokens = await this.generateTokens(user.id, user.email, roleName);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    await this.userModel.update({ refreshToken: null }, { where: { id: userId } });
  }

  private async generateTokens(userId: number, email: string, role: string) {
    const accessSecret = this.configService.get<string>('jwt.accessSecret') || 'access-secret';
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'refresh-secret';
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn', '2h');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '2h');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: accessSecret, expiresIn: accessExpiresIn as unknown as number },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: refreshSecret, expiresIn: refreshExpiresIn as unknown as number },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    try {
      const hashed = await bcrypt.hash(refreshToken, 10);
      await this.userModel.update({ refreshToken: hashed }, { where: { id: userId } });
    } catch (err: any) {
      console.error('[AuthService.updateRefreshToken]', err?.message ?? err);
      throw new InternalServerErrorException(
        process.env.NODE_ENV === 'production' ? 'Login failed' : err?.message ?? 'Failed to save session',
      );
    }
  }

  private sanitizeUser(user: User, role: string) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role,
    };
  }
}
