import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Books' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Articles related to books.' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
