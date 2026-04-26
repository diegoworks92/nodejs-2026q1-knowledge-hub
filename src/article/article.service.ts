import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '@prisma/client';
import { NotFoundError } from '../errors/custom-errors';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string, categoryId?: string, tag?: string) {
    return await this.prisma.article.findMany({
      where: {
        status: status as ArticleStatus,
        categoryId: categoryId,
        tags: tag ? { some: { name: tag } } : undefined,
      },
      include: {
        tags: true,
      },
    });
  }

  async findOne(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid articleId (not uuid)');
    }
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article;
  }

  async create(createArticleDto: CreateArticleDto) {
    const tagsData =
      createArticleDto.tags?.map((tagName) => ({
        where: { name: tagName },
        create: { name: tagName },
      })) || [];

    return await this.prisma.article.create({
      data: {
        title: createArticleDto.title,
        content: createArticleDto.content,
        status:
          (createArticleDto.status as ArticleStatus) || ArticleStatus.DRAFT,
        authorId: createArticleDto.authorId || null,
        categoryId: createArticleDto.categoryId || null,
        tags: {
          connectOrCreate: tagsData,
        },
      },
      include: { tags: true },
    });
  }

  async update(id: string, updateArticleDto: UpdateArticleDto, user?: any) {
    const article = await this.findOne(id);

    if (user && user.role === 'editor') {
      if (article.authorId !== user.userId) {
        throw new ForbiddenException('You can only update your own articles');
      }
    }

    const tagsData = updateArticleDto.tags?.map((tagName) => ({
      where: { name: tagName },
      create: { name: tagName },
    }));

    return await this.prisma.article.update({
      where: { id },
      data: {
        title: updateArticleDto.title,
        content: updateArticleDto.content,
        status: updateArticleDto.status as ArticleStatus,
        authorId: updateArticleDto.authorId,
        categoryId: updateArticleDto.categoryId,
        tags: tagsData ? { set: [], connectOrCreate: tagsData } : undefined,
      },
      include: { tags: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.article.delete({
      where: { id },
    });
  }
}
