'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';

type GenerationCreationAccess = {
  canCreateGeneration: boolean;
  requiresLoginToGenerateAgain: boolean;
  message: string | null;
};

type GenerateButtonProps = {
  photoId: string;
  wigId: string;
};

export default function GenerateButton({
  photoId,
  wigId,
}: GenerateButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const nextPath = (() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();

  const showLoginRequiredDialog = (fallbackMessage: string) => {
    setError(fallbackMessage);
    setShowLoginDialog(true);
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: access } =
        await axios.get<GenerationCreationAccess>('/api/generate');

      if (!access.canCreateGeneration) {
        if (access.requiresLoginToGenerateAgain) {
          showLoginRequiredDialog(
            access.message ?? 'כדי ליצור תמונה נוספת, עליך להתחבר תחילה.',
          );
          return;
        }

        setError(access.message ?? 'יצירת התמונה נכשלה');
        return;
      }

      const res = await axios.post('/api/generate', {
        photoId,
        wigId,
      });

      router.push(`/result?id=${res.data.generationId}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.error?.code;
        const message =
          err.response?.data?.error?.message ?? 'הפעולה נכשלה';

        if (code === 'GENERATION_LOGIN_REQUIRED') {
          showLoginRequiredDialog(message);
          return;
        }

        setError(message);
      } else {
        setError('הפעולה נכשלה');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        onClick={handleGenerate}
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading ? 'מכין...' : 'תראה לי את עצמי עם הפאה!'}
      </Button>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-center'>התחבר כדי ליצור תמונה נוספת</DialogTitle>
            <DialogDescription>
              כבר השתמשת ביצירת האורח שלך. אם ברצונך ליצור ניסיון נוסף, אנא
              התחבר תחילה.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLoginDialog(false)}
            >
              לא עכשיו
            </Button>
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
                התחבר
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
