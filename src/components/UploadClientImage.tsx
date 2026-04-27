'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { UploadedPhoto } from '@/src/types';

type UploadPageClientProps = {
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

export default function UploadClientImage({ wigId }: UploadPageClientProps) {
  const [image, setImage] = useState<UploadedPhoto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setErrorMessage(null);

    const file = acceptedFiles[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file only.');
      return;
    }

    if (file.size < 60 * 1024) {
      setErrorMessage(
        'Image is too small/low quality. Please upload a clearer selfie.',
      );
      return;
    }

    try {
      setIsUploading(true);

      const optimizedFile = await optimizeImageForUpload(file);
      const formData = new FormData();
      formData.append('file', optimizedFile);

      const res = await axios.post('/api/upload', formData);
      setImage(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.error?.message ??
            'Upload failed. Please try another selfie.',
        );
        return;
      }

      setErrorMessage('Upload failed. Please try another selfie.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': [],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className="cursor-pointer border-2 border-dashed p-10 text-center"
      >
        <input {...getInputProps()} />
        <p>גרור ושחרר או לחץ כדי להעלות תמונה</p>
        <p className="mt-2 text-xs text-muted-foreground">
          העלו סלפי ברור: פנים קדמיות, אדם אחד בלבד, תאורה טובה, ללא מסכה/משקפי
          שמש.
        </p>
        <p className="text-xs text-muted-foreground">
          JPG/PNG/WEBP עד 10MB, מומלץ רזולוציה 640px ומעלה.
        </p>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      {isUploading ? (
        <p className="mt-3 text-sm text-gray-500">Uploading...</p>
      ) : null}

      {image ? (
        <>
          <NextImage
            src={image.imageUrl}
            alt="uploaded"
            className="mt-4 rounded-xl"
            width={500}
            height={500}
            unoptimized
          />
          <Button
            className="mt-4"
            onClick={() =>
              router.push(`/preview?photoId=${image.photoId}&wigId=${wigId}`)
            }
          >
            המשך לתוצאה
          </Button>
        </>
      ) : null}
    </div>
  );
}
