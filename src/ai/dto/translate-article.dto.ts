import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TranslateArticleDto {
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}
