import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-user.dto';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  private sanitize(user: User): User {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  findAll(): User[] {
    return this.users.map((user) => this.sanitize(user));
  }

  findOne(id: string): User {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: uuidv4(),
      login: createUserDto.login,
      password: createUserDto.password,
      role: createUserDto.role || 'viewer',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.users.push(newUser);
    return this.sanitize(newUser);
  }

  updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): User {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }

    const user = this.users.find((u) => u.id === id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Old password is wrong');
    }

    user.password = updatePasswordDto.newPassword;
    user.version++;
    user.updatedAt = Date.now();

    return this.sanitize(user);
  }

  remove(id: string): void {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid userId (not uuid)');
    }
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new NotFoundException('User not found');
    }
    this.articleService.nullifyAuthor(id);
    this.commentService.removeByUser(id);
    this.users.splice(userIndex, 1);
  }
}
