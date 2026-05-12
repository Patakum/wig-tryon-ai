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
      <button onClick={() => signOut()} className={className}>
        <LogOutIcon size={size} />
      </button>
    );
  }

  return (
    <button onClick={() => signIn('google')} className={className}>
      <CircleUser size={size} />
    </button>
  );
}
