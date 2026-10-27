'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
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
  const [consented, setConsented] = useState(false);

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
      formData.append('consent', 'true');
      const res = await axios.post('/api/upload', formData);
      onSuccess(res.data.photoId as string);
    } catch (err) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.error?.message) ||
          'העלאה נכשלה. אנא נסה שנית.',
      );
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-1"
        />
        <span>
          אני מאשרת שהתמונה שלי תעובד כמתואר ב
          <Link
            href="/privacy"
            target="_blank"
            className="underline"
          >
            מדיניות הפרטיות
          </Link>
          .
        </span>
      </label>
      <Button
        onClick={handleSubmit}
        disabled={status !== 'idle' || !consented}
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
