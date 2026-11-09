import Link from 'next/link';
import { Button } from '@/src/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <p className="text-5xl font-light text-stone-400" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl font-semibold text-gray-900">העמוד לא נמצא</h1>
      <p className="max-w-xs text-sm text-gray-600">
        ייתכן שהקישור שגוי או שהעמוד הוסר. אפשר לחזור לדף הבית או לעיין
        בקטלוג.
      </p>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/">לדף הבית</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/catalog">לקטלוג</Link>
        </Button>
      </div>
    </main>
  );
}
