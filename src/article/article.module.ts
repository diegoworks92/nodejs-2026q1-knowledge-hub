import { forwardRef, Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { CategoryModule } from 'src/category/category.module';
import { CommentModule } from 'src/comment/comment.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    forwardRef(() => CategoryModule),
    forwardRef(() => CommentModule),
    forwardRef(() => UserModule),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
