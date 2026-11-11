import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deleteFakeImage,
  getFakeImage,
  isFakeProviders,
  putFakeImage,
} from '@/src/lib/fake-providers';

describe('fake providers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is off unless E2E_FAKE_PROVIDERS=1', () => {
    vi.stubEnv('E2E_FAKE_PROVIDERS', '');
    expect(isFakeProviders()).toBe(false);

    vi.stubEnv('E2E_FAKE_PROVIDERS', 'true');
    expect(isFakeProviders()).toBe(false);
  });

  it('turns on only when no real provider credentials are configured', () => {
    vi.stubEnv('E2E_FAKE_PROVIDERS', '1');
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('CLOUDINARY_API_SECRET', '');

    expect(isFakeProviders()).toBe(true);
  });

  it('refuses to run next to real credentials, so it can never be live in production', () => {
    vi.stubEnv('E2E_FAKE_PROVIDERS', '1');

    vi.stubEnv('OPENAI_API_KEY', 'sk-real');
    vi.stubEnv('CLOUDINARY_API_SECRET', '');
    expect(() => isFakeProviders()).toThrowError(/real provider credentials/);

    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'real-secret');
    expect(() => isFakeProviders()).toThrowError(/real provider credentials/);
  });

  it('stores and deletes fake images by public ID', () => {
    const { publicId, secureUrl } = putFakeImage(Buffer.from('img'), 'wig-ai');

    expect(secureUrl).toContain(publicId);
    expect(getFakeImage(publicId)?.buffer.toString()).toBe('img');

    deleteFakeImage(publicId);
    expect(getFakeImage(publicId)).toBeUndefined();
  });
});
