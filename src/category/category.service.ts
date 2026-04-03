import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  private categories: Category[] = [];

  findAll(): Category[] {
    return this.categories;
  }

  findOne(id: string): Category {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid categoryId (not uuid)');
    }
    const category = this.categories.find((c) => c.id === id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  create(createCategoryDto: CreateCategoryDto): Category {
    const newCategory: Category = {
      id: uuidv4(),
      name: createCategoryDto.name,
      description: createCategoryDto.description,
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  update(id: string, updateCategoryDto: UpdateCategoryDto): Category {
    const category = this.findOne(id);

    if (updateCategoryDto.name) category.name = updateCategoryDto.name;
    if (updateCategoryDto.description)
      category.description = updateCategoryDto.description;

    return category;
  }

  remove(id: string): void {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) {
      this.findOne(id);
    }
    this.categories.splice(index, 1);
  }
}
