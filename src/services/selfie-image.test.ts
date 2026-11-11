import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { normalizeSelfie } from '@/src/services/selfie-image';
import { PHOTO_RULES } from '@/src/lib/photo-quality';

function solid(width: number, height: number, gray: number) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: gray, g: gray, b: gray },
    },
  });
}

describe('normalizeSelfie', () => {
  it('accepts a normal photo and returns a JPEG', async () => {
    const input = await solid(800, 1000, 128).png().toBuffer();

    const output = await normalizeSelfie(input);
    const meta = await sharp(output).metadata();

    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(1000);
  });

  it('rotates pixels upright from the EXIF orientation and drops the tag', async () => {
    // Stored landscape 1000x800 with "rotate 90 degrees" => upright 800x1000.
    const input = await solid(1000, 800, 128)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    expect((await sharp(input).metadata()).orientation).toBe(6);

    const meta = await sharp(await normalizeSelfie(input)).metadata();

    expect(meta.width).toBe(800);
    expect(meta.height).toBe(1000);
    expect(meta.orientation ?? 1).toBe(1);
  });

  it('strips EXIF data such as GPS coordinates', async () => {
    const input = await solid(800, 800, 128)
      .jpeg()
      .withExif({
        IFD0: { Make: 'TestPhone' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '32/1 4/1 0/1' },
      })
      .toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const meta = await sharp(await normalizeSelfie(input)).metadata();

    expect(meta.exif).toBeUndefined();
  });

  it('checks the upright size, not the stored size, against the minimum', async () => {
    // Stored 1000x500 rotated => 500x1000: short side 500 < 640.
    const input = await solid(1000, 500, 128)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    await expect(normalizeSelfie(input)).rejects.toMatchObject({
      status: 400,
      code: 'PHOTO_TOO_SMALL',
    });
  });

  it('rejects images that are too small', async () => {
    const input = await solid(400, 400, 128).jpeg().toBuffer();

    await expect(normalizeSelfie(input)).rejects.toMatchObject({
      code: 'PHOTO_TOO_SMALL',
    });
  });

  it('rejects nearly black and blown-out photos but not merely dim ones', async () => {
    await expect(
      normalizeSelfie(await solid(800, 800, 5).jpeg().toBuffer()),
    ).rejects.toMatchObject({ code: 'PHOTO_TOO_DARK' });
    await expect(
      normalizeSelfie(await solid(800, 800, 252).jpeg().toBuffer()),
    ).rejects.toMatchObject({ code: 'PHOTO_TOO_BRIGHT' });

    // Dim-but-usable photos are only warned about in the browser.
    await expect(
      normalizeSelfie(await solid(800, 800, 50).jpeg().toBuffer()),
    ).resolves.toBeInstanceOf(Buffer);
  });

  it('rejects non-images, unsupported formats and oversize or empty files', async () => {
    await expect(
      normalizeSelfie(Buffer.from('<script>alert(1)</script>')),
    ).rejects.toMatchObject({ code: 'PHOTO_UNREADABLE' });
    await expect(
      normalizeSelfie(await solid(800, 800, 128).gif().toBuffer()),
    ).rejects.toMatchObject({ code: 'PHOTO_UNSUPPORTED_FORMAT' });
    await expect(normalizeSelfie(Buffer.alloc(0))).rejects.toMatchObject({
      code: 'PHOTO_TOO_LARGE',
    });
    await expect(
      normalizeSelfie(Buffer.alloc(PHOTO_RULES.maxBytes + 1)),
    ).rejects.toMatchObject({ code: 'PHOTO_TOO_LARGE' });
  });

  it('flattens transparency onto white instead of black', async () => {
    const input = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();

    // Fully transparent becomes white, which is then rejected as blown out
    // rather than mistaken for a black image.
    await expect(normalizeSelfie(input)).rejects.toMatchObject({
      code: 'PHOTO_TOO_BRIGHT',
    });
  });
});
