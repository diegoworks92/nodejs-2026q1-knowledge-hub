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

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is missing from environment variables');
    }
    this.ai = new GoogleGenerativeAI(apiKey || 'missing-key');
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      this.logger.error(`Gemini API Error: ${error.message}`);

      if (
        error.status === 401 ||
        error.status === 403 ||
        error.message.includes('API key')
      ) {
        throw new InternalServerErrorException(
          'AI integration failed due to server configuration',
        );
      }
      if (error.status === 429 || error.message.includes('quota')) {
        throw new ServiceUnavailableException(
          'AI service is currently overloaded (Rate Limit)',
        );
      }

      throw new ServiceUnavailableException(
        'AI service is currently unavailable',
      );
    }
  }
}
