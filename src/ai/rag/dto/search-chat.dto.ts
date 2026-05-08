import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RagSearchRequestDto {
  @ApiProperty({ example: 'How to configure Docker?' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ default: 5, maximum: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number = 5;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  articleStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class RagChatRequestDto {
  @ApiProperty({ example: 'What is the main topic of the database?' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ description: 'Pass this to continue a conversation' })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
