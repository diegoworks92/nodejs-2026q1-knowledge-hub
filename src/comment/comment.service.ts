import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ForbiddenException } from '@nestjs/common';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: createCommentDto.articleId },
    });

    if (!article) {
      throw new UnprocessableEntityException('Article does not exist');
    }

    return await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        articleId: createCommentDto.articleId,
        authorId: createCommentDto.authorId || null,
      },
    });
  }

  async findAll(articleId?: string) {
    if (articleId) {
      return await this.prisma.comment.findMany({
        where: { articleId },
      });
    }
    return await this.prisma.comment.findMany();
  }

  async findOne(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid commentId');
    }
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async getById(id: string) {
    return await this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.comment.delete({
      where: { id },
    });
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, user?: any) {
    const comment = await this.findOne(id);

    if (user && user.role === 'editor') {
      if (comment.authorId !== user.userId) {
        throw new ForbiddenException('You can only update your own comments');
      }
    }

    return await this.prisma.comment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
      },
    });
  }
}
