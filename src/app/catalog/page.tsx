'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import WigCard from '@/src/components/WigCard';
import { useRouter } from 'next/navigation';
import { Wig } from '@/src/types';

export default function CatalogPage() {
  const [wigs, setWigs] = useState<Wig[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchWigs = async () => {
      const res = await axios.get('/api/wigs');
      setWigs(res.data);
    };

    fetchWigs();
  }, []);

  const handleSelect = (wigId: string) => {
    router.push(`/upload?wigId=${wigId}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">בחר פאה</h1>

      <div className="grid grid-cols-2 gap-4">
        {wigs.map((wig) => (
          <WigCard key={wig.id} wig={wig} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
