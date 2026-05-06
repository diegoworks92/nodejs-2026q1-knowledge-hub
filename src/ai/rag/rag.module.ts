import { Module } from '@nestjs/common';
import { VectorDbService } from './services/vector-db.service';
import { ChunkerService } from './services/chunker.service';
import { RagService } from './services/rag.service';
import { RagController } from './rag.controller';
import { GeminiService } from '../gemini.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RagController],
  providers: [VectorDbService, ChunkerService, RagService, GeminiService],
  exports: [RagService],
})
export class RagModule {}
