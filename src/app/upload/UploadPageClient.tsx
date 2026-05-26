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
        'h-full flex flex-col overflow-hidden',
        'transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'opacity-100',
      )}
    >
      <p className="mb-2 text-sm font-medium shrink-0">פאה שנבחרה</p>
      <div
        className={cn(
          'flex-1 min-h-0 overflow-hidden',
          'transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'translate-x-0',
        )}
      >
        <CustomImage
          src={imageUrl}
          alt="Selected wig"
          className={cn(
            'w-full h-full object-contain',
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
    router.replace(`/upload?${params.toString()}`);
  };

  const wigVisible = upload.stage === 'uploaded';
  const previewUrl = upload.stage !== 'idle' ? upload.previewUrl : null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
        <div className="flex-1 min-h-0">
          <SelfieUploader
            previewUrl={previewUrl}
            onFileReady={handleFileReady}
            onRemove={handleRemove}
          />
        </div>
        {wigVisible && (
          <div className="flex-1 min-h-0">
            <WigPreview imageUrl={wigImageUrl} />
          </div>
        )}
      </div>

      <div className="shrink-0">
        {upload.stage === 'file-selected' && (
          <SelfieSubmitButton
            selectedFile={upload.file}
            previewUrl={upload.previewUrl}
            onSuccess={handlePhotoUploaded}
          />
        )}
        {upload.stage === 'uploaded' && (
          <GenerateButton
            photoId={upload.photoId}
            wigId={wigId}
          />
        )}
      </div>
    </div>
  );
}
