'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import WigCard from '@/src/components/WigCard';
import type { Wig } from '@/src/types';

export default function FavoritesGrid({ initialWigs }: { initialWigs: Wig[] }) {
  const [wigs, setWigs] = useState(initialWigs);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(wig: Wig) {
    const previous = wigs;
    setError(null);
    setWigs(previous.filter((item) => item.id !== wig.id));

    try {
      const res = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wigId: wig.id }),
      });

      if (!res.ok) {
        throw new Error('Failed to remove favorite');
      }
    } catch {
      setWigs(previous);
      setError('לא הצלחנו להסיר את הפאה מהמועדפים. נסי שוב.');
    }
  }

  if (wigs.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-gray-700">עדיין לא שמרת פאות במועדפים.</p>
        {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
        <Link href="/catalog" className="underline">
          לקטלוג הפאות
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-3 list-none">
        {wigs.map((wig) => (
          <li key={wig.id} className="relative">
            <WigCard {...wig} href={`/wigs/${wig.id}`} />
            <button
              type="button"
              onClick={() => handleRemove(wig)}
              aria-label={`הסירי את ${wig.name} מהמועדפים`}
              className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow"
            >
              <Heart size={18} className="fill-red-500 text-red-500" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
