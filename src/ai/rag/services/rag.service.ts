import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VectorDbService } from './vector-db.service';
import { ChunkerService } from './chunker.service';
import { GeminiService } from '../../gemini.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReindexRequestDto } from '../dto/reindex.dto';
import { v5 as uuidv5, v4 as uuidv4 } from 'uuid';
import { RagSearchRequestDto, RagChatRequestDto } from '../dto/search-chat.dto';
import { RagMemoryService } from './rag-memory.service';

const RAG_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorDb: VectorDbService,
    private readonly chunker: ChunkerService,
    private readonly gemini: GeminiService,
    private readonly memoryService: RagMemoryService,
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

  async search(dto: RagSearchRequestDto) {
    this.logger.log(`Searching for: ${dto.query}`);

    const vector = await this.gemini.getEmbedding(dto.query, true);

    let filter = undefined;
    const mustConditions = [];

    if (dto.articleStatus)
      mustConditions.push({
        key: 'status',
        match: { value: dto.articleStatus },
      });
    if (dto.categoryId)
      mustConditions.push({
        key: 'categoryId',
        match: { value: dto.categoryId },
      });
    if (dto.tags && dto.tags.length > 0)
      mustConditions.push({ key: 'tags', match: { any: dto.tags } });

    if (mustConditions.length > 0) {
      filter = { must: mustConditions };
    }

    const qdrantResults = await this.vectorDb.searchSimilar(
      vector,
      dto.limit,
      filter,
    );

    const results = qdrantResults.map((res) => ({
      articleId: res.payload.articleId as string,
      articleTitle: res.payload.articleTitle as string,
      chunk: res.payload.chunk as string,
      similarity: res.score,
    }));

    return { results };
  }

  async chat(dto: RagChatRequestDto) {
    const conversationId = dto.conversationId || uuidv4();
    this.logger.log(`Chat request in conversation: ${conversationId}`);

    const searchContext = await this.search({
      query: dto.question,
      limit: 5,
      articleStatus: 'PUBLISHED',
    });

    const contextText = searchContext.results
      .map((r) => `Document: ${r.articleTitle}\nContent: ${r.chunk}`)
      .join('\n\n---\n\n');

    const sources = searchContext.results.map((r) => ({
      articleId: r.articleId,
      articleTitle: r.articleTitle,
      relevantChunk: r.chunk,
    }));

    const history = this.memoryService.getHistory(conversationId);
    let historyText = '';
    if (history.length > 0) {
      historyText =
        'Previous conversation history:\n' +
        history.map((h) => `${h.role}: ${h.content}`).join('\n') +
        '\n\n';
    }

    const prompt = `
  You are a helpful knowledge base assistant. Answer the user's question using ONLY the provided Context. 
  If the answer is not contained in the context, say "I don't have enough information in the Knowledge Hub to answer that." Do not use outside knowledge.

  ${historyText}Context Information:
  ${contextText}

  Question:
  ${dto.question}
      `;

    const answer = await this.gemini.generateText(prompt, 'generate');

    this.memoryService.addMessage(conversationId, {
      role: 'user',
      content: dto.question,
    });
    this.memoryService.addMessage(conversationId, {
      role: 'model',
      content: answer,
    });

    return {
      answer,
      sources,
      conversationId,
    };
  }

  getHistory(conversationId: string) {
    return this.memoryService.getHistory(conversationId);
  }
}
