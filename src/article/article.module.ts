import { forwardRef, Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { CategoryModule } from 'src/category/category.module';
import { CommentModule } from 'src/comment/comment.module';

@Module({
  imports: [forwardRef(() => CategoryModule), forwardRef(() => CommentModule)],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
