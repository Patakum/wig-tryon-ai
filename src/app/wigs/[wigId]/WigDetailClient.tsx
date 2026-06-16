'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronLeft } from 'lucide-react';
import Logo from '@/src/components/Logo';

export default function WigDetailClient() {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="absolute top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between px-2 py-2 transition">
        <button
          type="button"
          onClick={() => setIsFavorited(!isFavorited)}
          className="p-2"
          aria-label={isFavorited ? 'הסירי מהמועדפים' : 'הוסיפי למועדפים'}
        >
          <span>
            <svg
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
              color={isFavorited ? 'red' : 'black'}
            >
              <path d="M12 21s-6.2-5.2-8.5-8C1.1 10.1 1 7.6 3.1 5.5 5.2 3.4 8.1 3.4 10.2 5.5L12 7.3l1.8-1.8c2.1-2.1 5-2.1 7.1 0 2.1 2.1 2 4.6-.4 7.5C18.2 15.8 12 21 12 21z" />
            </svg>
          </span>
        </button>
        <div className="flex items-center justify-center gap-1">
          <Logo />
          <button
            type="button"
            onClick={() => router.push('/catalog')}
            aria-label="חזרה"
          >
            <ChevronLeft size={26} className="text-gray-800 font-bold"  />
          </button>
        </div>
      </div>
    </div>
  );
}
