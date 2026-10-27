'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';

type DeleteBatch = { deleted: number; failed: number; remaining: number };

export default function DeleteAllTryOnsButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteAll() {
    setIsDeleting(true);
    setError(null);

    try {
      // The server deletes a batch per request; keep going until none remain.
      for (;;) {
        const res = await fetch('/api/my-try-ons', { method: 'DELETE' });

        if (!res.ok) {
          throw new Error('Failed to delete');
        }

        const batch: DeleteBatch = await res.json();

        if (batch.remaining === 0) {
          break;
        }

        if (batch.deleted === 0) {
          throw new Error('No progress');
        }
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError('לא הצלחנו למחוק את כל הניסיונות. נסי שוב.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isDeleting && setOpen(next)}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="mt-6 w-full">
          מחיקת כל הניסיונות שלי
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>למחוק את כל הניסיונות?</DialogTitle>
          <DialogDescription>
            כל התוצאות, התמונות שהעלית והמשוב יימחקו לצמיתות. לא ניתן לשחזר.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              ביטול
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleDeleteAll} disabled={isDeleting}>
            {isDeleting ? 'מוחק...' : 'מחיקת הכל'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
