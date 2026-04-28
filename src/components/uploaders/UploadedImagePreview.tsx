'use client';

import Image from 'next/image';
import { Button } from '@/src/components/ui/button';

type UploadedImagePreviewProps = {
  imageUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  showRemoveButton?: boolean;
  removeButtonLabel?: string;
  onRemove?: () => void;
};

export default function UploadedImagePreview({
  imageUrl,
  alt = 'uploaded',
  width = 500,
  height = 500,
  showRemoveButton = false,
  removeButtonLabel = 'Remove',
  onRemove,
}: UploadedImagePreviewProps) {
  return (
    <div className="relative inline-block">
      <Image
        src={imageUrl}
        alt={alt}
        className="rounded-xl"
        width={width}
        height={height}
        unoptimized
      />

      {showRemoveButton ? (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="absolute top-2 right-2"
          onClick={onRemove}
        >
          {removeButtonLabel}
        </Button>
      ) : null}
    </div>
  );
}
