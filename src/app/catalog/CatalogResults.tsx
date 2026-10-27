'use client';

import { useState } from 'react';
import Link from 'next/link';
import WigGrid from '@/src/components/WigGrid';
import { Button } from '@/src/components/ui/button';
import type { CatalogPage } from '@/src/services/catalog';

type Props = {
  initialPage: CatalogPage;
  // Current search/filter/sort params, without a cursor.
  queryString: string;
  isFiltered: boolean;
};

export default function CatalogResults({
  initialPage,
  queryString,
  isFiltered,
}: Props) {
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!nextCursor || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(queryString);
      params.set('cursor', nextCursor);

      const res = await fetch(`/api/catalog?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Failed to load wigs');
      }

      const page: CatalogPage = await res.json();
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      setError('לא הצלחנו לטעון עוד פאות. נסי שוב.');
    } finally {
      setIsLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-gray-700">
          {isFiltered ? 'לא נמצאו פאות שמתאימות לחיפוש.' : 'אין פאות להצגה.'}
        </p>
        {isFiltered && (
          <Link href="/catalog" className="underline">
            ניקוי חיפוש
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <WigGrid wigs={items} />
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <Button type="button" onClick={loadMore} disabled={isLoading}>
            {isLoading ? 'טוען...' : 'טעינת עוד'}
          </Button>
        </div>
      )}
    </>
  );
}
