import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly ai: GoogleGenerativeAI;
  private readonly modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  private readonly logger = new Logger(GeminiService.name);

  private usage = {
    totalRequests: 0,
    endpoints: {
      summarize: 0,
      translate: 0,
      analyze: 0,
      generate: 0,
    },
    totalTokens: 0,
  };

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is missing from environment variables');
    }
    this.ai = new GoogleGenerativeAI(apiKey || 'missing-key');
  }

  getUsageStats() {
    return this.usage;
  }

  async generateText(
    prompt: string,
    endpoint: 'summarize' | 'translate' | 'analyze' | 'generate' = 'generate',
  ): Promise<string> {
    this.usage.totalRequests++;
    if (this.usage.endpoints[endpoint] !== undefined) {
      this.usage.endpoints[endpoint]++;
    }

    try {
      const model = this.ai.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);

      if (result.response?.usageMetadata?.totalTokenCount) {
        this.usage.totalTokens += result.response.usageMetadata.totalTokenCount;
      }

      const text = result.response?.text();
      if (!text) throw new Error('Empty response from AI');

      return text;
    } catch (error: any) {
      this.logger.error(`Gemini API Error: ${error.message}`);

      if (
        error.status === 401 ||
        error.status === 403 ||
        error.message?.includes('API key')
      ) {
        throw new InternalServerErrorException(
          'AI integration failed due to server configuration',
        );
      }
      if (
        error.status === 429 ||
        error.message?.includes('quota') ||
        error.message?.includes('Rate Limit')
      ) {
        throw new ServiceUnavailableException(
          'AI service is currently overloaded (Rate Limit)',
        );
      }

      throw new ServiceUnavailableException(
        'AI service is currently unavailable',
      );
    }
  }

  async getEmbedding(
    text: string,
    isQuery: boolean = false,
  ): Promise<number[]> {
    const modelName =
      process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

    try {
      const model = this.ai.getGenerativeModel({ model: modelName });

      const result = await model.embedContent(text);

      return result.embedding.values;
    } catch (error: any) {
      this.logger.error(`Error crítico en Gemini Embedding: ${error.message}`);
      throw new ServiceUnavailableException(
        'AI embedding service is currently unavailable',
      );
    }
  }

  async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const cleanTexts = texts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (cleanTexts.length === 0) return [];

    const modelName =
      process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

    try {
      const model = this.ai.getGenerativeModel({ model: modelName });

      const result = await model.batchEmbedContents({
        requests: cleanTexts.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
          taskType: 'RETRIEVAL_DOCUMENT' as any,
        })),
      });

      if (!result.embeddings) {
        throw new Error('No embeddings returned');
      }

      return result.embeddings.map((e) => e.values);
    } catch (error: any) {
      this.logger.error(`Gemini Batch technical error: ${error.message}`);
      throw new ServiceUnavailableException(
        'AI embedding service is currently unavailable',
      );
    }
  }
}
