import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto';

interface JwtPayload {
  userId: string;
  login: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });
    if (existing) {
      throw new BadRequestException('Login is already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        role: 'VIEWER',
      },
    });

    return { message: 'User created successfully', userId: user.id };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });
    if (!user) {
      throw new ForbiddenException('Authentication failed');
    }

    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) {
      throw new ForbiddenException('Authentication failed');
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      login: user.login,
      role: user.role.toLowerCase(),
    });

    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    const matches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!matches) throw new ForbiddenException('Access Denied');

    const tokens = await this.generateTokens({
      userId: user.id,
      login: user.login,
      role: user.role.toLowerCase(),
    });

    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  private async generateTokens(payload: JwtPayload) {
    const tokenPayload = {
      userId: payload.userId,
      login: payload.login,
      role: payload.role.toLowerCase(),
    };

    const accessToken = await this.jwt.signAsync(tokenPayload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwt.signAsync(tokenPayload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
