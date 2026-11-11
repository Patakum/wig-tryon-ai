import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  buildCanvasImage,
  compositeHairOntoOriginal,
  computeCanvasLayout,
  toOpenAiMask,
} from '@/src/lib/mask-utils';

describe('computeCanvasLayout', () => {
  it('uses a portrait canvas for tall photos and keeps the aspect ratio', () => {
    const layout = computeCanvasLayout(901, 1600);

    expect(layout.size).toBe('1024x1536');
    expect(layout.contentWidth / layout.contentHeight).toBeCloseTo(901 / 1600, 1);
    expect(layout.contentLeft).toBeGreaterThan(0);
  });

  it('uses landscape and square canvases', () => {
    expect(computeCanvasLayout(678, 452).size).toBe('1536x1024');
    expect(computeCanvasLayout(1000, 1000).size).toBe('1024x1024');
  });
});

describe('mask and composite', () => {
  it('marks hair transparent and padding opaque for OpenAI', async () => {
    const layout = computeCanvasLayout(500, 1000);
    const gray = Buffer.alloc(layout.canvasWidth * layout.canvasHeight, 0);
    const hairIdx = layout.contentTop * layout.canvasWidth + layout.contentLeft;
    gray[hairIdx] = 255;

    const png = await toOpenAiMask(gray, layout);
    const { data } = await sharp(png).raw().toBuffer({ resolveWithObject: true });

    expect(data[hairIdx * 4 + 3]).toBe(0);
    expect(data[3]).toBe(255);
  });

  it('keeps original pixels outside the hair mask and generated pixels inside', async () => {
    const layout = computeCanvasLayout(200, 200);
    const red = { r: 255, g: 0, b: 0 };
    const blue = { r: 0, g: 0, b: 255 };
    const solid = (c: typeof red, w: number, h: number) =>
      sharp({ create: { width: w, height: h, channels: 3, background: c } })
        .png()
        .toBuffer();

    const original = await solid(red, layout.contentWidth, layout.contentHeight);
    const generated = await solid(blue, layout.canvasWidth, layout.canvasHeight);
    const hairGray = Buffer.alloc(layout.canvasWidth * layout.canvasHeight, 0);
    // Left half of the content area is "hair" (blocks avoid JPEG chroma bleed).
    for (let y = 0; y < layout.contentHeight; y++) {
      const row = (y + layout.contentTop) * layout.canvasWidth + layout.contentLeft;
      hairGray.fill(255, row, row + layout.contentWidth / 2);
    }

    const out = await compositeHairOntoOriginal({
      original,
      generated,
      hairGray,
      layout,
    });
    const { data } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    const w = layout.contentWidth;
    const at = (x: number, y: number, c: number) => data[(y * w + x) * 3 + c];

    expect(at(10, 100, 2)).toBeGreaterThan(215); // hair side is blue
    expect(at(10, 100, 0)).toBeLessThan(40);
    expect(at(w - 10, 100, 0)).toBeGreaterThan(215); // other side stays red
    expect(at(w - 10, 100, 2)).toBeLessThan(40);
  });

  it('pads the canvas to the exact canvas size', async () => {
    const layout = computeCanvasLayout(500, 1000);
    const content = await sharp({
      create: {
        width: layout.contentWidth,
        height: layout.contentHeight,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const meta = await sharp(await buildCanvasImage(content, layout)).metadata();

    expect([meta.width, meta.height]).toEqual([layout.canvasWidth, layout.canvasHeight]);
  });
});
