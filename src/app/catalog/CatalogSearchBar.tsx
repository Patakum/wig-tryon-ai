'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import type { CatalogQuery } from '@/src/services/catalog';

export default function CatalogSearchBar({ query }: { query: CatalogQuery }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFilters =
    query.min !== undefined || query.max !== undefined || query.sort !== 'newest';
  const isFiltered = Boolean(query.q) || hasFilters;

  // The nav search icon links to /catalog#search.
  useEffect(() => {
    function focusIfRequested() {
      if (window.location.hash === '#search') {
        inputRef.current?.focus();
      }
    }

    focusIfRequested();
    window.addEventListener('hashchange', focusIfRequested);

    return () => window.removeEventListener('hashchange', focusIfRequested);
  }, []);

  return (
    <form
      id="search"
      method="get"
      action="/catalog"
      role="search"
      className="space-y-2 p-3"
    >
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={query.q ?? ''}
          maxLength={100}
          placeholder="חיפוש פאה..."
          aria-label="חיפוש פאה"
        />
        <Button type="submit" size="icon" aria-label="חיפוש">
          <Search size={16} />
        </Button>
      </div>

      <details open={hasFilters}>
        <summary className="cursor-pointer text-sm text-gray-700">
          סינון ומיון
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-sm">
            מחיר מינימלי (₪)
            <Input
              type="number"
              name="min"
              min={0}
              step="1"
              inputMode="numeric"
              defaultValue={query.min ?? ''}
            />
          </label>
          <label className="text-sm">
            מחיר מקסימלי (₪)
            <Input
              type="number"
              name="max"
              min={0}
              step="1"
              inputMode="numeric"
              defaultValue={query.max ?? ''}
            />
          </label>
          <label className="col-span-2 text-sm">
            מיון
            <select
              name="sort"
              defaultValue={query.sort}
              className="mt-0.5 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="newest">החדשות ביותר</option>
              <option value="price_asc">מחיר: מהנמוך לגבוה</option>
              <option value="price_desc">מחיר: מהגבוה לנמוך</option>
            </select>
          </label>
        </div>
      </details>

      {isFiltered && (
        <Link href="/catalog" className="inline-block text-sm underline">
          ניקוי חיפוש
        </Link>
      )}
    </form>
  );
}
