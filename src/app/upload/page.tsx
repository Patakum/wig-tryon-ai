'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { UploadedPhoto } from '@/src/types';

export default function UploadPage() {
  const [image, setImage] = useState<UploadedPhoto | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const wigId = params.get('wigId');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

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

  if (!wigId) {
    return <p>Missing wig selection</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">תעלה תמונה של עצמך</h1>
      <p className="mb-2">פאה נבחרה: {wigId}</p>

      <div
        {...getRootProps()}
        className="border-2 border-dashed p-10 text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        <p>גרור ושחרר או לחץ כדי להעלות תמונה</p>
      </div>

      {image && (
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
      )}
    </div>
  );
}
