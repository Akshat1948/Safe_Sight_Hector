import { Injectable, UnauthorizedException, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../database/entities/user.entity';
import { LoginDto, RefreshTokenDto } from '../../common/dto';
import { UserRole } from '../../common/interfaces/user.interface';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultUsers();
  }

  /**
   * Seed default demo users for the hackathon environment
   */
  private async seedDefaultUsers() {
    const count = await this.userRepository.count();
    if (count === 0) {
      this.logger.log('Seeding initial demo users for SafeSight...');
      const hashedPassword = await bcrypt.hash('safesight123', 10);

      const demoUsers = [
        {
          email: 'manager@safesight.local',
          passwordHash: hashedPassword,
          name: 'Rajesh Sharma (Site Manager)',
          role: UserRole.MANAGER,
          phone: '+919876543210',
          isActive: true,
        },
        {
          email: 'responder@safesight.local',
          passwordHash: hashedPassword,
          name: 'Vikram Singh (108 Emergency Lead)',
          role: UserRole.RESPONDER,
          phone: '+919876543211',
          isActive: true,
        },
        {
          email: 'admin@safesight.local',
          passwordHash: hashedPassword,
          name: 'District Admin',
          role: UserRole.ADMIN,
          phone: '+919876543212',
          isActive: true,
        },
      ];

      await this.userRepository.save(demoUsers);
      this.logger.log('Demo users created: manager@safesight.local, responder@safesight.local, admin@safesight.local (password: safesight123)');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        siteId: user.siteId,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET', 'safesight-super-secret-jwt-key-2026'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      siteId: user.siteId,
      phone: user.phone,
    };
  }

  private generateTokens(user: UserEntity) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      siteId: user.siteId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
