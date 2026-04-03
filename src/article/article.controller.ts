import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('article')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @ApiOperation({ summary: 'Create new article' })
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articleService.create(createArticleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all articles' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'published', 'archived'],
  })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
  ) {
    return this.articleService.findAll(status, categoryId, tag);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single article by id' })
  findOne(@Param('id') id: string) {
    return this.articleService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update article info' })
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete article' })
  remove(@Param('id') id: string) {
    return this.articleService.remove(id);
  }
}
