interface HeartIconProps {
  filled?: boolean;
  className?: string;
}

export function HeartIcon({ filled = false, className = '' }: HeartIconProps) {
  return (
    <svg
      width="22"
      height="22"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      className={filled ? 'text-red-600' : 'text-gray-900'}
      aria-hidden="true"
    >
      <path d="M12 21s-6.2-5.2-8.5-8C1.1 10.1 1 7.6 3.1 5.5 5.2 3.4 8.1 3.4 10.2 5.5L12 7.3l1.8-1.8c2.1-2.1 5-2.1 7.1 0 2.1 2.1 2 4.6-.4 7.5C18.2 15.8 12 21 12 21z" />
    </svg>
  );
}
