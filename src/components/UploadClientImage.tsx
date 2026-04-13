'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { UploadedPhoto } from '@/src/types';

type UploadPageClientProps = {
  wigId: string;
};

export default function UploadClientImage({ wigId }: UploadPageClientProps) {
  const [image, setImage] = useState<UploadedPhoto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      setErrorMessage('Image is too small/low quality. Please upload a clearer selfie.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result as string;

      try {
        const res = await axios.post('/api/upload', {
          file: base64,
        });

        setImage(res.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(error.response?.data?.error ?? 'Upload failed. Please try another selfie.');
          return;
        }

        setErrorMessage('Upload failed. Please try another selfie.');
      }
    };

    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': [],
    },
    maxSize: 10 * 1024 * 1024,
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
          העלו סלפי ברור: פנים קדמיות, אדם אחד בלבד, תאורה טובה, ללא מסכה/משקפי שמש.
        </p>
        <p className="text-xs text-muted-foreground">
          JPG/PNG/WEBP עד 10MB, מומלץ רזולוציה 640px ומעלה.
        </p>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      {image ? (
        <>
          <Image
            src={image.imageUrl}
            alt="uploaded"
            className="mt-4 rounded-xl"
            width={500}
            height={500}
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