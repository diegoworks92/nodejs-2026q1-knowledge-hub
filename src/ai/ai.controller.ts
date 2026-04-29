import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ArticleService } from '../article/article.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { PromptTemplates } from './prompts/prompt-templates';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
  ) {}

  @Post('articles/:articleId/summarize')
  async summarize(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    const article = await this.articleService.findOne(articleId);

    const prompt = PromptTemplates.summarize(article.content, dto.maxLength);

    const summary = await this.geminiService.generateText(prompt);

    return {
      articleId: article.id,
      summary: summary.trim(),
      originalLength: article.content.length,
      summaryLength: summary.trim().length,
    };
  }

  @Post('articles/:articleId/translate')
  async translate(
    @Param('articleId') articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    const article = await this.articleService.findOne(articleId);

    const prompt = PromptTemplates.translate(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
    const translatedText = await this.geminiService.generateText(prompt);

    return {
      articleId: article.id,
      translatedText: translatedText.trim(),
      detectedLanguage: dto.sourceLanguage || 'auto',
    };
  }
}
