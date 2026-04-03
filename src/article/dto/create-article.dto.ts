import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ example: 'My first article' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'This is the content of the article' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: ['draft', 'published', 'archived'], default: 'draft' })
  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: 'draft' | 'published' | 'archived' = 'draft';

  @ApiProperty({ example: 'uuid-of-user', required: false })
  @IsUUID()
  @IsOptional()
  authorId?: string | null = null;

  @ApiProperty({ example: 'uuid-of-category', required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string | null = null;

  @ApiProperty({ example: ['nestjs', 'typescript'], default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];
}
