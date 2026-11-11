'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/src/lib/auth-client';
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

type Props = {
  children: ReactNode;
  className?: string;
  label?: string;
  onSignedOut?: () => void;
};

// A single tap used to sign the customer out immediately; ask first.
export default function SignOutDialog({
  children,
  className,
  label = 'התנתקות',
  onSignedOut,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      setOpen(false);
      onSignedOut?.();
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSigningOut && setOpen(next)}>
      <DialogTrigger asChild>
        <button type="button" aria-label={label} className={className}>
          {children}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">להתנתק?</DialogTitle>
          <DialogDescription className="text-center">
            את תוכלי להתחבר שוב בכל רגע.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSigningOut}>
              ביטול
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? 'מתנתקת...' : 'התנתקות'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
