import { describe, expect, it } from 'vitest';
import { feedbackSchema } from '@/src/lib/api/parse';

describe('feedbackSchema', () => {
  it('trims and accepts messages up to 1000 characters', () => {
    expect(
      feedbackSchema.parse({ generationId: 'g1', message: '  hello  ' }).message,
    ).toBe('hello');
    expect(
      feedbackSchema.safeParse({ generationId: 'g1', message: 'a'.repeat(1000) })
        .success,
    ).toBe(true);
  });

  it('rejects empty and over-long messages', () => {
    expect(
      feedbackSchema.safeParse({ generationId: 'g1', message: '   ' }).success,
    ).toBe(false);
    expect(
      feedbackSchema.safeParse({ generationId: 'g1', message: 'a'.repeat(1001) })
        .success,
    ).toBe(false);
  });
});
