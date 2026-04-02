import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: 'abc123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: ['admin', 'editor', 'viewer'], default: 'viewer' })
  @IsEnum(['admin', 'editor', 'viewer'])
  @IsOptional()
  role?: 'admin' | 'editor' | 'viewer' = 'viewer';
}
