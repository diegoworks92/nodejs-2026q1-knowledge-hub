import { CreateArticleDto } from './create-article.dto';
import { validate } from 'class-validator';
import { describe, it, expect } from 'vitest';

describe('CreateArticleDto', () => {
  it('should fail if title is missing', async () => {
    const dto = new CreateArticleDto();
    dto.content = 'Some content';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('title');
  });

  it('should pass with valid data', async () => {
    const dto = new CreateArticleDto();
    dto.title = 'Valid Title';
    dto.content = 'Valid content';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
