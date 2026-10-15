import BaseImageUploader from '@/src/components/uploaders/BaseImageUploader';
import UploadedImagePreview from '@/src/components/uploaders/UploadedImagePreview';

type WigUploaderProps = {
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
  placeholder?: string;
  maxSizeMB?: number;
};

export default function WigUploader({
  onFileSelect,
  previewUrl,
  placeholder = 'גרור ושחרר או לחץ כדי להעלות פאה. Drag & drop or click to upload a wig.',
}: WigUploaderProps) {

  return (
    <div>
      <BaseImageUploader<File>
        placeholder={placeholder}
        showDropzone={!previewUrl}
        onSuccess={(file) => onFileSelect(file)}
      />

      {previewUrl ? (
        <div className="mt-4">
          <UploadedImagePreview
            imageUrl={previewUrl}
            showRemoveButton
            onRemove={() => onFileSelect(null)}
          />
        </div>
      ) : null}
    </div>
  );
}
