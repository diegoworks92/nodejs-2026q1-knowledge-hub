import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockPrismaService = {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: '1', name: 'Tech' },
      ]);
      const result = await service.findAll();
      expect(result).toEqual([{ id: '1', name: 'Tech' }]);
    });
  });

  describe('findOne', () => {
    it('should throw BadRequestException if id is not a valid UUID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if category is not found', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      await expect(service.findOne(validUuid)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return category if found', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: validUuid,
        name: 'Tech',
      });
      const result = await service.findOne(validUuid);
      expect(result).toEqual({ id: validUuid, name: 'Tech' });
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const dto = { name: 'Tech', description: 'Tech related' };
      mockPrismaService.category.create.mockResolvedValue({
        id: 'uuid',
        ...dto,
      });

      await service.create(dto);

      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: { name: 'Tech', description: 'Tech related' },
      });
    });
  });

  describe('update', () => {
    it('should update a category successfully', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const dto = { name: 'Updated Tech', description: 'Updated description' };

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: validUuid,
      });
      mockPrismaService.category.update.mockResolvedValue({
        id: validUuid,
        ...dto,
      });

      await service.update(validUuid, dto);

      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: validUuid },
        data: { name: 'Updated Tech', description: 'Updated description' },
      });
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: validUuid,
      });

      await service.remove(validUuid);

      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id: validUuid },
      });
    });
  });
});
