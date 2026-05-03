'use client';

import BaseImageUploader from '@/src/components/uploaders/BaseImageUploader';
import UploadedImagePreview from '@/src/components/uploaders/UploadedImagePreview';
import UploadRulesDialog from '@/src/components/uploaders/UploadRulesDialog';

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

export default function SelfieUploader({
  previewUrl,
  onFileReady,
  onRemove,
}: SelfieUploaderProps) {
  return (
    <div className="space-y-4">
      {!previewUrl && (
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
      )}

      {/* Image area */}
      <BaseImageUploader<File>
        preprocessFile={optimizeImageForUpload}
        onSuccess={onFileReady}
        showDropzone={!previewUrl}
      />

      {previewUrl && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            תמונתך
          </p>
          <UploadedImagePreview
            imageUrl={previewUrl}
            alt="Selfie preview"
            showRemoveButton
            onRemove={onRemove}
          />
        </div>
      )}
    </div>
  );
}
