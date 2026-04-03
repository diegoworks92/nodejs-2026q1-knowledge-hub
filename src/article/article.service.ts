import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CategoryService } from '../category/category.service';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  constructor(private readonly categoryService: CategoryService) {}

  findAll(status?: string, categoryId?: string, tag?: string): Article[] {
    let filteredArticles = [...this.articles];

    if (status) {
      filteredArticles = filteredArticles.filter((a) => a.status === status);
    }

    if (categoryId) {
      filteredArticles = filteredArticles.filter(
        (a) => a.categoryId === categoryId,
      );
    }

    if (tag) {
      filteredArticles = filteredArticles.filter((a) => a.tags.includes(tag));
    }

    return filteredArticles;
  }

  findOne(id: string): Article {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid articleId (not uuid)');
    }
    const article = this.articles.find((a) => a.id === id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  create(createArticleDto: CreateArticleDto): Article {
    if (createArticleDto.categoryId) {
      this.categoryService.findOne(createArticleDto.categoryId);
    }

    const newArticle: Article = {
      id: uuidv4(),
      title: createArticleDto.title,
      content: createArticleDto.content,
      status: createArticleDto.status || 'draft',
      authorId: createArticleDto.authorId || null,
      categoryId: createArticleDto.categoryId || null,
      tags: createArticleDto.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.articles.push(newArticle);
    return newArticle;
  }

  update(id: string, updateArticleDto: UpdateArticleDto): Article {
    const article = this.findOne(id);

    if (updateArticleDto.categoryId) {
      this.categoryService.findOne(updateArticleDto.categoryId);
    }

    Object.assign(article, updateArticleDto);
    article.updatedAt = Date.now();

    return article;
  }

  remove(id: string): void {
    const index = this.articles.findIndex((a) => a.id === id);
    if (index === -1) {
      this.findOne(id);
    }
    this.articles.splice(index, 1);
  }

  nullifyAuthor(userId: string) {
    this.articles.forEach((a) => {
      if (a.authorId === userId) a.authorId = null;
    });
  }

  nullifyCategory(categoryId: string) {
    this.articles.forEach((a) => {
      if (a.categoryId === categoryId) a.categoryId = null;
    });
  }
}
