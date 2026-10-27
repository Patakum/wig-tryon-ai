// Shared by the browser (coaching before upload) and the server (enforcement).
// Keep this file free of DOM and Node-only imports.

export const PHOTO_RULES = {
  maxBytes: 10 * 1024 * 1024,
  minShortSide: 640,
  // Mean luminance on a 0-255 scale. Outside the hard range the photo is
  // unusable; outside the warn range it is merely poor.
  hardMinBrightness: 25,
  hardMaxBrightness: 240,
  warnMinBrightness: 70,
  warnMaxBrightness: 200,
  // Detected face width as a share of the image width.
  faceMinWidthRatio: 0.18,
  faceMaxWidthRatio: 0.8,
  // Face centre distance from the image centre, as a share of image width.
  faceMaxOffsetRatio: 0.2,
} as const;

export type PhotoIssueSeverity = 'block' | 'warn';

export type PhotoIssue = {
  severity: PhotoIssueSeverity;
  code:
    | 'too_small'
    | 'too_dark'
    | 'too_bright'
    | 'dark'
    | 'bright'
    | 'no_face'
    | 'multiple_faces'
    | 'face_small'
    | 'face_large'
    | 'face_off_center';
  message: string;
};

export type FaceBox = { x: number; y: number; width: number; height: number };

export type PhotoMeasurements = {
  width: number;
  height: number;
  meanLuminance: number;
  // undefined when face detection was unavailable (fail open).
  face?: { count: number; box?: FaceBox };
};

export function evaluatePhotoQuality(m: PhotoMeasurements): PhotoIssue[] {
  const issues: PhotoIssue[] = [];

  if (Math.min(m.width, m.height) < PHOTO_RULES.minShortSide) {
    issues.push({
      severity: 'block',
      code: 'too_small',
      message: `התמונה קטנה מדי. נדרשת רזולוציה של לפחות ${PHOTO_RULES.minShortSide}px בצד הקצר.`,
    });
  }

  if (m.meanLuminance < PHOTO_RULES.hardMinBrightness) {
    issues.push({
      severity: 'block',
      code: 'too_dark',
      message: 'התמונה חשוכה מדי. צלמי במקום מואר או הדליקי אור.',
    });
  } else if (m.meanLuminance > PHOTO_RULES.hardMaxBrightness) {
    issues.push({
      severity: 'block',
      code: 'too_bright',
      message: 'התמונה בהירה מדי. הימנעי מאור חזק ישירות על הפנים.',
    });
  } else if (m.meanLuminance < PHOTO_RULES.warnMinBrightness) {
    issues.push({
      severity: 'warn',
      code: 'dark',
      message: 'התמונה די כהה. תאורה טובה תשפר את התוצאה.',
    });
  } else if (m.meanLuminance > PHOTO_RULES.warnMaxBrightness) {
    issues.push({
      severity: 'warn',
      code: 'bright',
      message: 'התמונה די בהירה. נסי להימנע מאור חזק מדי.',
    });
  }

  if (m.face) {
    if (m.face.count === 0) {
      issues.push({
        severity: 'block',
        code: 'no_face',
        message: 'לא זוהו פנים בתמונה. אנא העלי תמונת פנים ברורה.',
      });
    } else if (m.face.count > 1) {
      issues.push({
        severity: 'block',
        code: 'multiple_faces',
        message: 'זוהו מספר אנשים בתמונה. אנא העלי תמונה של אדם אחד בלבד.',
      });
    } else if (m.face.box) {
      const { box } = m.face;
      const widthRatio = box.width / m.width;
      const offsetRatio =
        Math.abs(box.x + box.width / 2 - m.width / 2) / m.width;

      if (widthRatio < PHOTO_RULES.faceMinWidthRatio) {
        issues.push({
          severity: 'warn',
          code: 'face_small',
          message: 'הפנים נראים קטנים. התקרבי למצלמה לתוצאה טובה יותר.',
        });
      } else if (widthRatio > PHOTO_RULES.faceMaxWidthRatio) {
        issues.push({
          severity: 'warn',
          code: 'face_large',
          message: 'הפנים קרובים מדי. התרחקי מעט כך שגם השיער ייראה.',
        });
      }

      if (offsetRatio > PHOTO_RULES.faceMaxOffsetRatio) {
        issues.push({
          severity: 'warn',
          code: 'face_off_center',
          message: 'הפנים לא במרכז התמונה. מרכזי את הפנים במסגרת.',
        });
      }
    }
  }

  return issues;
}
