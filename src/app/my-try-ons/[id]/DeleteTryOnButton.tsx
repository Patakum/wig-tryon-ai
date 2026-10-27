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

export default function DeleteTryOnButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/my-try-ons/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete');
      }

      router.push('/my-try-ons');
      router.refresh();
    } catch {
      setError('לא הצלחנו למחוק את הניסיון. נסי שוב.');
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isDeleting && setOpen(next)}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="mt-6 w-full">
          מחיקת הניסיון
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>למחוק את הניסיון?</DialogTitle>
          <DialogDescription>
            התוצאה והמשוב יימחקו לצמיתות. אם התמונה שהעלית לא בשימוש בניסיון
            אחר, גם היא תימחק.
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
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'מוחק...' : 'מחיקה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
