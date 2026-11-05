'use client';

import { authClient } from '@/src/lib/auth-client';
import { CircleUser, LoaderIcon, LogOutIcon } from 'lucide-react';
import IconButton from './IconButton';
import Link from 'next/link';

export default function AuthButton({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <IconButton label="Loading..." className={className}>
        <LoaderIcon size={size} className="animate-spin" />
      </IconButton>
    );
  }

  if (session) {
    return (
      <IconButton
        label="Sign out"
        className={className}
        onClick={() => authClient.signOut()}
      >
        <LogOutIcon size={size} />
      </IconButton>
    );
  }

  return (
    <IconButton label="Sign in with Google" className={className}>
      <Link href="/login">
        <CircleUser size={size} />
      </Link>
    </IconButton>
  );
}
