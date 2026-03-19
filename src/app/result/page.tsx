'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function ResultPage() {
  const params = useSearchParams();
  const id = params.get('id');

  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`/api/generation?id=${id}`);
      setImage(res.data.resultImageUrl);
    };

    fetchData();
  }, [id]);

  if (!image) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1>Your Result</h1>
      <img src={image} alt="result" className="mt-4 rounded-xl" />
    </div>
  );
}