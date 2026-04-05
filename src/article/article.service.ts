import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CategoryService } from '../category/category.service';
import { CommentService } from '../comment/comment.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  constructor(
    @Inject(forwardRef(() => CategoryService))
    private readonly categoryService: CategoryService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

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

    if (createArticleDto.authorId) {
      this.userService.findOne(createArticleDto.authorId);
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

    if (updateArticleDto.authorId) {
      this.userService.findOne(updateArticleDto.authorId);
    }

    Object.assign(article, updateArticleDto);
    article.updatedAt = Date.now();

    return article;
  }

  remove(id: string): void {
    const article = this.findOne(id);
    const index = this.articles.findIndex((a) => a.id === article.id);

    this.commentService.removeByArticle(id);
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
