import sharp from 'sharp';

/**
 * Sizes supported by the OpenAI image edit endpoint. The selfie is placed on
 * the canvas that best matches its aspect ratio so it is never squashed.
 */
const CANVAS_SIZES = {
  square: { width: 1024, height: 1024 },
  portrait: { width: 1024, height: 1536 },
  landscape: { width: 1536, height: 1024 },
} as const;

export type CanvasLayout = {
  canvasWidth: number;
  canvasHeight: number;
  contentLeft: number;
  contentTop: number;
  contentWidth: number;
  contentHeight: number;
  size: '1024x1024' | '1024x1536' | '1536x1024';
};

export function computeCanvasLayout(
  imageWidth: number,
  imageHeight: number,
): CanvasLayout {
  const ratio = imageWidth / imageHeight;
  const canvas =
    ratio > 1.15
      ? CANVAS_SIZES.landscape
      : ratio < 0.87
        ? CANVAS_SIZES.portrait
        : CANVAS_SIZES.square;

  const scale = Math.min(canvas.width / imageWidth, canvas.height / imageHeight);
  const contentWidth = Math.min(canvas.width, Math.round(imageWidth * scale));
  const contentHeight = Math.min(canvas.height, Math.round(imageHeight * scale));

  return {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    contentWidth,
    contentHeight,
    contentLeft: Math.floor((canvas.width - contentWidth) / 2),
    contentTop: Math.floor((canvas.height - contentHeight) / 2),
    size: `${canvas.width}x${canvas.height}` as CanvasLayout['size'],
  };
}

/**
 * Applies EXIF orientation and returns the oriented image buffer with its
 * dimensions, so layout and mask are computed on what the user actually sees.
 */
export async function orientImage(
  input: Buffer,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(input)
    .rotate()
    .png()
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, width: info.width, height: info.height };
}

/** The selfie scaled to its content rectangle (no padding). */
export function resizeToContent(
  oriented: Buffer,
  layout: CanvasLayout,
): Promise<Buffer> {
  return sharp(oriented)
    .resize(layout.contentWidth, layout.contentHeight, { fit: 'fill' })
    .png()
    .toBuffer();
}

/** The selfie placed on the canvas; padding repeats the edge pixels. */
export function buildCanvasImage(
  content: Buffer,
  layout: CanvasLayout,
): Promise<Buffer> {
  return sharp(content)
    .extend({
      top: layout.contentTop,
      bottom: layout.canvasHeight - layout.contentHeight - layout.contentTop,
      left: layout.contentLeft,
      right: layout.canvasWidth - layout.contentWidth - layout.contentLeft,
      extendWith: 'copy',
    })
    .png()
    .toBuffer();
}

/**
 * Fetches a segmentation mask (white = hair) and returns a single-channel
 * raw grayscale buffer at canvas size. The mask is binarised, grown by
 * `growRatio` of the image width so the new hairstyle has room to sit, then
 * feathered. Padding areas are always 0 (never edited).
 */
export async function buildHairMaskGray(
  maskUrl: string,
  layout: CanvasLayout,
  options: { growRatio?: number; featherRatio?: number } = {},
): Promise<Buffer> {
  const { growRatio = 0.03, featherRatio = 0.006 } = options;

  const response = await fetch(maskUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch segmentation mask (${response.status})`);
  }
  const inputBuffer = Buffer.from(await response.arrayBuffer());

  const growSigma = Math.max(1, layout.contentWidth * growRatio);
  const featherSigma = Math.max(0.5, layout.contentWidth * featherRatio);

  const grown = await sharp(inputBuffer)
    .rotate()
    .resize(layout.contentWidth, layout.contentHeight, { fit: 'fill' })
    .grayscale()
    .threshold(128)
    .blur(growSigma)
    .threshold(40)
    .blur(featherSigma)
    .png()
    .toBuffer();

  const { data } = await sharp(grown)
    .extend({
      top: layout.contentTop,
      bottom: layout.canvasHeight - layout.contentHeight - layout.contentTop,
      left: layout.contentLeft,
      right: layout.canvasWidth - layout.contentWidth - layout.contentLeft,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return data;
}

/**
 * Converts the grayscale hair mask to OpenAI's convention:
 * transparent (alpha 0) = edit, opaque (alpha 255) = preserve.
 */
export function toOpenAiMask(
  hairGray: Buffer,
  layout: CanvasLayout,
): Promise<Buffer> {
  const { canvasWidth: width, canvasHeight: height } = layout;
  const rgba = Buffer.alloc(width * height * 4, 0);

  for (let i = 0; i < hairGray.length; i++) {
    rgba[i * 4 + 3] = 255 - hairGray[i];
  }

  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * Takes the generated hair from the model output and keeps every other pixel
 * from the original photo, so the face, skin and background stay identical.
 * Returns a JPEG at the original content size (no padding).
 */
export async function compositeHairOntoOriginal(params: {
  original: Buffer;
  generated: Buffer;
  hairGray: Buffer;
  layout: CanvasLayout;
}): Promise<Buffer> {
  const { original, generated, hairGray, layout } = params;
  const { contentWidth: w, contentHeight: h } = layout;

  const [origRaw, genRaw] = await Promise.all([
    sharp(original).removeAlpha().raw().toBuffer(),
    sharp(generated)
      .resize(layout.canvasWidth, layout.canvasHeight, { fit: 'fill' })
      .extract({
        left: layout.contentLeft,
        top: layout.contentTop,
        width: w,
        height: h,
      })
      .removeAlpha()
      .raw()
      .toBuffer(),
  ]);

  const out = Buffer.alloc(w * h * 3);

  for (let y = 0; y < h; y++) {
    const maskRow = (y + layout.contentTop) * layout.canvasWidth + layout.contentLeft;
    for (let x = 0; x < w; x++) {
      const alpha = hairGray[maskRow + x] / 255;
      const p = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) {
        out[p + c] = Math.round(origRaw[p + c] * (1 - alpha) + genRaw[p + c] * alpha);
      }
    }
  }

  return sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .jpeg({ quality: 92 })
    .toBuffer();
}
