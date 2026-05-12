'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { CircleUser, LogOutIcon } from 'lucide-react';

export default function AuthButton({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) {
  const { data: session } = useSession();

  if (session) {
    return (
      <button
        type="button"
        onClick={() => signOut()}
        className={className}
        aria-label="Sign out"
      >
        <LogOutIcon size={size} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn('google')}
      className={className}
      aria-label="Sign in with Google"
    >
      <CircleUser size={size} />
    </button>
  );
}
