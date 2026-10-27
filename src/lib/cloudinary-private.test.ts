import { afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.CLOUDINARY_CLOUD_NAME = 'demo';
  process.env.CLOUDINARY_API_KEY = 'key';
  process.env.CLOUDINARY_API_SECRET = 'secret';
});

import {
  fetchStoredImage,
  getSignedPrivateUrl,
} from '@/src/lib/cloudinary-utils';

describe('private image delivery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds a signed authenticated URL from the public ID only', () => {
    const url = new URL(getSignedPrivateUrl('wig-ai/abc'));

    expect(url.hostname).toBe('res.cloudinary.com');
    expect(url.pathname).toMatch(
      /^\/demo\/image\/authenticated\/s--[\w-]{8}--\/(v\d+\/)?wig-ai\/abc/,
    );
  });

  it('fetches private images with the signed URL, not the stored link', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('img', { headers: { 'content-type': 'image/jpeg' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchStoredImage({
      imageUrl: 'https://res.cloudinary.com/demo/image/authenticated/v1/wig-ai/abc.jpg',
      publicId: 'wig-ai/abc',
    });

    const requested = String(fetchMock.mock.calls[0][0]);
    expect(requested).toContain('/image/authenticated/s--');
  });

  it('still serves legacy public rows from their stored URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('img', { headers: { 'content-type': 'image/jpeg' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const legacy = 'https://res.cloudinary.com/demo/image/upload/v1/wig-ai/old.jpg';

    await fetchStoredImage({ imageUrl: legacy, publicId: null });

    expect(String(fetchMock.mock.calls[0][0])).toBe(legacy);
  });

  it('refuses rows with no reference and non-Cloudinary hosts', async () => {
    await expect(
      fetchStoredImage({ imageUrl: null, publicId: null }),
    ).rejects.toMatchObject({ status: 502 });
    await expect(
      fetchStoredImage({ imageUrl: 'https://evil.example/a.jpg', publicId: null }),
    ).rejects.toMatchObject({ status: 502 });
  });
});
