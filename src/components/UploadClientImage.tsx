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
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result as string;

      const res = await axios.post('/api/upload', {
        file: base64,
      });

      setImage(res.data);
    };

    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div
        {...getRootProps()}
        className="cursor-pointer border-2 border-dashed p-10 text-center"
      >
        <input {...getInputProps()} />
        <p>גרור ושחרר או לחץ כדי להעלות תמונה</p>
      </div>

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