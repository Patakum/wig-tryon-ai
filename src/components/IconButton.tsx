'use client';

import { ReactNode } from 'react';

type IconButtonProps = {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
};

export default function IconButton({
  children,
  label,
  onClick,
  className = 'text-gray-800 hover:scale-110 transition-transform',
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}
