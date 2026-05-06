import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
} from '@nestjs/common';
import { RagService } from './services/rag.service';
import { ReindexRequestDto } from './dto/reindex.dto';

@Controller('ai/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @HttpCode(HttpStatus.OK)
  async reindex(@Body() dto: ReindexRequestDto) {
    return this.ragService.indexArticles(dto);
  }

  @Delete('index/articles/:articleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIndex(@Param('articleId') articleId: string) {
    await this.ragService.deleteArticleVectors(articleId);
  }
}
