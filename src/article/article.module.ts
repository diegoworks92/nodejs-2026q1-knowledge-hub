import { forwardRef, Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { CategoryModule } from '../category/category.module';
import { CommentModule } from '../comment/comment.module';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CategoryModule),
    forwardRef(() => CommentModule),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
