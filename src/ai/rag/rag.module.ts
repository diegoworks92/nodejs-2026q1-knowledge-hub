import { Module } from '@nestjs/common';
import { VectorDbService } from './services/vector-db.service';

@Module({
  providers: [VectorDbService],
  exports: [VectorDbService],
})
export class RagModule {}
