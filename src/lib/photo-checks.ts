// Client-side only — uses DOM canvas APIs and lazy-loads the HEIC converter.
import { detectFaces } from '@/src/lib/face-detection';
import {
  evaluatePhotoQuality,
  type PhotoIssue,
} from '@/src/lib/photo-quality';

export class PhotoRejectedError extends Error {}

const HEIC_NAME = /\.(heic|heif)$/i;

export function isHeicFile(file: File): boolean {
  return /^image\/hei[cf]/i.test(file.type) || HEIC_NAME.test(file.name);
}

// iPhones can produce HEIC. Browsers cannot preview it and the server only
// accepts JPEG/PNG/WebP, so convert it here. The ~3MB converter is loaded
// only when such a file is picked.
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const { heicTo } = await import('heic-to');
    const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 });

    return new File([blob], file.name.replace(HEIC_NAME, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    throw new PhotoRejectedError(
      'לא הצלחנו לקרוא את תמונת ה-HEIC. נסי לשמור אותה כ-JPEG או לבחור תמונה אחרת.',
    );
  }
}

async function measureBrightness(bitmap: ImageBitmap): Promise<number> {
  const size = 64;
  const scale = Math.min(size / bitmap.width, size / bitmap.height, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return 128;
  }

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  return total / (data.length / 4);
}

/**
 * Measures an (already upright, JPEG/PNG/WebP) photo and returns coaching
 * issues. The server enforces the hard rules again; this gives fast feedback.
 */
export async function analyzeSelfie(file: File): Promise<PhotoIssue[]> {
  const url = URL.createObjectURL(file);

  try {
    // 'from-image' applies the EXIF orientation so measurements match what
    // the customer sees.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });

    const [meanLuminance, face] = await Promise.all([
      measureBrightness(bitmap),
      detectFaces(url),
    ]);

    const issues = evaluatePhotoQuality({
      width: bitmap.width,
      height: bitmap.height,
      meanLuminance,
      face: face ?? undefined,
    });

    bitmap.close();

    return issues;
  } catch {
    // If the browser cannot decode it, the server gets the final say.
    return [];
  } finally {
    URL.revokeObjectURL(url);
  }
}
