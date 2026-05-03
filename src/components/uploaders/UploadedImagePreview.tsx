'use client';

import { Button } from '@/src/components/ui/button';
import CustomImage from '../ui/Image';

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
  showRemoveButton = false,
  removeButtonLabel = 'Remove',
  onRemove,
}: UploadedImagePreviewProps) {
  return (
    <div className="relative">
      <CustomImage src={imageUrl} alt={alt} />

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
