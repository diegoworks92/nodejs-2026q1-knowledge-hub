import { ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { describe, it, expect } from 'vitest';

describe('ParseUUIDPipe', () => {
  const pipe = new ParseUUIDPipe();

  it('should pass a valid UUID', async () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(await pipe.transform(uuid, { type: 'param' })).toBe(uuid);
  });

  it('should throw BadRequestException on invalid UUID', async () => {
    await expect(
      pipe.transform('invalid-uuid', { type: 'param' }),
    ).rejects.toThrow(BadRequestException);
  });
});
