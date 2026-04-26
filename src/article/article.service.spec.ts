import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ArticleStatus } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ArticleService', () => {
  let service: ArticleService;

  const mockPrismaService = {
    article: {
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
        ArticleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should build correct query with all filters applied', async () => {
      mockPrismaService.article.findMany.mockResolvedValue([]);

      await service.findAll('PUBLISHED', 'cat-123', 'nestjs');

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          categoryId: 'cat-123',
          tags: { some: { name: 'nestjs' } },
        },
        include: { tags: true },
      });
    });

    it('should build correct query with no filters applied', async () => {
      mockPrismaService.article.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith({
        where: {
          status: undefined,
          categoryId: undefined,
          tags: undefined,
        },
        include: { tags: true },
      });
    });
  });

  describe('findOne', () => {
    it('should throw BadRequestException if id is not a valid UUID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if article is not found', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.findOne(validUuid)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return article if found', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const mockArticle = { id: validUuid, title: 'Test' };
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.findOne(validUuid);

      expect(result).toEqual(mockArticle);
    });
  });

  describe('create', () => {
    it('should create article with tags formatting', async () => {
      const dto = { title: 'Test', content: 'Content', tags: ['nest', 'node'] };
      mockPrismaService.article.create.mockResolvedValue({
        id: 'uuid',
        ...dto,
      });

      await service.create(dto as any);

      expect(mockPrismaService.article.create).toHaveBeenCalledWith({
        data: {
          title: 'Test',
          content: 'Content',
          status: ArticleStatus.DRAFT,
          authorId: null,
          categoryId: null,
          tags: {
            connectOrCreate: [
              { where: { name: 'nest' }, create: { name: 'nest' } },
              { where: { name: 'node' }, create: { name: 'node' } },
            ],
          },
        },
        include: { tags: true },
      });
    });
  });

  describe('update', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should throw ForbiddenException if user is editor and not the author', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({
        id: validUuid,
        authorId: 'other-author-id',
      });

      const user = { role: 'editor', userId: 'editor-id' };

      await expect(
        service.update(validUuid, { title: 'New' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update article successfully with tags', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({
        id: validUuid,
        authorId: 'author-id',
      });
      mockPrismaService.article.update.mockResolvedValue({ id: validUuid });

      const user = { role: 'admin', userId: 'admin-id' };
      const updateDto = { title: 'New', tags: ['updatedTag'] };

      await service.update(validUuid, updateDto as any, user);

      expect(mockPrismaService.article.update).toHaveBeenCalledWith({
        where: { id: validUuid },
        data: expect.objectContaining({
          title: 'New',
          tags: {
            set: [],
            connectOrCreate: [
              { where: { name: 'updatedTag' }, create: { name: 'updatedTag' } },
            ],
          },
        }),
        include: { tags: true },
      });
    });
  });

  describe('remove', () => {
    it('should delete article after finding it', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.article.findUnique.mockResolvedValue({ id: validUuid });

      await service.remove(validUuid);

      expect(mockPrismaService.article.delete).toHaveBeenCalledWith({
        where: { id: validUuid },
      });
    });
  });
});
