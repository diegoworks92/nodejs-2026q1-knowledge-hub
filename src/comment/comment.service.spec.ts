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

  const mockPrismaService = {
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    article: { findUnique: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();
    service = module.get<CommentService>(CommentService);
  });

  describe('create', () => {
    it('should throw UnprocessableEntityException if article does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ content: '!', articleId: 'id', authorId: 'id' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should create comment if article exists', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'a' });
      mockPrismaService.comment.create.mockResolvedValue({ id: 'c' });
      await service.create({ content: 'Nice!', articleId: 'a', authorId: 'u' });
      expect(mockPrismaService.comment.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should call findMany with articleId if provided', async () => {
      await service.findAll('article-uuid');
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: { articleId: 'article-uuid' },
      });
    });

    it('should call findMany without params if no articleId', async () => {
      await service.findAll();
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith();
    });
  });

  describe('findOne & getById', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should throw BadRequestException if id is invalid', async () => {
      await expect(service.findOne('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);
      await expect(service.findOne(validUuid)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the comment if found', async () => {
      const mockComment = { id: validUuid, content: 'test' };
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      const result = await service.getById(validUuid);
      expect(result).toEqual(mockComment);
    });
  });

  describe('update', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should throw ForbiddenException if user is editor and not the author', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        id: validUuid,
        authorId: 'other',
      });
      await expect(
        service.update(
          validUuid,
          { content: 'New' },
          { role: 'editor', userId: 'me' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow update if user is the author', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        id: validUuid,
        authorId: 'me',
      });
      mockPrismaService.comment.update.mockResolvedValue({
        id: validUuid,
        content: 'Updated',
      });

      const result = await service.update(
        validUuid,
        { content: 'Updated' },
        { role: 'editor', userId: 'me' },
      );
      expect(result.content).toBe('Updated');
    });
  });

  describe('remove', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should throw NotFoundException if comment to remove does not exist', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);
      await expect(service.remove(validUuid)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete a comment', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({ id: validUuid });
      await service.remove(validUuid);
      expect(mockPrismaService.comment.delete).toHaveBeenCalled();
    });
  });
});
