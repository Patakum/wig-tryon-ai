'use client';

import { authClient } from '@/src/lib/auth-client';
import { CircleUser, LogOutIcon } from 'lucide-react';
import IconButton from './IconButton';

export default function AuthButton({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  const { data: session } = authClient.useSession();

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
    <IconButton
      label="Sign in with Google"
      className={className}
      onClick={() => authClient.signIn.social({ provider: 'google' })}
    >
      <CircleUser size={size} />
    </IconButton>
  );
}
