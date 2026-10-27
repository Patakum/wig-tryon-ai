import { describe, expect, it } from 'vitest';
import { getPublicIdFromUrl } from '@/src/lib/cloudinary-utils';

describe('getPublicIdFromUrl', () => {
  it('extracts a foldered public id without version or extension', () => {
    expect(
      getPublicIdFromUrl(
        'https://res.cloudinary.com/demo/image/upload/v1712345678/wig-ai/abc123.jpg',
      ),
    ).toBe('wig-ai/abc123');
  });

  it('works without a version segment', () => {
    expect(
      getPublicIdFromUrl(
        'https://res.cloudinary.com/demo/image/upload/generations/xyz.png',
      ),
    ).toBe('generations/xyz');
  });

  it('rejects other hosts, protocols and malformed urls', () => {
    expect(getPublicIdFromUrl('https://evil.example/image/upload/v1/a.jpg')).toBeNull();
    expect(getPublicIdFromUrl('http://res.cloudinary.com/demo/image/upload/v1/a.jpg')).toBeNull();
    expect(getPublicIdFromUrl('not a url')).toBeNull();
    expect(getPublicIdFromUrl('https://res.cloudinary.com/demo/image/fetch/a.jpg')).toBeNull();
  });
});
