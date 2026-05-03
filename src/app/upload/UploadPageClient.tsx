'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/src/lib/utils';
import SelfieUploader from '@/src/components/uploaders/SelfieUploader';
import SelfieSubmitButton from '@/src/components/uploaders/SelfieSubmitButton';
import GenerateButton from '@/src/components/GenerateButton';
import CustomImage from '@/src/components/ui/Image';

type UploadPageClientProps = {
  wigId: string;
  wigImageUrl: string;
};

function WigPreview({ imageUrl }: { imageUrl: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden',
        'transition-[max-width,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'max-w-175 opacity-100',
      )}
    >
      <div
        className={cn(
          'w-full h-full',
          'transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'translate-x-0',
        )}
      >
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          פאה שנבחרה
        </p>
        <CustomImage
          src={imageUrl}
          alt="Selected wig"
          className={cn(
            'object-cover',
            'transition-[transform,filter] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'scale-100 blur-0',
          )}
        />
      </div>
    </div>
  );
}

type UploadState =
  | { stage: 'idle' }
  | { stage: 'file-selected'; file: File; previewUrl: string }
  | { stage: 'uploaded'; photoId: string; previewUrl: string | null };

export default function UploadPageClient({
  wigId,
  wigImageUrl,
}: UploadPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [upload, setUpload] = useState<UploadState>(() => {
    const photoId = searchParams.get('photoId');
    return photoId
      ? { stage: 'uploaded', photoId, previewUrl: null }
      : { stage: 'idle' };
  });

  const handleFileReady = (file: File) => {
    if (upload.stage !== 'idle' && upload.previewUrl)
      URL.revokeObjectURL(upload.previewUrl);
    setUpload({
      stage: 'file-selected',
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const handleRemove = () => {
    if (upload.stage !== 'idle' && upload.previewUrl)
      URL.revokeObjectURL(upload.previewUrl);
    setUpload({ stage: 'idle' });
  };

  const handlePhotoUploaded = (newPhotoId: string) => {
    const previewUrl =
      upload.stage === 'file-selected' ? upload.previewUrl : null;
    setUpload({ stage: 'uploaded', photoId: newPhotoId, previewUrl });
    const params = new URLSearchParams(searchParams.toString());
    params.set('photoId', newPhotoId);
    router.replace(`/upload?${params.toString()}`);
  };

  const wigVisible = upload.stage === 'uploaded';
  const previewUrl = upload.stage !== 'idle' ? upload.previewUrl : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-6 overflow-hidden">
          <SelfieUploader
            previewUrl={previewUrl}
            onFileReady={handleFileReady}
            onRemove={handleRemove}
          />
        {wigVisible && <WigPreview imageUrl={wigImageUrl} />}
      </div>

      <div>
        {upload.stage === 'file-selected' && (
          <SelfieSubmitButton
            selectedFile={upload.file}
            previewUrl={upload.previewUrl}
            onSuccess={handlePhotoUploaded}
          />
        )}
        {upload.stage === 'uploaded' && (
          <GenerateButton photoId={upload.photoId} wigId={wigId} />
        )}
      </div>
    </div>
  );
}
