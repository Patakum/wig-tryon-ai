'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronLeft } from 'lucide-react';
import Logo from '@/src/components/Logo';

interface WigDetailClientProps {
  wigId: string;
}

export default function WigDetailClient({ wigId }: WigDetailClientProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="absolute top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between px-2 py-2">
        <button
          type="button"
          onClick={() => setIsFavorited(!isFavorited)}
          className="p-2"
          aria-label={isFavorited ? 'הסירי מהמועדפים' : 'הוסיפי למועדפים'}
        >
          <Heart
            size={24}
            className={
              isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-800'
            }
          />
        </button>
        <div className="flex items-center justify-center gap-1">
          <Logo />
          <button type="button" onClick={() => router.back()} aria-label="חזרה">
            <ChevronLeft size={24} className="text-gray-800" />
          </button>
        </div>
      </div>
    </div>
  );
}
