'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/src/components/ui/button';

type GenerateButtonProps = {
  photoId: string;
  wigId: string;
};

export default function GenerateButton({
  photoId,
  wigId,
}: GenerateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post('/api/generate', {
        photoId,
        wigId,
      });

      router.push(`/result?id=${res.data.generationId}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message ?? 'Generation failed');
      } else {
        setError('Generation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        onClick={handleGenerate}
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading ? 'Generating...' : 'Generate'}
      </Button>
    </div>
  );
}
