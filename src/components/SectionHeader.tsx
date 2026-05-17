import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  viewAllLink?: string;
}

export default function SectionHeader({
  title,
  viewAllLink,
}: SectionHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b bg-secondary border-stone-200 px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-stone-700">
        {title}
      </h2>
      {viewAllLink && (
        <Link
          href={viewAllLink}
          className="text-xs text-center font-semibold text-stone-700 transition-colors hover:text-stone-900"
        >
          לראות את כל המוצרים
        </Link>
      )}
    </header>
  );
}
