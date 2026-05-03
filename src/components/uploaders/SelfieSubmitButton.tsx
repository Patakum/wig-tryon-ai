'use client';

import { useState } from 'react';
import axios from 'axios';
import { validateFaceInImage } from '@/src/lib/face-detection';
import { Button } from '@/src/components/ui/button';

type Status = 'idle' | 'validating' | 'uploading';

type SelfieSubmitButtonProps = {
  selectedFile: File;
  previewUrl: string;
  onSuccess: (photoId: string) => void;
};

export default function SelfieSubmitButton({
  selectedFile,
  previewUrl,
  onSuccess,
}: SelfieSubmitButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Step 1: face validation
    setStatus('validating');
    const { blocked, message } = await validateFaceInImage(previewUrl);

    if (blocked) {
      setStatus('idle');
      setError(message);
      return;
    }

    // Step 2: upload
    setStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await axios.post('/api/upload', formData);
      onSuccess(res.data.photoId as string);
    } catch {
      setError('העלאה נכשלה. אנא נסה שנית.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        onClick={handleSubmit}
        disabled={status !== 'idle'}
        size="lg"
        className="w-full"
      >
        {status === 'validating'
          ? 'בודק תמונה...'
          : status === 'uploading'
            ? 'שומר תמונה...'
            : 'שלח תמונה'}
      </Button>
    </div>
  );
}
