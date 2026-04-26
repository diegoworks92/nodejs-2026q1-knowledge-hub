import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('UserService', () => {
  let service: UserService;

  const mockPrismaService = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    article: { updateMany: vi.fn() },
    comment: { deleteMany: vi.fn() },
    $transaction: vi.fn(async (args) => args),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  describe('findAll', () => {
    it('should return all users without sensitive data', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: '1', login: 'u1', password: 'p1', hashedRefreshToken: 'r1' },
      ]);
      const result = await service.findAll();
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).not.toHaveProperty('hashedRefreshToken');
    });
  });

  describe('findOne', () => {
    it('should throw BadRequestException if id is not a valid UUID', async () => {
      await expect(service.findOne('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should throw NotFoundException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.findOne('123e4567-e89b-12d3-a456-426614174000'),
      ).rejects.toThrow(NotFoundException);
    });
    it('should return user without password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        login: 't',
        password: 'p',
      });
      const result = await service.findOne(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('create', () => {
    it('should hash password and create user', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        login: 'u',
        password: 'h',
        role: 'VIEWER',
      });
      const result = await service.create({ login: 'u', password: 'p' });
      expect(result.login).toBe('u');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    const uid = '123e4567-e89b-12d3-a456-426614174000';
    it('should throw BadRequest if invalid uuid', async () => {
      await expect(
        service.updatePassword('invalid', {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user is not found during password update', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updatePassword(uid, { oldPassword: 'any', newPassword: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update password successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: uid,
        password: 'old',
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
      mockPrismaService.user.update.mockResolvedValue({
        id: uid,
        password: 'new-hash',
      });

      const result = await service.updatePassword(uid, {
        oldPassword: 'old',
        newPassword: 'new',
      });
      expect(result).toBeDefined();
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const uid = '123e4567-e89b-12d3-a456-426614174000';
    it('should throw BadRequest if invalid uuid', async () => {
      await expect(service.remove('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should throw NotFound if user missing', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.remove(uid)).rejects.toThrow(NotFoundException);
    });
    it('should execute transaction on success', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: uid });
      await service.remove(uid);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
