import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
  Get,
  UseGuards,
} from '@nestjs/common';
import { RagService } from './services/rag.service';
import { ReindexRequestDto } from './dto/reindex.dto';
import { RagSearchRequestDto, RagChatRequestDto } from './dto/search-chat.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators';

@ApiTags('ai rag')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Index Knowledge Hub data into the vector database',
  })
  async reindex(@Body() dto: ReindexRequestDto) {
    return this.ragService.indexArticles(dto);
  }

  @Delete('index/articles/:articleId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an article and its vectors from the index' })
  async deleteIndex(@Param('articleId') articleId: string) {
    await this.ragService.deleteArticleVectors(articleId);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform semantic search across indexed articles' })
  async search(@Body() dto: RagSearchRequestDto) {
    return this.ragService.search(dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chat with the RAG assistant using indexed knowledge',
  })
  async chat(@Body() dto: RagChatRequestDto) {
    return this.ragService.chat(dto);
  }

  @Get('chat/:conversationId/history')
  @ApiOperation({ summary: 'Retrieve conversation history by conversation ID' })
  async getChatHistory(@Param('conversationId') conversationId: string) {
    return this.ragService.getHistory(conversationId);
  }
}
