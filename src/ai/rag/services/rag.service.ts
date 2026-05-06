import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VectorDbService } from './vector-db.service';
import { ChunkerService } from './chunker.service';
import { GeminiService } from '../../gemini.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReindexRequestDto } from '../dto/reindex.dto';
import { v5 as uuidv5 } from 'uuid';

const RAG_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorDb: VectorDbService,
    private readonly chunker: ChunkerService,
    private readonly gemini: GeminiService,
  ) {}

  async indexArticles(dto: ReindexRequestDto) {
    const { onlyPublished = true, articleIds } = dto;

    const whereClause: any = {};
    if (onlyPublished) {
      whereClause.status = 'PUBLISHED';
    }
    if (articleIds && articleIds.length > 0) {
      whereClause.id = { in: articleIds };
    }

    const articles = await this.prisma.article.findMany({
      where: whereClause,
      include: {
        tags: true,
        category: true,
      },
    });

    let indexedChunksCount = 0;
    const collectionName =
      process.env.RAG_VECTOR_COLLECTION || 'knowledge_hub_articles';

    for (const article of articles) {
      await this.vectorDb.deleteByArticleId(article.id);

      const textToChunk = `${article.title}\n\n${article.content}`;
      const chunks = this.chunker.chunkText(textToChunk);

      const points = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];

        const vector = await this.gemini.getEmbedding(chunkText);

        const pointId = uuidv5(`${article.id}-chunk-${i}`, RAG_NAMESPACE);

        points.push({
          id: pointId,
          vector,
          payload: {
            articleId: article.id,
            articleTitle: article.title,
            status: article.status,
            categoryId: article.categoryId,
            tags: article.tags.map((t) => t.name),
            chunk: chunkText,
          },
        });
        indexedChunksCount++;
      }

      if (points.length > 0) {
        await this.vectorDb.upsertVectors(points);
      }
    }

    return {
      indexedArticles: articles.length,
      indexedChunks: indexedChunksCount,
      vectorCollection: collectionName,
    };
  }

  async deleteArticleVectors(articleId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) throw new NotFoundException('Article not found');

    await this.vectorDb.deleteByArticleId(articleId);
  }
}
