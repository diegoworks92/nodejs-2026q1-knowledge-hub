import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ArticleService } from '../article/article.service';

@Injectable()
export class CommentService {
  private comments: Comment[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  create(createCommentDto: CreateCommentDto): Comment {
    try {
      this.articleService.findOne(createCommentDto.articleId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnprocessableEntityException('Article does not exist');
      }
      throw error;
    }

    const newComment: Comment = {
      id: uuidv4(),
      content: createCommentDto.content,
      articleId: createCommentDto.articleId,
      authorId: createCommentDto.authorId || null,
      createdAt: Date.now(),
    };

    this.comments.push(newComment);
    return newComment;
  }

  findAll(articleId?: string): Comment[] {
    if (articleId) {
      return this.comments.filter((c) => c.articleId === articleId);
    }
    return this.comments;
  }

  findOne(id: string): Comment {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid commentId');
    }
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  getById(id: string): Comment {
    return this.findOne(id);
  }

  remove(id: string): void {
    const comment = this.findOne(id);
    const index = this.comments.findIndex((c) => c.id === comment.id);
    this.comments.splice(index, 1);
  }

  removeByArticle(articleId: string) {
    this.comments = this.comments.filter((c) => c.articleId !== articleId);
  }

  removeByUser(userId: string) {
    this.comments = this.comments.filter((c) => c.authorId !== userId);
  }

  nullifyAuthor(userId: string) {
    this.comments.forEach((c) => {
      if (c.authorId === userId) c.authorId = null;
    });
  }
}
