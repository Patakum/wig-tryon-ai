import BackButton from '@/src/components/BackButton';
import Logo from '@/src/components/Logo';

type PageHeaderProps = {
  title: string;
  /** Custom back destination; omit to go back in history. */
  backHref?: string;
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
        <BackButton href={backHref} label={backLabel} />
      </div>
    </header>
  );
}
