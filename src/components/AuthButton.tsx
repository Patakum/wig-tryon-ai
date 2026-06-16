'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { CircleUser, LogOutIcon } from 'lucide-react';
import IconButton from './IconButton';

export default function AuthButton({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  const { data: session } = useSession();

  if (session) {
    return (
      <IconButton
        label="Sign out"
        className={className}
        onClick={() => signOut()}
      >
        <LogOutIcon size={size} />
      </IconButton>
    );
  }

  return (
    <IconButton
      label="Sign in with Google"
      className={className}
      onClick={() => signIn('google')}
    >
      <CircleUser size={size} />
    </IconButton>
  );
}
