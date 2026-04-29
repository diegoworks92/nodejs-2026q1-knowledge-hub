import { IsOptional, IsIn } from 'class-validator';

export class AnalyzeArticleDto {
  @IsOptional()
  @IsIn(['review', 'bugs', 'optimize', 'explain'])
  task?: 'review' | 'bugs' | 'optimize' | 'explain';
}
