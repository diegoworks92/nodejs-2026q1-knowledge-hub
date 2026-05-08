import { IsOptional, IsBoolean, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReindexRequestDto {
  @ApiPropertyOptional({
    default: true,
    description: 'Index only published articles',
  })
  @IsOptional()
  @IsBoolean()
  onlyPublished?: boolean = true;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional list of specific article IDs to reindex',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleIds?: string[];
}
