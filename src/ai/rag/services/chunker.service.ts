import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkerService {
  private readonly chunkSize = parseInt(
    process.env.RAG_CHUNK_SIZE || '800',
    10,
  );
  private readonly chunkOverlap = parseInt(
    process.env.RAG_CHUNK_OVERLAP || '200',
    10,
  );

  chunkText(text: string): string[] {
    if (!text || text.trim() === '') return [];

    const chunks: string[] = [];
    let i = 0;

    while (i < text.length) {
      chunks.push(text.slice(i, i + this.chunkSize));

      i += this.chunkSize - this.chunkOverlap;
    }

    return chunks;
  }
}
