'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Logo from '@/src/components/Logo';

type Props = {
  wigId: string;
  initialFavorited: boolean;
  isSignedIn: boolean;
  autoFavorite: boolean;
  canFavorite?: boolean;
};

// A solid chip keeps the icons visible over both light and dark photos.
const CHIP =
  'flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md ring-1 ring-black/10 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:opacity-70';

async function setFavorite(wigId: string, favorited: boolean) {
  const res = await fetch('/api/favorites', {
    method: favorited ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wigId }),
  });

  if (!res.ok) {
    throw new Error('Failed to update favorite');
  }
}

export default function WigDetailClient({
  wigId,
  initialFavorited,
  isSignedIn,
  autoFavorite,
  canFavorite = true,
}: Props) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isSaving, setIsSaving] = useState(false);
  const autoFavoriteHandled = useRef(false);

  async function applyFavorite(next: boolean) {
    setIsFavorited(next);
    setIsSaving(true);

    try {
      await setFavorite(wigId, next);
    } catch {
      setIsFavorited(!next);
    } finally {
      setIsSaving(false);
    }
  }

  // Complete the save the guest started before signing in.
  useEffect(() => {
    if (!autoFavorite || autoFavoriteHandled.current) {
      return;
    }
    autoFavoriteHandled.current = true;

    if (canFavorite && isSignedIn && !initialFavorited) {
      void applyFavorite(true);
    }
    router.replace(`/wigs/${wigId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFavoriteClick() {
    if (!isSignedIn) {
      const next = encodeURIComponent(`/wigs/${wigId}?favorite=1`);
      router.push(`/login?next=${next}`);
      return;
    }

    void applyFavorite(!isFavorited);
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between px-3 py-3">
        {canFavorite ? (
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={isSaving}
            className={CHIP}
            aria-label={isFavorited ? 'הסירי מהמועדפים' : 'הוסיפי למועדפים'}
            aria-pressed={isFavorited}
          >
            <svg
              width="22"
              height="22"
              fill={isFavorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              className={isFavorited ? 'text-red-600' : 'text-gray-900'}
              aria-hidden="true"
            >
              <path d="M12 21s-6.2-5.2-8.5-8C1.1 10.1 1 7.6 3.1 5.5 5.2 3.4 8.1 3.4 10.2 5.5L12 7.3l1.8-1.8c2.1-2.1 5-2.1 7.1 0 2.1 2.1 2 4.6-.4 7.5C18.2 15.8 12 21 12 21z" />
            </svg>
          </button>
        ) : (
          <span className="size-10" aria-hidden="true" />
        )}
        <div className="flex items-center justify-center gap-2">
          <Logo />
          <button
            type="button"
            onClick={() => router.push('/catalog')}
            className={CHIP}
            aria-label="חזרה"
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
