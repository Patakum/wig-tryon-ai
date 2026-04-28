'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import BaseImageUploader from '@/src/components/uploaders/BaseImageUploader';
import UploadedImagePreview from '@/src/components/uploaders/UploadedImagePreview';
import UploadRulesDialog from '@/src/components/uploaders/UploadRulesDialog';

type SelfieUploaderProps = {
  wigId: string;
};

async function optimizeImageForUpload(file: File): Promise<File> {
  if (file.size <= 2 * 1024 * 1024) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
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

export default function SelfieUploader({ wigId }: SelfieUploaderProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileReady = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await axios.post('/api/upload', formData);
      router.push(`/preview?photoId=${res.data.photoId}&wigId=${wigId}`);
    } catch {
      setSubmitError('העלאה נכשלה. אנא נסה שנית.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div>
      <div className="mb-4">
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
      </div>

      <BaseImageUploader<File>
        preprocessFile={optimizeImageForUpload}
        onSuccess={handleFileReady}
        showDropzone={!previewUrl}
      />

      {previewUrl ? (
        <div className="mt-4">
          <UploadedImagePreview
            imageUrl={previewUrl}
            showRemoveButton
            onRemove={handleRemove}
          />

          <Button
            className="mt-4"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'מעלה...' : 'המשך לתוצאה'}
          </Button>

          {submitError ? (
            <p className="mt-2 text-sm text-red-600">{submitError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
