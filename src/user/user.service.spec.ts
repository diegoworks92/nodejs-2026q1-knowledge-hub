import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    article: {
      updateMany: vi.fn(),
    },
    comment: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (args) => args),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw BadRequestException if id is not a valid UUID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(validUuid)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return user without password and hashedRefreshToken', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: validUuid,
        login: 'testuser',
        password: 'secret',
        hashedRefreshToken: 'token',
        role: Role.VIEWER,
      });

      const result = await service.findOne(validUuid);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('hashedRefreshToken');
      expect(result.login).toBe('testuser');
    });
  });

  describe('create', () => {
    it('should hash password and assign VIEWER role by default', async () => {
      const dto = { login: 'newuser', password: 'plainpassword' };
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedpassword' as never);

      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid',
        login: dto.login,
        password: 'hashedpassword',
        role: Role.VIEWER,
      });

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'plainpassword',
        expect.any(Number),
      );
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          login: 'newuser',
          password: 'hashedpassword',
          role: Role.VIEWER,
        },
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updatePassword', () => {
    it('should throw ForbiddenException if old password is wrong', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: validUuid,
        password: 'hashed-old-password',
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      await expect(
        service.updatePassword(validUuid, {
          oldPassword: 'wrong',
          newPassword: 'new',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should call Prisma transaction with correct updates and deletes', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.user.findUnique.mockResolvedValue({ id: validUuid });

      await service.remove(validUuid);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.article.updateMany).toHaveBeenCalledWith({
        where: { authorId: validUuid },
        data: { authorId: null },
      });
      expect(mockPrismaService.comment.deleteMany).toHaveBeenCalledWith({
        where: { authorId: validUuid },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: validUuid },
      });
    });
  });
});
