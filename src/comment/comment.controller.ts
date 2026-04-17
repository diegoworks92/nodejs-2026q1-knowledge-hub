import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('comment')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: 'Create new comment' })
  async create(@Body() createCommentDto: CreateCommentDto) {
    return await this.commentService.create(createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments (optionally filter by articleId)' })
  @ApiQuery({ name: 'articleId', required: false })
  async findAll(@Query('articleId') articleId?: string) {
    return await this.commentService.findAll(articleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single comment by id' })
  async findOne(@Param('id') id: string) {
    return await this.commentService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment' })
  async remove(@Param('id') id: string) {
    return await this.commentService.remove(id);
  }
}
