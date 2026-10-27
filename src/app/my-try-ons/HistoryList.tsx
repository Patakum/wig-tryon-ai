'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import type { HistoryEntry, HistoryPage } from '@/src/services/history';

const dateFormat = new Intl.DateTimeFormat('he-IL', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

function EntryCard({ entry }: { entry: HistoryEntry }) {
  const isPending = entry.status === 'pending';
  const href = isPending
    ? `/result?id=${encodeURIComponent(entry.id)}`
    : `/my-try-ons/${encodeURIComponent(entry.id)}`;

  return (
    <Link href={href} className="block">
      <div className="aspect-4/5 overflow-hidden rounded-xl bg-gray-100">
        {isPending ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-600">
            בתהליך יצירה...
          </div>
        ) : (
          <Image
            src={`/api/generations/${encodeURIComponent(entry.id)}/image`}
            alt={`התוצאה עם ${entry.wigName}`}
            width={300}
            height={375}
            className="h-full w-full object-cover"
            unoptimized
          />
        )}
      </div>
      <div className="mt-1 flex flex-col text-sm">
        <h3>{entry.wigName}</h3>
        <p className="text-muted-foreground">
          {dateFormat.format(new Date(entry.createdAt))}
        </p>
        {!isPending && (
          <p className="text-xs text-muted-foreground">
            {entry.hasFeedback ? 'משוב נשלח' : 'עדיין ללא משוב'}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function HistoryList({
  initialPage,
}: {
  initialPage: HistoryPage;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!nextCursor || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/my-try-ons?cursor=${encodeURIComponent(nextCursor)}`,
      );

      if (!res.ok) {
        throw new Error('Failed to load history');
      }

      const page: HistoryPage = await res.json();
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      setError('לא הצלחנו לטעון עוד ניסיונות. נסי שוב.');
    } finally {
      setIsLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-gray-700">עדיין לא ניסית פאה.</p>
        <Link href="/catalog" className="underline">
          לקטלוג הפאות
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 list-none">
        {items.map((entry) => (
          <li key={entry.id}>
            <EntryCard entry={entry} />
          </li>
        ))}
      </ul>
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
