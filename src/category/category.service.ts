import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.category.findMany();
  }

  async findOne(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid categoryId (not uuid)');
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    return await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
      },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    return await this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
      },
    });
  }

  async remove(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid categoryId (not uuid)');
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
