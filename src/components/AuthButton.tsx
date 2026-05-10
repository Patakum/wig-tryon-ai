'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { CircleUser, LogOutIcon } from 'lucide-react';

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button onClick={() => signOut()}>
        <LogOutIcon />
      </button>
    );
  }

  return (
    <button onClick={() => signIn('google')}>
      <CircleUser />
    </button>
  );
}
