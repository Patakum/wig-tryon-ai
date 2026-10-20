'use client';

import { Button } from '@/src/components/ui/button';
import CustomImage from '../ui/Image';
import { cn } from '@/src/lib/utils';

type UploadedImagePreviewProps = {
  imageUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  showRemoveButton?: boolean;
  removeButtonLabel?: string;
  onRemove?: () => void;
};

export default function UploadedImagePreview({
  imageUrl,
  alt = 'uploaded',
  className,
  showRemoveButton = false,
  removeButtonLabel = 'Remove',
  onRemove,
}: UploadedImagePreviewProps) {
  return (
    <div className={cn('relative', className)}>
      <CustomImage src={imageUrl} alt={alt} className='w-full h-full object-contain'/>

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
