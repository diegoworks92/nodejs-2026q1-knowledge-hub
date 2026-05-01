import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Inject,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiProperty } from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GeminiService } from './gemini.service';
import { ArticleService } from '../article/article.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { PromptTemplates } from './prompts/prompt-templates';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class GeneralPromptDto {
  @ApiProperty({ example: 'Explain NestJS in one sentence.' })
  prompt: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post('articles/:articleId/summarize')
  async summarize(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    const article = await this.articleService.findOne(articleId);

    const cacheKey = `summarize:${articleId}:${dto.maxLength || 'medium'}:${article.updatedAt.getTime()}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const prompt = PromptTemplates.summarize(article.content, dto.maxLength);

    const summary = await this.geminiService.generateText(prompt, 'summarize');

    const result = {
      articleId: article.id,
      summary: summary.trim(),
      originalLength: article.content.length,
      summaryLength: summary.trim().length,
    };

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  @Post('articles/:articleId/translate')
  async translate(
    @Param('articleId') articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    const article = await this.articleService.findOne(articleId);

    const cacheKey = `translate:${articleId}:${dto.targetLanguage}:${article.updatedAt.getTime()}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const prompt = PromptTemplates.translate(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );

    const translatedText = await this.geminiService.generateText(
      prompt,
      'translate',
    );

    const result = {
      articleId: article.id,
      translatedText: translatedText.trim(),
      detectedLanguage: dto.sourceLanguage || 'auto',
    };

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  @Post('articles/:articleId/analyze')
  async analyze(
    @Param('articleId') articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ) {
    const article = await this.articleService.findOne(articleId);
    const prompt = PromptTemplates.analyze(article.content, dto.task);

    const response = await this.geminiService.generateText(prompt, 'analyze');

    try {
      const cleanedResponse = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const analysisData = JSON.parse(cleanedResponse);
      return { articleId: article.id, ...analysisData };
    } catch (error) {
      return {
        articleId: article.id,
        analysis: response,
        suggestions: [],
        severity: 'info',
      };
    }
  }

  @Post('generate')
  async generate(@Body() dto: GeneralPromptDto) {
    const result = await this.geminiService.generateText(
      dto.prompt,
      'generate',
    );
    return { response: result };
  }

  @Get('usage')
  getUsage() {
    return this.geminiService.getUsageStats();
  }
}
