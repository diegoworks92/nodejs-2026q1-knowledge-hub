import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { ArticleModule } from '../article/article.module';
import { AuthModule } from 'src/auth/auth.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    ArticleModule,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: parseInt(process.env.AI_RATE_LIMIT_RPM || '20'),
      },
    ]),
    RagModule,

    CacheModule.register({
      ttl: parseInt(process.env.AI_CACHE_TTL_SEC || '300') * 1000,
      max: 100,
    }),
  ],
  controllers: [AiController],
  providers: [
    GeminiService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AiModule {}
