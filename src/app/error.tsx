'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WigDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">משהו השתבש</h1>
      <p className="text-gray-500 text-sm">לא הצלחנו לטעון את הפאה. אנא נסי שוב.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="py-2 px-5 border border-gray-800 rounded-full text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
        >
          נסי שוב
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="py-2 px-5 bg-secondary-foreground text-white rounded-full text-sm font-semibold hover:bg-amber-800 transition"
        >
          חזרה
        </button>
      </div>
    </main>
  );
}
