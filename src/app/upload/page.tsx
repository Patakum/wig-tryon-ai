'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Image from 'next/image';

export default function UploadPage() {
  const [image, setImage] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result as string;

      const res = await axios.post('/api/upload', {
        file: base64,
      });

      setImage(res.data.imageUrl);
    };

    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Upload your selfie</h1>

      <div
        {...getRootProps()}
        className="border-2 border-dashed p-10 text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        <p>Drag & drop or click to upload</p>
      </div>

      {image && (
        <Image
          src={image}
          alt="uploaded"
          className="mt-4 rounded-xl"
          width={500}
          height={500}
        />
      )}
    </div>
  );
}
