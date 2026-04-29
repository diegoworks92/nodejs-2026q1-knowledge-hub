import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { ArticleModule } from '../article/article.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ArticleModule, AuthModule],
  controllers: [AiController],
  providers: [GeminiService],
})
export class AiModule {}
