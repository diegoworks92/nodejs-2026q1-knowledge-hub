import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(
      ({ password, ...userWithoutPassword }) => userWithoutPassword,
    );
  }

  async findOne(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        login: createUserDto.login,
        password: createUserDto.password,
        role: (createUserDto.role as unknown as Role) || Role.VIEWER,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Old password is wrong');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        password: updatePasswordDto.newPassword,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async remove(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction([
      this.prisma.article.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      }),
      this.prisma.comment.deleteMany({
        where: { authorId: id },
      }),
      this.prisma.user.delete({
        where: { id },
      }),
    ]);
  }
}
