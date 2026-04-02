import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (missing required fields).',
  })
  create(@Body() createUserDto: CreateUserDto) {
    const user = this.userService.create(createUserDto);

    const { password, ...result } = user;
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    const users = this.userService.findAll();
    return users.map(({ password, ...user }) => user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single user by id' })
  findOne(@Param('id') id: string) {
    const user = this.userService.findOne(id);
    const { password, ...result } = user;
    return result;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user password' })
  update(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = this.userService.updatePassword(id, updatePasswordDto);
    const { password, ...result } = user;
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
