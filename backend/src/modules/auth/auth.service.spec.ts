import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserEntity } from '../../database/entities/user.entity';
import { UserRole } from '../../common/interfaces/user.interface';

describe('AuthService (Ayush Module)', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;
  let configService: any;

  const mockUser: Partial<UserEntity> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'manager@safesight.local',
    name: 'Rajesh Sharma',
    role: UserRole.MANAGER,
    passwordHash: '',
    siteId: 'site-123',
    phone: '+919876543210',
    isActive: true,
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('safesight123', 10);

    userRepository = {
      count: jest.fn().mockResolvedValue(1),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string, defaultVal: string) => defaultVal),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should successfully log in with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'manager@safesight.local',
        password: 'safesight123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('manager@safesight.local');
      expect(result.user.role).toBe(UserRole.MANAGER);
    });

    it('should throw UnauthorizedException with wrong password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'manager@safesight.local',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@safesight.local',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return the user profile', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const profile = await service.getMe(mockUser.id!);
      expect(profile.name).toBe('Rajesh Sharma');
      expect(profile.role).toBe(UserRole.MANAGER);
    });
  });
});
