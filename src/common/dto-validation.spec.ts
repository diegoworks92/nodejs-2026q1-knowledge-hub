import { CreateUserDto } from '../user/dto/create-user.dto';
import { validate } from 'class-validator';
import { describe, it, expect } from 'vitest';

describe('DTO Validation', () => {
  it('should fail if CreateUserDto is empty', async () => {
    const dto = new CreateUserDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass if CreateUserDto is valid', async () => {
    const dto = new CreateUserDto();
    dto.login = 'diego123';
    dto.password = 'password123';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
