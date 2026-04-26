import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Guards', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('JwtAuthGuard', () => {
    let jwtService: JwtService;
    let guard: JwtAuthGuard;

    beforeEach(() => {
      jwtService = { verifyAsync: vi.fn() } as any;
      guard = new JwtAuthGuard(jwtService, reflector);
    });

    it('should throw UnauthorizedException if no token', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = {
        switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as any;
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      vi.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error());
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'Bearer invalid' } }),
        }),
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as any;
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;
    beforeEach(() => {
      guard = new RolesGuard(reflector);
    });

    it('should return true if user has required role', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'ADMIN' } }),
        }),
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as any;
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
