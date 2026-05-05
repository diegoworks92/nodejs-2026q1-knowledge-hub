import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class VectorDbService implements OnModuleInit {
  private client: QdrantClient;
  private collectionName =
    process.env.RAG_VECTOR_COLLECTION || 'knowledge_hub_articles';
  private readonly logger = new Logger(VectorDbService.name);

  constructor() {
    const url = process.env.RAG_VECTOR_DB_URL || 'http://localhost:6333';
    this.client = new QdrantClient({ url });
  }

  async onModuleInit() {
    await this.ensureCollectionExists();
  }

  private async ensureCollectionExists() {
    try {
      const res = await this.client.getCollections();
      const exists = res.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        this.logger.log(`Creating Qdrant collection: ${this.collectionName}`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 768,
            distance: 'Cosine',
          },
        });
        this.logger.log('Collection created successfully.');
      } else {
        this.logger.log(
          `Qdrant collection '${this.collectionName}' already exists.`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to connect to Qdrant on startup: ${error.message}`,
      );
    }
  }

  private async checkConnection() {
    try {
      await this.client.getCollections();
    } catch (error) {
      throw new ServiceUnavailableException(
        'Vector database is currently unavailable',
      );
    }
  }

  async upsertVectors(points: any[]) {
    await this.checkConnection();
    await this.client.upsert(this.collectionName, { wait: true, points });
  }

  async searchSimilar(vector: number[], limit: number, filter?: any) {
    await this.checkConnection();
    return this.client.search(this.collectionName, {
      vector,
      limit,
      filter,
      with_payload: true,
    });
  }

  async deleteByArticleId(articleId: string) {
    await this.checkConnection();
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: {
        must: [{ key: 'articleId', match: { value: articleId } }],
      },
    });
  }
}
