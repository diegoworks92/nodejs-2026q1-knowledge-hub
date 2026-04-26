import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockJwtService = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should throw BadRequestException if login exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(
        service.signup({ login: 'test', password: '123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      mockPrismaService.user.create.mockResolvedValue({ id: 'new-id' });

      const result = await service.signup({ login: 'new', password: '123' });
      expect(result.message).toBe('User created successfully');
    });
  });

  describe('login', () => {
    it('should throw ForbiddenException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ login: 'u', password: 'p' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if password matches is false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        password: 'hash',
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      await expect(
        service.login({ login: 'u', password: 'p' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return tokens and update refresh token on success', async () => {
      const user = { id: '1', login: 'u', password: 'h', role: 'ADMIN' };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockJwtService.signAsync.mockResolvedValue('token');
      vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

      const result = await service.login({ login: 'u', password: 'p' });
      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should throw ForbiddenException if jwt verify fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error());
      await expect(service.refresh('token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user not found or no hashedRefreshToken', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ userId: '1' });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.refresh('token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if refresh token does not match', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ userId: '1' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        hashedRefreshToken: 'hash',
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      await expect(service.refresh('token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return new tokens on success', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ userId: '1' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        hashedRefreshToken: 'hash',
        role: 'ADMIN',
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockJwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refresh('token');
      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should set hashedRefreshToken to null', async () => {
      await service.logout('user-id');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { hashedRefreshToken: null },
      });
    });
  });
});
