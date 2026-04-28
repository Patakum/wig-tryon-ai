'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

type ValidateFile = (file: File) => string | null | Promise<string | null>;
type PreprocessFile = (file: File) => Promise<File>;
type UploadRequest<TResult> = (file: File) => Promise<TResult>;
type OnSuccess<TResult> = (result: TResult) => void | Promise<void>;

type BaseImageUploaderProps<TResult> = {
  placeholder?: React.ReactNode;
  maxSizeMB?: number;
  invalidTypeMessage?: string;
  uploadFailedMessage?: string;
  dropzoneClassName?: string;
  showDropzone?: boolean;
  validateFile?: ValidateFile;
  preprocessFile?: PreprocessFile;
  uploadRequest?: UploadRequest<TResult>;
  onSuccess?: OnSuccess<TResult>;
};

export default function BaseImageUploader<TResult>({
  placeholder = 'גרור ושחרר או לחץ כדי להעלות תמונה',
  maxSizeMB = 10,
  dropzoneClassName = 'cursor-pointer border-2 border-dashed p-10 text-center',
  showDropzone = true,
  validateFile,
  preprocessFile,
  uploadRequest = async (file) => file as unknown as TResult,
  onSuccess,
}: BaseImageUploaderProps<TResult>) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFailedMessage =
    'העלאה נכשלה. אנא נסה שנית. Upload failed. Please try another image.';

  const maxBytes = maxSizeMB * 1024 * 1024;

  const onDrop = async (acceptedFiles: File[]) => {
    setErrorMessage(null);
    const file = acceptedFiles[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        'בבקשה העלה קובץ תמונה בלבד. Please upload an image file only.',
      );
      return;
    }

    if (file.size > maxBytes) {
      setErrorMessage(`Image is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    try {
      const customValidationError = validateFile
        ? await validateFile(file)
        : null;

      if (customValidationError) {
        setErrorMessage(customValidationError);
        return;
      }

      setIsUploading(true);

      const processedFile = preprocessFile ? await preprocessFile(file) : file;
      const uploadResult = await uploadRequest?.(processedFile);

      await onSuccess?.(uploadResult);
    
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.error?.message ?? uploadFailedMessage,
        );
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : uploadFailedMessage,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': [],
    },
    maxSize: maxBytes,
    disabled: isUploading,
  });

  return (
    <div>
      {showDropzone && (
        <div {...getRootProps()} className={dropzoneClassName}>
          <input {...getInputProps()} />
          <p>{placeholder}</p>
        </div>
      )}

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}

      {isUploading && <Loader2 className="mx-auto mt-4 animate-spin" />}
    </div>
  );
}
