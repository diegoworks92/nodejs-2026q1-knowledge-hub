import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CommentService', () => {
  let service: CommentService;
  let prisma: PrismaService;

  const mockPrismaService = {
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    article: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw UnprocessableEntityException if article does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      const dto = {
        content: 'Nice!',
        articleId: 'article-uuid',
        authorId: 'author-uuid',
      };

      await expect(service.create(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should create comment if article exists', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({
        id: 'article-uuid',
      });
      mockPrismaService.comment.create.mockResolvedValue({
        id: 'comment-uuid',
      });

      const dto = {
        content: 'Nice!',
        articleId: 'article-uuid',
        authorId: 'author-uuid',
      };
      await service.create(dto);

      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Nice!',
          articleId: 'article-uuid',
          authorId: 'author-uuid',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should filter by articleId if provided', async () => {
      await service.findAll('article-uuid');
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: { articleId: 'article-uuid' },
      });
    });

    it('should return all comments if no articleId is provided', async () => {
      await service.findAll();
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith();
    });
  });

  describe('findOne & getById', () => {
    it('should throw BadRequestException if id is invalid', async () => {
      await expect(service.findOne('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return comment by id', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.comment.findUnique.mockResolvedValue({ id: validUuid });

      const result1 = await service.findOne(validUuid);
      const result2 = await service.getById(validUuid);

      expect(result1).toEqual({ id: validUuid });
      expect(result2).toEqual({ id: validUuid });
    });
  });

  describe('update', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should throw ForbiddenException if user is editor and not the author', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        id: validUuid,
        authorId: 'another-author-id',
      });

      const user = { role: 'editor', userId: 'editor-id' };

      await expect(
        service.update(validUuid, { content: 'New' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update comment successfully', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        id: validUuid,
        authorId: 'author-id',
      });
      mockPrismaService.comment.update.mockResolvedValue({ id: validUuid });

      await service.update(
        validUuid,
        { content: 'Updated content' },
        { role: 'admin' },
      );

      expect(mockPrismaService.comment.update).toHaveBeenCalledWith({
        where: { id: validUuid },
        data: { content: 'Updated content' },
      });
    });
  });

  describe('remove', () => {
    it('should delete a comment', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.comment.findUnique.mockResolvedValue({ id: validUuid });

      await service.remove(validUuid);

      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: validUuid },
      });
    });
  });
});
