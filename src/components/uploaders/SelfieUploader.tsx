'use client';

import { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { cn } from '@/src/lib/utils';
import BaseImageUploader from '@/src/components/uploaders/BaseImageUploader';
import UploadedImagePreview from '@/src/components/uploaders/UploadedImagePreview';
import UploadRulesDialog from '@/src/components/uploaders/UploadRulesDialog';
import GenerateButton from '@/src/components/GenerateButton';

type SelfieUploaderProps = {
  wigId: string;
  wigImageUrl: string;
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
  wigId,
  wigImageUrl,
}: SelfieUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const wigVisible = !!previewUrl;

  const handleFileReady = async (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPhotoId(null);
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/upload', formData);
      setPhotoId(res.data.photoId);
    } catch {
      setUploadError('העלאה נכשלה. אנא נסה שנית.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoId(null);
    setUploadError(null);
  };

  return (
    <div className="space-y-4">
      <div>
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

      {previewUrl && (
        <div className="flex items-start gap-6">
          {/* Selfie — shrinks naturally as wig expands */}
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              תמונתך
            </p>
            <UploadedImagePreview
              imageUrl={previewUrl}
              alt="Selfie preview"
              showRemoveButton
              onRemove={handleRemove}
            />
          </div>

          {/* Wig — slides in from the right */}
          <div
            className={cn(
              'overflow-hidden transition-[max-width,opacity] duration-500 ease-in-out',
              wigVisible ? 'max-w-[50%] opacity-100' : 'max-w-0 opacity-0',
            )}
          >
            <div
              className={cn(
                'transition-transform duration-500 ease-in-out',
                wigVisible ? 'translate-x-0' : 'translate-x-full',
              )}
            >
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                הפאה שנבחרה
              </p>
              <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
                <Image
                  src={wigImageUrl}
                  width={500}
                  height={500}
                  alt="Selected wig"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status + Generate */}
      <div className="flex items-center justify-between">
        {isUploading && (
          <p className="text-sm text-muted-foreground">שומר תמונה...</p>
        )}
        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}
        {photoId && !isUploading && (
          <div
            className={cn(
              'ml-auto transition-all duration-500 ease-in-out',
              photoId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            )}
          >
            <GenerateButton photoId={photoId} wigId={wigId} />
          </div>
        )}
      </div>
    </div>
  );
}
