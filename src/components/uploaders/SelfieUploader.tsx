'use client';

import { useState } from 'react';
import BaseImageUploader from '@/src/components/uploaders/BaseImageUploader';
import UploadedImagePreview from '@/src/components/uploaders/UploadedImagePreview';
import UploadRulesDialog from '@/src/components/uploaders/UploadRulesDialog';
import FaceCapture from './FaceCapture';
import {
  analyzeSelfie,
  convertHeicToJpeg,
  isHeicFile,
  PhotoRejectedError,
} from '@/src/lib/photo-checks';
import { Button } from '@/src/components/ui/button';

type SelfieUploaderProps = {
  previewUrl: string | null;
  onFileReady: (file: File) => void;
  onRemove: () => void;
};

async function optimizeImageForUpload(file: File): Promise<File> {
  if (file.size <= 2 * 1024 * 1024) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = document.createElement('img');
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to read image'));
      el.src = objectUrl;
    });

    const maxDimension = 1600;
    const scale = Math.min(
      maxDimension / img.width,
      maxDimension / img.height,
      1,
    );
    const targetWidth = Math.max(1, Math.round(img.width * scale));
    const targetHeight = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.82);
    });

    if (!blob) {
      return file;
    }

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

type InputMode = 'upload' | 'camera';

export default function SelfieUploader({
  previewUrl,
  onFileReady,
  onRemove,
}: SelfieUploaderProps) {
  const [mode, setMode] = useState<InputMode>('upload');
  const [warnings, setWarnings] = useState<string[]>([]);

  // Convert HEIC, shrink large files, then coach on brightness and framing.
  // Clear failures reject the file; borderline ones are shown as warnings the
  // customer can ignore or fix by replacing the photo.
  const prepareUpload = async (file: File): Promise<File> => {
    setWarnings([]);

    const converted = isHeicFile(file) ? await convertHeicToJpeg(file) : file;
    const optimized = await optimizeImageForUpload(converted);
    const issues = await analyzeSelfie(optimized);

    const blocking = issues.find((issue) => issue.severity === 'block');
    if (blocking) {
      throw new PhotoRejectedError(blocking.message);
    }

    setWarnings(
      issues.filter((issue) => issue.severity === 'warn').map((i) => i.message),
    );

    return optimized;
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {!previewUrl && (
        <div className="flex gap-2">
          <Button
            variant={mode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('upload')}
          >
            העלה תמונה
          </Button>
          <Button
            variant={mode === 'camera' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('camera')}
          >
            צלם סלפי
          </Button>
        </div>
      )}

      {!previewUrl && mode === 'upload' && (
        <>
          <UploadRulesDialog
            title="איך להעלות סלפי נכון"
            description="תמונה טובה תשפר משמעותית את איכות התוצאה של הדמיית הפאה."
            rules={[
              'פנים קדמיות וברורות, אדם אחד בלבד בתמונה.',
              'תאורה טובה ואחידה, בלי צללים חזקים על הפנים.',
              'ללא מסכה, משקפי שמש או הסתרה של קו השיער.',
              'רקע נקי ככל האפשר וללא מסיחים מרכזיים.',
              'רזולוציה מומלצת: לפחות 640px בצד הקצר.',
            ]}
          />
          <BaseImageUploader<File>
            allowHeic
            preprocessFile={prepareUpload}
            onSuccess={onFileReady}
          />
        </>
      )}

      {!previewUrl && mode === 'camera' && (
        <FaceCapture
          onCapture={(file) => {
            setWarnings([]);
            onFileReady(file);
          }}
        />
      )}

      {previewUrl && (
        <div className="flex-1 min-h-0 flex flex-col">
          <p className="mb-2 text-sm font-medium text-muted-foreground shrink-0">
            תמונתך
          </p>
          {warnings.length > 0 && (
            <div
              role="status"
              className="mb-2 shrink-0 rounded bg-amber-100 p-2 text-sm text-amber-900"
            >
              <p className="font-medium">אפשר להמשיך, אבל כדאי לשפר:</p>
              <ul className="list-disc ps-5">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <p className="mt-1">להחלפת התמונה לחצי על הסרה.</p>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <UploadedImagePreview
              imageUrl={previewUrl}
              alt="Selfie preview"
              className="h-full"
              showRemoveButton
              onRemove={() => {
                setWarnings([]);
                onRemove();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
