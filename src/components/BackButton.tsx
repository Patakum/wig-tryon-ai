'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type BackButtonProps = {
  /** Custom destination. When omitted, goes back in browser history. */
  href?: string;
  /** Used when there is no history to go back to. */
  fallbackHref?: string;
  label?: string;
  size?: number;
  className?: string;
};

export default function BackButton({
  href,
  fallbackHref = '/',
  label = 'חזרה',
  size = 24,
  className = 'inline-flex p-1 text-gray-800',
}: BackButtonProps) {
  const router = useRouter();
  const icon = <ChevronLeft size={size} />;

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={className}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
    >
      {icon}
    </button>
  );
}
