// Client-side only — do not import from server components or API routes

let modelsLoaded = false;
let modelLoadFailed = false;

/**
 * Detects whether the image at the given blob URL contains exactly one human face.
 * Returns { blocked: true, message } if the image should be rejected,
 * or { blocked: false, message: '' } if it is acceptable.
 *
 * On model load failure the user is NOT blocked (fail-open).
 */
export async function validateFaceInImage(
  blobUrl: string,
): Promise<{ blocked: boolean; message: string }> {
  try {
    const faceapi = await import('face-api.js');

    if (!modelsLoaded && !modelLoadFailed) {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        modelsLoaded = true;
      } catch {
        modelLoadFailed = true;
        // Cannot load models — allow the user to proceed
        return { blocked: false, message: '' };
      }
    }

    if (modelLoadFailed) {
      return { blocked: false, message: '' };
    }

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = document.createElement('img');
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image for face detection'));
      el.src = blobUrl;
    });

    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
    );

    if (detections.length === 0) {
      return {
        blocked: true,
        message: 'לא זוהו פנים בתמונה. אנא העלה תמונת פנים ברורה.',
      };
    }

    if (detections.length > 1) {
      return {
        blocked: true,
        message: 'זוהו מספר אנשים בתמונה. אנא העלה תמונה של אדם אחד בלבד.',
      };
    }

    return { blocked: false, message: '' };
  } catch {
    // Unexpected error — fail-open so the user is not blocked
    return { blocked: false, message: '' };
  }
}
