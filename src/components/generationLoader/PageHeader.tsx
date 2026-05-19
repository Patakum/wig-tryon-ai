import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Logo from '@/src/components/Logo';

type PageHeaderProps = {
  title: string;
  backHref: string;
  backLabel?: string;
};

export default function PageHeader({
  title,
  backHref,
  backLabel = 'חזרה',
}: PageHeaderProps) {
  return (
    <header className="mb-4 grid grid-cols-3 gap-1">
      <Logo />
      <h1 className="text-xl font-semibold text-center">{title}</h1>
      <div className="flex items-center justify-end gap-1">
        <Link href={backHref} aria-label={backLabel}>
          <ChevronLeft size={24} />
        </Link>
      </div>
    </header>
  );
}
