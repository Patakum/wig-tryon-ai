import sharp from 'sharp';

// A plain 800x1000 gradient photo. It passes the server's size and
// brightness rules; the browser's face check is skipped in tests (the model
// files are blocked, and that check fails open by design).
export async function makeSelfie(): Promise<Buffer> {
  const width = 800;
  const height = 1000;
  const pixels = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3;
      pixels[offset] = 110 + Math.round((x / width) * 60);
      pixels[offset + 1] = 100 + Math.round((y / height) * 60);
      pixels[offset + 2] = 120;
    }
  }

  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 85 })
    .toBuffer();
}
