// Client-side only — do not import from server components or API routes
import type { FaceBox } from '@/src/lib/photo-quality';

let modelsLoaded = false;
let modelLoadFailed = false;

export type FaceDetectionResult = {
  count: number;
  box?: FaceBox;
};

function loadImage(blobUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('img');
    el.onload = () => resolve(el);
    el.onerror = () =>
      reject(new Error('Failed to load image for face detection'));
    el.src = blobUrl;
  });
}

/**
 * Detects faces in the image at the given blob URL. Returns null when
 * detection is unavailable (model failed to load or an unexpected error), so
 * callers can fail open instead of blocking the customer.
 */
export async function detectFaces(
  blobUrl: string,
): Promise<FaceDetectionResult | null> {
  try {
    const faceapi = await import('face-api.js');

    if (!modelsLoaded && !modelLoadFailed) {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        modelsLoaded = true;
      } catch {
        modelLoadFailed = true;
      }
    }

    if (modelLoadFailed) {
      return null;
    }

    const img = await loadImage(blobUrl);
    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
    );

    if (detections.length !== 1) {
      return { count: detections.length };
    }

    const { x, y, width, height } = detections[0].box;

    return { count: 1, box: { x, y, width, height } };
  } catch {
    return null;
  }
}

/**
 * Checks that the image at the given blob URL contains exactly one face.
 * Returns { blocked: true, message } if the image should be rejected.
 * Fails open when detection is unavailable.
 */
export async function validateFaceInImage(
  blobUrl: string,
): Promise<{ blocked: boolean; message: string }> {
  const result = await detectFaces(blobUrl);

  if (!result) {
    return { blocked: false, message: '' };
  }

  if (result.count === 0) {
    return {
      blocked: true,
      message: 'לא זוהו פנים בתמונה. אנא העלה תמונת פנים ברורה.',
    };
  }

  if (result.count > 1) {
    return {
      blocked: true,
      message: 'זוהו מספר אנשים בתמונה. אנא העלה תמונה של אדם אחד בלבד.',
    };
  }

  return { blocked: false, message: '' };
}
