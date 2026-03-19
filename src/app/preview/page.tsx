'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';

export default function PreviewPage() {
  const params = useSearchParams();
  const router = useRouter();

  const photoId = params.get('photoId');
  const wigId = params.get('wigId');

  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);

    const res = await axios.post('/api/generate', {
      photoId,
      wigId,
    });

    router.push(`/result?id=${res.data.generationId}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-lg mb-4">Confirm your selection</h1>

      <p>Photo ID: {photoId}</p>
      <p>Wig ID: {wigId}</p>

      <button
        onClick={handleGenerate}
        className="mt-4 bg-black text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}