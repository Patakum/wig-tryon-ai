import sharp from 'sharp';
import { throwApiError } from '@/src/lib/api/errors';
import { evaluatePhotoQuality, PHOTO_RULES } from '@/src/lib/photo-quality';

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);
const MAX_OUTPUT_DIMENSION = 2048;

function reject(code: string, message: string): never {
  throwApiError(400, code, message);
}

/**
 * The server-side gate for customer selfies. Validates the real file
 * content, rotates the pixels upright from the EXIF orientation, strips all
 * metadata (including GPS) and returns a clean JPEG. Face and framing checks
 * stay in the browser; these rules cannot be bypassed by calling the API.
 */
export async function normalizeSelfie(input: Buffer): Promise<Buffer> {
  if (input.length === 0 || input.length > PHOTO_RULES.maxBytes) {
    reject('PHOTO_TOO_LARGE', 'התמונה גדולה מדי. הגודל המרבי הוא 10MB.');
  }

  let format: string | undefined;
  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(input).metadata();
    format = meta.format;
    // EXIF orientations 5-8 swap width and height once rotated upright.
    const swapped = (meta.orientation ?? 1) >= 5;
    width = (swapped ? meta.height : meta.width) ?? 0;
    height = (swapped ? meta.width : meta.height) ?? 0;
  } catch {
    reject('PHOTO_UNREADABLE', 'לא ניתן לקרוא את התמונה. נסי תמונה אחרת.');
  }

  if (format === 'heif') {
    reject(
      'PHOTO_UNSUPPORTED_FORMAT',
      'פורמט HEIC אינו נתמך. נסי לבחור את התמונה שוב, או שמרי אותה כ-JPEG.',
    );
  }

  if (!format || !ALLOWED_FORMATS.has(format)) {
    reject(
      'PHOTO_UNSUPPORTED_FORMAT',
      'פורמט התמונה אינו נתמך. השתמשי ב-JPEG, PNG או WebP.',
    );
  }

  let output: { data: Buffer; info: sharp.OutputInfo };
  let meanLuminance: number;

  try {
    // rotate() with no arguments applies EXIF orientation; sharp drops all
    // metadata unless withMetadata() is called.
    const upright = sharp(input)
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize({
        width: MAX_OUTPUT_DIMENSION,
        height: MAX_OUTPUT_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 });

    output = await upright.toBuffer({ resolveWithObject: true });

    const stats = await sharp(output.data)
      .resize(64, 64, { fit: 'inside' })
      .greyscale()
      .stats();
    meanLuminance = stats.channels[0].mean;
  } catch {
    reject('PHOTO_UNREADABLE', 'לא ניתן לעבד את התמונה. נסי תמונה אחרת.');
  }

  // Measure the original (upright) size: the output may be capped smaller.
  const blocking = evaluatePhotoQuality({ width, height, meanLuminance }).find((issue) => issue.severity === 'block');

  if (blocking) {
    reject(`PHOTO_${blocking.code.toUpperCase()}`, blocking.message);
  }

  return output.data;
}
