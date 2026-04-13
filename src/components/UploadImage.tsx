'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';

type UploadImageProps = {
  endpoint: string;
  onUpload: (imageUrl: string) => void;
  label?: string;
  placeholder?: string;
  maxSizeMB?: number;
};

export default function UploadImage({
  endpoint,
  onUpload,
  label = 'Upload Image',
  placeholder = 'Drag & drop or click to upload',
  maxSizeMB = 10,
}: UploadImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setErrorMessage(null);

      const file = acceptedFiles[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload an image file only.');
        return;
      }

      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setErrorMessage(`Image is too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result as string;

        try {
          setIsUploading(true);
          const res = await axios.post(endpoint, {
            file: base64,
          });

          setImageUrl(res.data.imageUrl);
          onUpload(res.data.imageUrl);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            setErrorMessage(
              error.response?.data?.error ?? 'Upload failed. Please try again.',
            );
            return;
          }

          setErrorMessage('Upload failed. Please try again.');
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(file);
    },
    [endpoint, onUpload, maxSizeMB],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': [],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: isUploading,
  });

  return (
    <div>
      {!imageUrl ? (
        <div
          {...getRootProps()}
          className="cursor-pointer border-2 border-dashed p-10 text-center"
        >
          <input {...getInputProps()} />
          <p>{placeholder}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG/PNG/WEBP, up to {maxSizeMB}MB
          </p>
        </div>
      ) : (
        <div className="relative inline-block">
          <Image
            src={imageUrl}
            alt="uploaded"
            className="mt-4 rounded-xl"
            width={200}
            height={200}
          />
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="absolute top-6 right-2"
            onClick={() => {
              setImageUrl(null);
              setErrorMessage(null);
            }}
          >
            Remove
          </Button>
        </div>
      )}

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      {isUploading ? (
        <p className="mt-3 text-sm text-gray-500">Uploading...</p>
      ) : null}
    </div>
  );
}
