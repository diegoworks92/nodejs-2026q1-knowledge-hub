import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { NotFoundError } from '../errors/custom-errors';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map((user) => {
      const userCopy = { ...user };
      delete (userCopy as any).password;
      delete (userCopy as any).hashedRefreshToken;
      return userCopy;
    });
  }

  async findOne(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const userCopy = { ...user };
    delete (userCopy as any).password;
    delete (userCopy as any).hashedRefreshToken;
    return userCopy;
  }

  async create(createUserDto: CreateUserDto) {
    const salt = parseInt(process.env.CRYPT_SALT || '10', 10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        login: createUserDto.login,
        password: hashedPassword,
        role: (createUserDto.role as unknown as Role) || Role.VIEWER,
      },
    });

    const userCopy = { ...user };
    delete (userCopy as any).password;
    delete (userCopy as any).hashedRefreshToken;
    return userCopy;
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );
    if (!isMatch) {
      throw new ForbiddenException('Old password is wrong');
    }

    const salt = parseInt(process.env.CRYPT_SALT || '10', 10);
    const hashedNewPassword = await bcrypt.hash(
      updatePasswordDto.newPassword,
      salt,
    );

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });

    const userCopy = { ...updatedUser };
    delete (userCopy as any).password;
    delete (userCopy as any).hashedRefreshToken;
    return userCopy;
  }

  async remove(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
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
