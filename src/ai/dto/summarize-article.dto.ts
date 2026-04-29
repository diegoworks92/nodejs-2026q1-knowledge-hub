import { IsOptional, IsIn } from 'class-validator';

export class SummarizeArticleDto {
  @IsOptional()
  @IsIn(['short', 'medium', 'detailed'])
  maxLength?: 'short' | 'medium' | 'detailed';
}
